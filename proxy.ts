// ─── Route protection proxy (Next.js 16) ─────────────────────────────────────
//
// UNDER CONSTRUCTION mode (NEXT_PUBLIC_UNDER_CONSTRUCTION=true)
// ─────────────────────────────────────────────────────────────
//   /auth/callback          → always open (Supabase email verification)
//   /login                  → open to logged-out users; logged-in → /library
//   /signup + all others    → logged-out users redirected to /
//   Any route               → logged-in users pass through freely
//
// NORMAL mode (NEXT_PUBLIC_UNDER_CONSTRUCTION=false / unset)
// ──────────────────────────────────────────────────────────
//   /library, /shop, /map, /scan  → require login, else → /login
//   /login, /signup               → logged-in users → /library

import { createServerClient, type CookieOptions } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

const UNDER_CONSTRUCTION = process.env.NEXT_PUBLIC_UNDER_CONSTRUCTION === 'true'

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl

  // ── /auth/callback is always open — Supabase needs it in every mode ──────
  if (pathname.startsWith('/auth/callback')) {
    return NextResponse.next({ request })
  }

  // ── Build Supabase client and resolve session (needed in both modes) ──────
  let proxyResponse = NextResponse.next({ request })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() { return request.cookies.getAll() },
        setAll(cookiesToSet: { name: string; value: string; options: CookieOptions }[]) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value))
          proxyResponse = NextResponse.next({ request })
          cookiesToSet.forEach(({ name, value, options }) =>
            proxyResponse.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  // IMPORTANT: no logic between createServerClient and getUser()
  const { data: { user } } = await supabase.auth.getUser()

  // ── Under-construction mode ───────────────────────────────────────────────
  if (UNDER_CONSTRUCTION) {
    // Logged-in users bypass the lockdown entirely
    if (user) {
      // Still redirect away from /login — they're already authenticated
      if (pathname === '/login') {
        const url = request.nextUrl.clone()
        url.pathname = '/library'
        return NextResponse.redirect(url)
      }
      return proxyResponse
    }

    // Logged-out users: /login is the only open door (closed beta access)
    if (pathname === '/login') {
      return proxyResponse
    }

    // Everything else — including /signup — redirects to the under construction page
    if (pathname !== '/') {
      const url = request.nextUrl.clone()
      url.pathname = '/'
      return NextResponse.redirect(url)
    }

    return proxyResponse
  }

  // ── Normal mode ───────────────────────────────────────────────────────────

  // Protected routes — require a valid session
  const protectedPaths = ['/library', '/shop', '/map', '/scan']
  if (protectedPaths.some(p => pathname.startsWith(p)) && !user) {
    const url = request.nextUrl.clone()
    url.pathname = '/login'
    return NextResponse.redirect(url)
  }

  // Auth pages — redirect already-logged-in users to library
  if ((pathname === '/login' || pathname === '/signup') && user) {
    const url = request.nextUrl.clone()
    url.pathname = '/library'
    return NextResponse.redirect(url)
  }

  return proxyResponse
}

export const config = {
  // Run on all paths except Next.js internals and static files.
  // /api/* and /auth/callback bypass this file entirely via the matcher.
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|api|.*\\..*).*)',
  ],
}
