// ─── Site Header (Server Component) ─────────────────────────────────────────
// Reads Supabase session server-side so auth-dependent nav links appear
// instantly without any client-side flash.
// Also checks is_admin to conditionally render the Admin dropdown.

import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import AdminDropdown from './AdminDropdown'

export default async function Header() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  // Check is_admin — column was added after last type generation, so we cast.
  let isAdmin = false
  if (user) {
    const { data: profileRaw } = await supabase
      .from('profiles')
      .select('is_admin')
      .eq('id', user.id)
      .single()
    isAdmin =
      (profileRaw as Record<string, unknown> | null)?.is_admin === true
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
