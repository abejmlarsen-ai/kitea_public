'use client'

import { useState, FormEvent } from 'react'
import {
  CONTACT_HONEYPOT_FIELD,
  CONTACT_MAX_EMAIL,
  CONTACT_MAX_MESSAGE,
  CONTACT_MAX_NAME,
  CONTACT_QUERY_TYPES,
  type ContactQueryType,
} from '@/lib/contact/limits'

// Message for a failed response. 400s carry a specific, user-facing reason
// from the server (e.g. "Please enter a valid email address.").
function errorFor(status: number, serverError?: string): string {
  if (status === 400) return serverError ?? 'Please check your details and try again.'
  if (status === 429) return 'You’ve sent a few messages in a short time. Please wait a few minutes and try again.'
  return 'Something went wrong. Please try again.'
}

export default function ContactForm() {
  const [name, setName]         = useState('')
  const [email, setEmail]       = useState('')
  const [queryType, setQueryType] = useState<ContactQueryType>('customer')
  const [message, setMessage]   = useState('')
  const [honeypot, setHoneypot] = useState('')
  const [status, setStatus]     = useState<'idle' | 'sending' | 'success' | 'error'>('idle')
  const [errorMsg, setErrorMsg] = useState('')

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    if (!name.trim() || !email.trim() || !message.trim()) {
      setErrorMsg('Please fill in your name, email and message.')
      setStatus('error')
      return
    }

    setStatus('sending')
    setErrorMsg('')

    try {
      const res = await fetch('/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email, queryType, message, [CONTACT_HONEYPOT_FIELD]: honeypot }),
      })

      if (res.ok) {
        setStatus('success')
        setName(''); setEmail(''); setMessage(''); setQueryType('customer'); setHoneypot('')
      } else {
        const data = await res.json().catch(() => ({})) as { error?: string }
        setErrorMsg(errorFor(res.status, data.error))
        setStatus('error')
      }
    } catch {
      setErrorMsg('Network error. Please check your connection and try again.')
      setStatus('error')
    }
  }

  if (status === 'success') {
    return (
      <div className="contact-success">
        <div className="contact-success-icon">✓</div>
        <h3>Message sent!</h3>
        <p>Thanks for reaching out. We&apos;ll get back to you soon.</p>
        <button className="contact-btn" onClick={() => setStatus('idle')}>
          Send another message
        </button>
      </div>
    )
  }

  return (
    <form className="contact-form" onSubmit={handleSubmit} noValidate>
      <div className="contact-form-row">
        <div className="contact-form-group">
          <label htmlFor="contact-name">Name</label>
          <input
            id="contact-name"
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Your name"
            maxLength={CONTACT_MAX_NAME}
            autoComplete="name"
            required
          />
        </div>
        <div className="contact-form-group">
          <label htmlFor="contact-email">Email</label>
          <input
            id="contact-email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="your@email.com"
            maxLength={CONTACT_MAX_EMAIL}
            autoComplete="email"
            required
          />
        </div>
      </div>

      <div className="contact-form-group">
        <label htmlFor="contact-type">I am a…</label>
        <select
          id="contact-type"
          value={queryType}
          onChange={(e) => setQueryType(e.target.value as ContactQueryType)}
        >
          {Object.entries(CONTACT_QUERY_TYPES).map(([value, label]) => (
            <option key={value} value={value}>{label}</option>
          ))}
        </select>
      </div>

      <div className="contact-form-group">
        <label htmlFor="contact-message">Message</label>
        <textarea
          id="contact-message"
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          placeholder="Tell us what's on your mind…"
          rows={6}
          maxLength={CONTACT_MAX_MESSAGE}
          required
        />
      </div>

      {/* Honeypot — hidden from people and assistive tech; bots fill it in. */}
      <div className="contact-hp" aria-hidden="true">
        <label htmlFor={`contact-${CONTACT_HONEYPOT_FIELD}`}>Leave this field empty</label>
        <input
          id={`contact-${CONTACT_HONEYPOT_FIELD}`}
          type="text"
          name={CONTACT_HONEYPOT_FIELD}
          value={honeypot}
          onChange={(e) => setHoneypot(e.target.value)}
          tabIndex={-1}
          autoComplete="off"
        />
      </div>

      {status === 'error' && (
        <p className="contact-error">{errorMsg}</p>
      )}

      <button
        type="submit"
        className="contact-btn"
        disabled={status === 'sending'}
      >
        {status === 'sending' ? 'Sending…' : 'Send Message'}
      </button>
    </form>
  )
}
