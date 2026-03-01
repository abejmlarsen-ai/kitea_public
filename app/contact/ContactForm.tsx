'use client'

import { useState, FormEvent } from 'react'

type QueryType = 'customer' | 'collaborator' | 'company'

export default function ContactForm() {
  const [name, setName]         = useState('')
  const [email, setEmail]       = useState('')
  const [queryType, setQueryType] = useState<QueryType>('customer')
  const [message, setMessage]   = useState('')
  const [status, setStatus]     = useState<'idle' | 'sending' | 'success' | 'error'>('idle')
  const [errorMsg, setErrorMsg] = useState('')

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    if (!name.trim() || !email.trim() || !message.trim()) return

    setStatus('sending')
    setErrorMsg('')

    try {
      const res = await fetch('/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email, queryType, message }),
      })

      if (res.ok) {
        setStatus('success')
        setName(''); setEmail(''); setMessage(''); setQueryType('customer')
      } else {
        const data = await res.json() as { error?: string }
        setErrorMsg(data.error ?? 'Something went wrong. Please try again.')
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
            required
          />
        </div>
      </div>

      <div className="contact-form-group">
        <label htmlFor="contact-type">I am a…</label>
        <select
          id="contact-type"
          value={queryType}
          onChange={(e) => setQueryType(e.target.value as QueryType)}
        >
          <option value="customer">Customer</option>
          <option value="collaborator">Collaborator</option>
          <option value="company">Company / Brand</option>
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
          required
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
