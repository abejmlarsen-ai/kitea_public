
'use client'
// ─── Sign-up Form (Client Component) ─────────────────────────────────────────

import { useState, FormEvent } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import { createClient } from '@/lib/supabase/client'
import PasswordInput from '@/components/auth/PasswordInput'
import { safeRedirect } from '@/lib/auth/safeRedirect'

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
  const searchParams          = useSearchParams()

  // Where to go once signed in: a validated ?redirect (e.g. /scan?tag=… from a
  // signed-out scan), else /library. `forwardRedirect` is '' when there's no
  // valid ?redirect, so it is only forwarded when there's something to forward.
  const redirectParam   = searchParams.get('redirect')
  const forwardRedirect = redirectParam ? safeRedirect(redirectParam, '') : ''
  const afterAuth       = forwardRedirect || safeRedirect(null)
  const loginHref       = forwardRedirect
    ? `/login?redirect=${encodeURIComponent(forwardRedirect)}`
    : '/login'

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

    // Email-confirmation link target. With a ?redirect, the callback is told
    // where to go via ?next; without one it falls back to the pending-claim
    // cookie (if any) and then /library.
    const callbackUrl = new URL('/auth/callback', window.location.origin)
    if (forwardRedirect) callbackUrl.searchParams.set('next', forwardRedirect)

    const supabase = createClient()
    const { data, error: authError } = await supabase.auth.signUp({
      email: form.email,
      password: form.password,
      options: {
        emailRedirectTo: callbackUrl.toString(),
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
      // Email confirmation disabled — user is immediately signed in.
      // Grant the Founder collectible (awaited, idempotent, server-side) before
      // navigating so /library never renders ahead of the row. Best-effort:
      // any failure is logged server-side and retried on next login — it must
      // not block signup.
      try {
        await fetch('/api/collectible/founder', {
          method: 'POST',
          headers: { Authorization: `Bearer ${data.session.access_token}` },
        })
      } catch {
        // Signup still succeeds; the login backstop will retry.
      }

      setSuccess(
        forwardRedirect
          ? `Welcome, ${form.first_name}! Account created. Taking you back…`
          : `Welcome, ${form.first_name}! Account created. Taking you to your library…`
      )
      setTimeout(() => {
        router.push(afterAuth)
        router.refresh()
      }, 1500)
    } else {
      // Email confirmation required. The emailed link returns them via
      // /auth/callback; the login page keeps ?redirect in case they log in here.
      setSuccess(
        `Account created! A verification email has been sent to ${form.email}. ` +
        `Please check your inbox, then log in.`
      )
      setTimeout(() => router.push(loginHref), 4000)
    }
  }

  return (
    <section className="signup-section">
      <div className="signup-container">

        {/* Background logo — low opacity, centred behind form fields */}
        <div className="login-bg-logo" aria-hidden="true">
          <Image
            src="/images/Kitea Logo Only.png"
            alt=""
            width={340}
            height={340}
            priority
            style={{ objectFit: 'contain', width: '100%', height: 'auto' }}
          />
        </div>

        {/* Form content — floats above logo */}
        <div className="login-form-content">
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
              <PasswordInput
                id="password"
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
              <PasswordInput
                id="confirm_password"
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

          <Link href={loginHref} className="auth-link">
            Already have an account? Log in
          </Link>
        </div>

      </div>
    </section>
  )
}
