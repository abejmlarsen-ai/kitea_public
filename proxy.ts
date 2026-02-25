// ─── Route protection proxy (Next.js 16) ─────────────────────────────────────
// Two modes controlled by env vars:
//
// NEXT_PUBLIC_UNDER_CONSTRUCTION=true  (production / main branch)
//   Every route redirects to / (which renders <UnderConstruction>).
//   The only exception is /auth/callback, which must stay open so
//   Supabase can complete email-verification flows even while the site
//   is locked down.  No new routes need to be listed here — the catch
//   covers everything automatically.
//
// NEXT_PUBLIC_UNDER_CONSTRUCTION=false / unset  (develop branch / local)
//   Normal auth guards apply:
//   - /library, /shop, /map  → redirect to /login  when not authenticated
//   - /login, /signup        → redirect to /library when already authenticated

import { createServerClient, type CookieOptions } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

const UNDER_CONSTRUCTION = process.env.NEXT_PUBLIC_UNDER_CONSTRUCTION === 'true'

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl

  // ── Under-construction mode ───────────────────────────────────────────────
  // Redirect every route to / EXCEPT /auth/callback (Supabase needs it).
  if (UNDER_CONSTRUCTION) {
    if (pathname !== '/' && !pathname.startsWith('/auth/callback')) {
      const url = request.nextUrl.clone()
      url.pathname = '/'
      return NextResponse.redirect(url)
    }
    // At / or /auth/callback — just pass through, no session needed
    return NextResponse.next({ request })
  }

  // ── Normal mode: refresh Supabase session cookie ──────────────────────────
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

  // ── Protected routes — require a valid session ──────────────────────────
  const protectedPaths = ['/library', '/shop', '/map']
  if (protectedPaths.some(p => pathname.startsWith(p)) && !user) {
    const url = request.nextUrl.clone()
    url.pathname = '/login'
    return NextResponse.redirect(url)
  }

  // ── Auth pages — redirect already-logged-in users to library ───────────
  if ((pathname === '/login' || pathname === '/signup') && user) {
    const url = request.nextUrl.clone()
    url.pathname = '/library'
    return NextResponse.redirect(url)
  }

  return proxyResponse
}

export const config = {
  // Run on all paths except Next.js internals and static files.
  // API routes are excluded so /api/* and /auth/callback work at all times.
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|api|.*\\..*).*)',
  ],
}
