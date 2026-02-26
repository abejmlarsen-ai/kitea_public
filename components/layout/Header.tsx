// ─── Site Header (Server Component) ─────────────────────────────────────────
// Reads Supabase session server-side so auth-dependent nav links appear
// instantly without any client-side flash.
// Also checks is_admin to conditionally render the Admin dropdown.
//
// NOTE: is_admin is NOT in the generated TypeScript types (it was added to the
// DB after the last type generation run).  We therefore:
//   • use .select('*') — consistent with app/admin/page.tsx which is confirmed
//     working; using .select('is_admin') on an untyped column can silently
//     return null with the typed Supabase client.
//   • cast the result to Record<string,unknown> before reading the field.
//   • use !! (truthy) instead of === true so both boolean true and integer 1
//     are accepted.

import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import AdminDropdown from './AdminDropdown'

export default async function Header() {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  let isAdmin = false

  if (user) {
    const { data: profileRaw, error: profileError } = await supabase
      .from('profiles')
      .select('*')                    // must be * — is_admin not in TS types
      .eq('id', user.id)
      .single()

    if (profileError) {
      console.error('[Header] profiles query error:', profileError.message)
    }

    const raw = profileRaw as Record<string, unknown> | null
    isAdmin   = !!raw?.is_admin       // handles true (bool) and 1 (int)

    console.log('[Header] isAdmin debug:', {
      userId:   user.id,
      is_admin: raw?.is_admin,
      isAdmin,
      profileError: profileError?.message ?? null,
    })
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
