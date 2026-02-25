
'use client'
// ─── Login Form (Client Component) ───────────────────────────────────────────

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
    const { error: authError } = await supabase.auth.signInWithPassword({
      email,
      password,
    })

    if (authError) {
      setError(authError.message)
      setLoading(false)
      return
    }

    router.push('/library')
    router.refresh()
  }

  return (
    <section className="login-section">
      {/* Brand Logo */}
      <div className="logo-hero">
        <Image
          src="/images/Kitea Logo Only.png"
          alt="Kitea logo"
          width={200}
          height={200}
          priority
          style={{ objectFit: 'contain', maxHeight: '40vh', width: 'auto' }}
        />
      </div>

      <div className="login-container">
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
    </section>
  )
}
