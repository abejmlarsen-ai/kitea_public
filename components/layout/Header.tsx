// ─── Site Header (Server Component) ─────────────────────────────────────────
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import AdminDropdown from './AdminDropdown'
import LogoutButton from '@/components/auth/LogoutButton'

export default async function Header() {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  let isAdmin = false

  if (user) {
    const { data: profileRaw, error: profileError } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .single()

    if (profileError) {
      console.error('[Header] profiles query error:', profileError.message)
    }

    const raw = profileRaw as Record<string, unknown> | null
    isAdmin   = !!raw?.is_admin
  }

  return (
    <header className="site-header">
      <div className="container header-inner">
        <Link href="/" className="logo">
          Kitea
        </Link>

        <nav className="main-nav">
          <ul>
            <li><Link href="/about">About</Link></li>
            <li><Link href="/how-it-works">How It Works</Link></li>
            <li><Link href="/map">Map</Link></li>

            {user ? (
              <>
                <li><Link href="/library">Library</Link></li>
                <li><Link href="/shop">Shop</Link></li>
                {isAdmin && <AdminDropdown />}
                <li><LogoutButton /></li>
              </>
            ) : (
              <li><Link href="/login">Login</Link></li>
            )}
          </ul>
        </nav>
      </div>
    </header>
  )
}
