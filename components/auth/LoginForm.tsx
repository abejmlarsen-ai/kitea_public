'use client'
// ─── Login Form (Client Component) ──────────────────────────────────────────────

import { useState, FormEvent } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import { createClient } from '@/lib/supabase/client'

export default function LoginForm() {
  const [email, setEmail]       = useState('')
  const [password, setPassword] = useState('')
  const [error, setError]       = useState('')
  const [loading, setLoading]   = useState(false)
  const router                  = useRouter()

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

    // Fire-and-forget: queue the founder NFT pending row insert.
    // /api/nft/mint runs in its own serverless invocation and is fully
    // idempotent — safe to call on every login.  We intentionally do NOT
    // await so the redirect to /library happens immediately.
    // The library page detects any pending row and triggers the actual
    // blockchain mint once the user has a connected wallet.
    if (data.user) {
      fetch('/api/nft/mint', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          user_id: data.user.id,
          hunt_location_id: null,
          scan_number: 1,
          scan_id: null,
          is_founder: true,
        }),
      }).catch(console.error)
    }

    router.push('/library')
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
              <input
                id="password"
                type="password"
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
