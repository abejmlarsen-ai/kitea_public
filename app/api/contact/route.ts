// ─── Contact Form API Route ────────────────────────────────────────────────────────────────────────────────────────
// Sends contact form submissions via Resend (onboarding@resend.dev shared domain).
//
// Required env vars:
//   RESEND_API_KEY=re_...          (from resend.com dashboard)
//   CONTACT_EMAIL=kiteaao@gmail.com  (destination inbox)

import { NextRequest, NextResponse } from 'next/server'
import { Resend } from 'resend'

const TYPE_LABELS: Record<string, string> = {
  customer:     'Customer',
  collaborator: 'Collaborator',
  company:      'Company / Brand',
}

export async function POST(req: NextRequest) {
  console.log('[contact] POST received')

  try {
    const body = await req.json() as {
      name?:      string
      email?:     string
      queryType?: string
      message?:   string
    }

    const { name, email, queryType, message } = body

    if (!name?.trim() || !email?.trim() || !message?.trim()) {
      console.log('[contact] Validation failed — missing required fields')
      return NextResponse.json(
        { error: 'Name, email, and message are required.' },
        { status: 400 }
      )
    }

    const apiKey      = process.env.RESEND_API_KEY
    const toEmail     = process.env.CONTACT_EMAIL

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

    const resend    = new Resend(apiKey)
    const typeLabel = TYPE_LABELS[queryType ?? ''] ?? queryType ?? 'Unknown'
    const subject   = `[${typeLabel}] New enquiry from ${name}`

    console.log('[contact] Sending email — subject:', subject)

    const { data, error } = await resend.emails.send({
      from:     'onboarding@resend.dev',
      to:       [toEmail],
      replyTo: `${name} <${email}>`,
      subject,
      html: `
        <h2 style="color:#0169aa;font-family:sans-serif;">New Contact Form Submission</h2>
        <table style="font-family:sans-serif;font-size:14px;border-collapse:collapse;width:100%;max-width:600px">
          <tr>
            <td style="padding:8px 12px;font-weight:600;background:#f4f8ff;width:140px">Name</td>
            <td style="padding:8px 12px">${name}</td>
          </tr>
          <tr>
            <td style="padding:8px 12px;font-weight:600;background:#f4f8ff">Email</td>
            <td style="padding:8px 12px"><a href="mailto:${email}">${email}</a></td>
          </tr>
          <tr>
            <td style="padding:8px 12px;font-weight:600;background:#f4f8ff">I am a...</td>
            <td style="padding:8px 12px">${typeLabel}</td>
          </tr>
          <tr>
            <td style="padding:8px 12px;font-weight:600;background:#f4f8ff;vertical-align:top">Message</td>
            <td style="padding:8px 12px;white-space:pre-wrap">${message.trim()}</td>
          </tr>
        </table>
      `,
      text: [
        `Name:    ${name}`,
        `Email:   ${email}`,
        `I am a:  ${typeLabel}`,
        '',
        'Message:',
        message.trim(),
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
