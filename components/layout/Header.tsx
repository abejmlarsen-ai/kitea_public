// ─── Site Header (Server Component) ─────────────────────────────────────────
import Link from 'next/link'
import Image from 'next/image'
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
      <div className="header-inner">

        {/* ── Row 1: logo (left) + settings icon + logout/login (right) ── */}
        <div className="header-row1">
          <Link href="/" className="logo">
            <Image
              src="/images/Kitea Logo Only.png"
              alt=""
              width={40}
              height={40}
              style={{ objectFit: 'contain', filter: 'brightness(0)' }}
            />
            Kitea
          </Link>

          <div className="header-row1-right">
            {user && (
              <Link href="/account" className="header-settings-link" aria-label="Account settings">
                {/* Settings icon — lucide-react Settings path data */}
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none"
                  stroke="#000000" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
                  aria-hidden="true">
                  <circle cx="12" cy="12" r="3"/>
                  <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/>
                </svg>
              </Link>
            )}

            {user
              ? <LogoutButton />
              : <Link href="/login" className="nav-login-link">Login</Link>
            }
          </div>
        </div>

        {/* ── Row 2: nav links centred ── */}
        <nav className="main-nav">
          <ul>
            <li><Link href="/how-it-works">How It Works</Link></li>
            <li><Link href="/map">Map</Link></li>

            {user && (
              <>
                <li><Link href="/library">Library</Link></li>
                <li><Link href="/shop">Shop</Link></li>
                {isAdmin && <AdminDropdown />}
              </>
            )}
          </ul>
        </nav>

      </div>
    </header>
  )
}
