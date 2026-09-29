'use client'
// ─── Login Form (Client Component) ──────────────────────────────────────────────

import { useState, FormEvent } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import { createClient } from '@/lib/supabase/client'
import PasswordInput from '@/components/auth/PasswordInput'

export default function LoginForm() {
  const [email, setEmail]       = useState('')
  const [password, setPassword] = useState('')
  const [error, setError]       = useState('')
  const [loading, setLoading]   = useState(false)
  const router                  = useRouter()
  const searchParams            = useSearchParams()

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setError('')
    setLoading(true)

    const supabase = createClient()
    const { data, error: authError } = await supabase.auth.signInWithPassword({
      email,
      password,
    })

    if (authError) {
      setError(authError.message)
      setLoading(false)
      return
    }

    // Backstop for accounts created before signup granted the Founder
    // collectible. Awaited and idempotent — same server-side path as signup.
    // Any failure is logged server-side and left for the next login; it is
    // never surfaced here and must not block the redirect.
    if (data.session) {
      try {
        await fetch('/api/collectible/founder', {
          method: 'POST',
          headers: { Authorization: `Bearer ${data.session.access_token}` },
        })
      } catch {
        // Login still succeeds.
      }
    }

    // Honour ?redirect= param (e.g. from /scan auth flow), fall back to /library
    const redirect = searchParams.get('redirect')
    router.push(redirect && redirect.startsWith('/') ? redirect : '/library')
    router.refresh()
  }

  return (
    <section className="login-section">
      <div className="login-container">

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
          <h2>Login</h2>

          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label htmlFor="email">Email</label>
              <input
                id="email"
                type="email"
                placeholder="Enter your email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>

            <div className="form-group">
              <label htmlFor="password">Password</label>
              <PasswordInput
                id="password"
                placeholder="Enter your password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>

            <button type="submit" className="login-btn" disabled={loading}>
              {loading ? 'Logging in…' : 'Login'}
            </button>

            {error && <p className="error-message">{error}</p>}
          </form>

          <Link href="/signup" className="auth-link">
            Don&apos;t have an account? Sign up
          </Link>
        </div>

      </div>
    </section>
  )
}
