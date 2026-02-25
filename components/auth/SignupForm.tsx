
'use client'
// ─── Sign-up Form (Client Component) ─────────────────────────────────────────

import { useState, FormEvent } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'

export default function SignupForm() {
  const [form, setForm] = useState({
    first_name: '',
    last_name: '',
    date_of_birth: '',
    email: '',
    mobile_number: '',
    password: '',
    confirm_password: '',
  })
  const [error, setError]     = useState('')
  const [success, setSuccess] = useState('')
  const [loading, setLoading] = useState(false)
  const router                = useRouter()

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    setForm({ ...form, [e.target.name]: e.target.value })
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setError('')
    setSuccess('')

    if (form.password !== form.confirm_password) {
      setError('Passwords do not match.')
      return
    }
    if (form.password.length < 6) {
      setError('Password must be at least 6 characters.')
      return
    }

    setLoading(true)

    const supabase = createClient()
    const { data, error: authError } = await supabase.auth.signUp({
      email: form.email,
      password: form.password,
      options: {
        data: {
          first_name: form.first_name,
          last_name: form.last_name,
          date_of_birth: form.date_of_birth || null,
          mobile_number: form.mobile_number || null,
        },
      },
    })

    setLoading(false)

    if (authError) {
      setError(authError.message)
      return
    }

    if (data.session) {
      // Email confirmation disabled — user is immediately signed in
      setSuccess(`Welcome, ${form.first_name}! Account created. Taking you to your library…`)
      setTimeout(() => {
        router.push('/library')
        router.refresh()
      }, 1500)
    } else {
      // Email confirmation required
      setSuccess(
        `Account created! A verification email has been sent to ${form.email}. ` +
        `Please check your inbox, then log in.`
      )
      setTimeout(() => router.push('/login'), 4000)
    }
  }

  return (
    <section className="signup-section">
      <div className="signup-container">
        <h2>Create Account</h2>

        <form onSubmit={handleSubmit} noValidate>
          {/* First & Last Name side by side */}
          <div className="form-row">
            <div className="form-group">
              <label htmlFor="first_name">First Name</label>
              <input
                id="first_name"
                type="text"
                name="first_name"
                placeholder="First name"
                value={form.first_name}
                onChange={handleChange}
                required
              />
            </div>
            <div className="form-group">
              <label htmlFor="last_name">Last Name</label>
              <input
                id="last_name"
                type="text"
                name="last_name"
                placeholder="Last name"
                value={form.last_name}
                onChange={handleChange}
                required
              />
            </div>
          </div>

          <div className="form-group">
            <label htmlFor="date_of_birth">Date of Birth</label>
            <input
              id="date_of_birth"
              type="date"
              name="date_of_birth"
              value={form.date_of_birth}
              onChange={handleChange}
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="email">Email</label>
            <input
              id="email"
              type="email"
              name="email"
              placeholder="Enter your email"
              value={form.email}
              onChange={handleChange}
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="mobile_number">Mobile Number</label>
            <input
              id="mobile_number"
              type="tel"
              name="mobile_number"
              placeholder="e.g. +61 400 000 000"
              value={form.mobile_number}
              onChange={handleChange}
            />
          </div>

          <div className="form-group">
            <label htmlFor="password">Password</label>
            <input
              id="password"
              type="password"
              name="password"
              placeholder="Create a password"
              value={form.password}
              onChange={handleChange}
              required
              minLength={6}
            />
          </div>

          <div className="form-group">
            <label htmlFor="confirm_password">Confirm Password</label>
            <input
              id="confirm_password"
              type="password"
              name="confirm_password"
              placeholder="Repeat your password"
              value={form.confirm_password}
              onChange={handleChange}
              required
            />
          </div>

          <button type="submit" className="login-btn" disabled={loading}>
            {loading ? 'Creating account…' : 'Create Account'}
          </button>

          {error   && <p className="error-message">{error}</p>}
          {success && <p className="success-message">{success}</p>}
        </form>

        <Link href="/login" className="auth-link">
          Already have an account? Log in
        </Link>
      </div>
    </section>
  )
}
