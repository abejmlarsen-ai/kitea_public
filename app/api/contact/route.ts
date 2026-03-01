// ─── Contact Form API Route ───────────────────────────────────────────────────
// Sends a contact form submission to kiteaao@gmail.com via Gmail SMTP.
//
// Required env vars (add to .env.local):
//   GMAIL_USER=kiteaao@gmail.com
//   GMAIL_APP_PASSWORD=<16-char Google App Password>
//
// To create a Gmail App Password:
//   1. Enable 2-Step Verification on your Google Account
//   2. Go to: myaccount.google.com/apppasswords
//   3. Generate a password for "Mail"

import { NextRequest, NextResponse } from 'next/server'
import nodemailer from 'nodemailer'

const COMPANY_EMAIL = 'kiteaao@gmail.com'

const TYPE_LABELS: Record<string, string> = {
  customer:     'Customer',
  collaborator: 'Collaborator',
  company:      'Company / Brand',
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json() as {
      name?: string
      email?: string
      queryType?: string
      message?: string
    }

    const { name, email, queryType, message } = body

    if (!name?.trim() || !email?.trim() || !message?.trim()) {
      return NextResponse.json({ error: 'Name, email, and message are required.' }, { status: 400 })
    }

    const gmailUser = process.env.GMAIL_USER
    const gmailPass = process.env.GMAIL_APP_PASSWORD

    if (!gmailUser || !gmailPass) {
      console.error('[contact] Gmail env vars not set — GMAIL_USER / GMAIL_APP_PASSWORD missing')
      return NextResponse.json(
        { error: 'Email service not configured. Please contact us directly at kiteaao@gmail.com' },
        { status: 503 }
      )
    }

    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: { user: gmailUser, pass: gmailPass },
    })

    const typeLabel = TYPE_LABELS[queryType ?? ''] ?? queryType ?? 'Unknown'

    await transporter.sendMail({
      from: `"Kitea Contact Form" <${gmailUser}>`,
      to: COMPANY_EMAIL,
      replyTo: `"${name}" <${email}>`,
      subject: `[${typeLabel}] New enquiry from ${name}`,
      html: `
        <h2 style="color:#0169aa;font-family:sans-serif;">New Contact Form Submission</h2>
        <table style="font-family:sans-serif;font-size:14px;border-collapse:collapse;width:100%;max-width:600px">
          <tr><td style="padding:8px 12px;font-weight:600;background:#f4f8ff;width:140px">Name</td>
              <td style="padding:8px 12px">${name}</td></tr>
          <tr><td style="padding:8px 12px;font-weight:600;background:#f4f8ff">Email</td>
              <td style="padding:8px 12px"><a href="mailto:${email}">${email}</a></td></tr>
          <tr><td style="padding:8px 12px;font-weight:600;background:#f4f8ff">Type</td>
              <td style="padding:8px 12px">${typeLabel}</td></tr>
          <tr><td style="padding:8px 12px;font-weight:600;background:#f4f8ff;vertical-align:top">Message</td>
              <td style="padding:8px 12px;white-space:pre-wrap">${message.trim()}</td></tr>
        </table>
      `,
      text: `Name: ${name}\nEmail: ${email}\nType: ${typeLabel}\n\nMessage:\n${message.trim()}`,
    })

    return NextResponse.json({ success: true })
  } catch (err) {
    console.error('[contact] Email send error:', err)
    return NextResponse.json({ error: 'Failed to send message. Please try again.' }, { status: 500 })
  }
}
