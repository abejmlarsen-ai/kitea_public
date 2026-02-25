// ─── Site Header (Server Component) ─────────────────────────────────────────
// Reads Supabase session server-side so the Library/Shop links appear
// instantly for authenticated users without any client-side flash.

import Link from 'next/link'
import Image from 'next/image'
import { createClient } from '@/lib/supabase/server'

export default async function Header() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

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
