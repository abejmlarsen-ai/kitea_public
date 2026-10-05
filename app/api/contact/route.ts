// ─── Contact Form API Route ────────────────────────────────────────────────────────────────────────────────────────
// Sends contact form submissions via Resend. Public — no session required.
//
// Required env vars:
//   RESEND_API_KEY=re_...          (from resend.com dashboard)
//   CONTACT_EMAIL=...              (destination inbox)
// Optional:
//   CONTACT_FROM_EMAIL=...         (sender on a Resend-verified domain;
//                                   defaults to onboarding@resend.dev)
//
// Abuse protection, in order: same-origin check → per-IP rate limit →
// honeypot → field validation. Every user-supplied value is HTML-escaped
// before it goes into the email body.

import { NextRequest, NextResponse } from 'next/server'
import { Resend } from 'resend'
import {
  CONTACT_HONEYPOT_FIELD,
  CONTACT_MAX_EMAIL,
  CONTACT_MAX_MESSAGE,
  CONTACT_MAX_NAME,
  CONTACT_QUERY_TYPES,
  isContactQueryType,
} from '@/lib/contact/limits'

const DEFAULT_FROM_EMAIL = 'onboarding@resend.dev'

// ── Rate limit: 5 requests per IP per 10 minutes ──────────────────────────────
// In-memory, so it is per server instance (each serverless instance keeps its
// own count). Enough to stop a single client hammering the form; not a
// substitute for a shared store if abuse becomes real.
const RATE_LIMIT_MAX       = 5
const RATE_LIMIT_WINDOW_MS = 10 * 60 * 1000
const requestLog = new Map<string, number[]>()

function isRateLimited(ip: string, now: number): boolean {
  const recent = (requestLog.get(ip) ?? []).filter((t) => now - t < RATE_LIMIT_WINDOW_MS)

  // Drop idle IPs now and then so the map can't grow without bound.
  if (requestLog.size > 1000) {
    for (const [key, times] of requestLog) {
      if (times.every((t) => now - t >= RATE_LIMIT_WINDOW_MS)) requestLog.delete(key)
    }
  }

  if (recent.length >= RATE_LIMIT_MAX) {
    requestLog.set(ip, recent)
    return true
  }
  recent.push(now)
  requestLog.set(ip, recent)
  return false
}

function clientIp(req: NextRequest): string {
  const forwarded = req.headers.get('x-forwarded-for')
  return forwarded?.split(',')[0]?.trim() || req.headers.get('x-real-ip') || 'unknown'
}

// ── Same-origin check ─────────────────────────────────────────────────────────
// Browsers always send Origin on a fetch() POST. It must name this site's host.
function isSameOrigin(req: NextRequest): boolean {
  const origin = req.headers.get('origin')
  const host   = req.headers.get('x-forwarded-host') ?? req.headers.get('host')
  if (!origin || !host) return false
  try {
    return new URL(origin).host === host
  } catch {
    return false
  }
}

// ── Validation helpers ────────────────────────────────────────────────────────
// Deliberately conservative: one @, no whitespace, no characters that are
// special in an address header (<>()[]\,;:"), and a dot in the domain.
const EMAIL_PATTERN = /^[^\s@<>()[\]\\,;:"]+@[^\s@<>()[\]\\,;:"]+\.[^\s@<>()[\]\\,;:"]+$/

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
}

function badRequest(error: string) {
  return NextResponse.json({ error }, { status: 400 })
}

export async function POST(req: NextRequest) {
  console.log('[contact] POST received')

  if (!isSameOrigin(req)) {
    console.log('[contact] Rejected — Origin does not match host:', req.headers.get('origin'))
    return NextResponse.json({ error: 'Forbidden.' }, { status: 403 })
  }

  const ip = clientIp(req)
  if (isRateLimited(ip, Date.now())) {
    console.log('[contact] Rate limited:', ip)
    return NextResponse.json(
      { error: 'Too many messages. Please wait a few minutes and try again.' },
      { status: 429, headers: { 'Retry-After': String(RATE_LIMIT_WINDOW_MS / 1000) } }
    )
  }

  let body: Record<string, unknown>
  try {
    const parsed: unknown = await req.json()
    if (!parsed || typeof parsed !== 'object') return badRequest('Invalid request.')
    body = parsed as Record<string, unknown>
  } catch {
    return badRequest('Invalid request.')
  }

  // Honeypot: hidden from people, so only bots fill it. Pretend it worked.
  const honeypot = body[CONTACT_HONEYPOT_FIELD]
  if (typeof honeypot === 'string' && honeypot.trim() !== '') {
    console.log('[contact] Honeypot filled — discarding submission from', ip)
    return NextResponse.json({ success: true })
  }

  const asText = (v: unknown) => (typeof v === 'string' ? v.trim() : '')
  const name      = asText(body.name)
  const email     = asText(body.email)
  const message   = asText(body.message)
  const queryType = body.queryType

  if (!name || !email || !message) {
    console.log('[contact] Validation failed — missing required fields')
    return badRequest('Name, email, and message are required.')
  }
  if (name.length > CONTACT_MAX_NAME) {
    return badRequest(`Name must be ${CONTACT_MAX_NAME} characters or fewer.`)
  }
  if (email.length > CONTACT_MAX_EMAIL || !EMAIL_PATTERN.test(email)) {
    return badRequest('Please enter a valid email address.')
  }
  if (message.length > CONTACT_MAX_MESSAGE) {
    return badRequest(`Message must be ${CONTACT_MAX_MESSAGE} characters or fewer.`)
  }
  if (!isContactQueryType(queryType)) {
    console.log('[contact] Validation failed — unknown queryType:', queryType)
    return badRequest('Please choose who you are from the list.')
  }

  try {
    const apiKey    = process.env.RESEND_API_KEY
    const toEmail   = process.env.CONTACT_EMAIL
    const fromEmail = process.env.CONTACT_FROM_EMAIL?.trim() || DEFAULT_FROM_EMAIL

    if (!apiKey) {
      console.error('[contact] RESEND_API_KEY is not set')
      return NextResponse.json(
        { error: 'Email service not configured.' },
        { status: 503 }
      )
    }

    if (!toEmail) {
      console.error('[contact] CONTACT_EMAIL is not set')
      return NextResponse.json(
        { error: 'Email service not configured.' },
        { status: 503 }
      )
    }

    // Header-safe name: no CR/LF (subject), no quotes/angle brackets (Reply-To).
    const headerName = name.replace(/[\r\n]+/g, ' ').replace(/["<>\\]/g, '').trim() || 'Website visitor'
    const typeLabel  = CONTACT_QUERY_TYPES[queryType]
    const subject    = `[${typeLabel}] New enquiry from ${headerName}`

    const html = {
      name:    escapeHtml(name),
      email:   escapeHtml(email),
      type:    escapeHtml(typeLabel),
      message: escapeHtml(message),
    }

    const resend = new Resend(apiKey)
    console.log('[contact] Sending email — subject:', subject)

    const { data, error } = await resend.emails.send({
      from:     fromEmail,
      to:       [toEmail],
      replyTo: `"${headerName}" <${email}>`,
      subject,
      html: `
        <h2 style="color:#0169aa;font-family:sans-serif;">New Contact Form Submission</h2>
        <table style="font-family:sans-serif;font-size:14px;border-collapse:collapse;width:100%;max-width:600px">
          <tr>
            <td style="padding:8px 12px;font-weight:600;background:#f4f8ff;width:140px">Name</td>
            <td style="padding:8px 12px">${html.name}</td>
          </tr>
          <tr>
            <td style="padding:8px 12px;font-weight:600;background:#f4f8ff">Email</td>
            <td style="padding:8px 12px"><a href="mailto:${html.email}">${html.email}</a></td>
          </tr>
          <tr>
            <td style="padding:8px 12px;font-weight:600;background:#f4f8ff">I am a...</td>
            <td style="padding:8px 12px">${html.type}</td>
          </tr>
          <tr>
            <td style="padding:8px 12px;font-weight:600;background:#f4f8ff;vertical-align:top">Message</td>
            <td style="padding:8px 12px;white-space:pre-wrap">${html.message}</td>
          </tr>
        </table>
      `,
      text: [
        `Name:    ${name}`,
        `Email:   ${email}`,
        `I am a:  ${typeLabel}`,
        '',
        'Message:',
        message,
      ].join('\n'),
    })

    if (error) {
      console.error('[contact] Resend API error:', error)
      return NextResponse.json(
        { error: 'Failed to send message. Please try again.' },
        { status: 500 }
      )
    }

    console.log('[contact] Email sent OK — id:', data?.id)
    return NextResponse.json({ success: true })

  } catch (err) {
    console.error('[contact] Unexpected error:', err)
    return NextResponse.json(
      { error: 'Failed to send message. Please try again.' },
      { status: 500 }
    )
  }
}
