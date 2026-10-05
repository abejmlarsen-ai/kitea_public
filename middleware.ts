// ─── Middleware: session refresh + route protection ────────────────────────────
//
// PUBLIC routes pass straight through with NO Supabase call.
// PROTECTED routes check the session and redirect to /login if unauthenticated.
// AUTH pages (/login, /signup) redirect logged-in users to their validated
// ?redirect, else a pending scan claim, else /library.
//
// Public (never gated):
//   /  /about  /how-it-works  /opportunities  /faq  /map  /scan  /contact  /shop
//   /api/nfc/*  /auth/*  + static assets
//
// Protected (valid session required):
//   /library  /profile  /hunts/*  /admin
//   /api/hunt/*

import { createServerClient, type CookieOptions } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'
import { safeRedirect } from '@/lib/auth/safeRedirect'
import { PENDING_CLAIM_COOKIE, pendingClaimScanPath } from '@/lib/auth/pendingClaim'

// Path prefixes that require an authenticated session.
const PROTECTED_PREFIXES = [
  '/library',
  '/profile',
  '/hunts',
  '/admin',
  '/api/hunt',
]

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  // ── Always open: auth callback and NFC scan API ────────────────────────
  if (pathname.startsWith('/auth/') || pathname.startsWith('/api/nfc/')) {
    return NextResponse.next({ request })
  }

  const isProtected = PROTECTED_PREFIXES.some((p) => pathname.startsWith(p))
  const isAuthPage  = pathname === '/login' || pathname === '/signup'

  // ── Public route — pass through with no Supabase call ──────────────────────
  if (!isProtected && !isAuthPage) {
    return NextResponse.next({ request })
  }

  // ── Session check (protected routes and auth pages only) ──────────────────
  let response = NextResponse.next({ request })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet: { name: string; value: string; options: CookieOptions }[]) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value))
          response = NextResponse.next({ request })
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  // IMPORTANT: no logic between createServerClient and getUser()
  const { data: { user } } = await supabase.auth.getUser()

  // ── Protected route, no session → /login ──────────────────────────────
  if (isProtected && !user) {
    const url = request.nextUrl.clone()
    url.pathname = '/login'
    return NextResponse.redirect(url)
  }

  // ── Auth page, already logged in → where they were headed ─────────────
  // A valid ?redirect, else a pending claim from a signed-out scan, else
  // /library. (e.g. they confirmed their email in another tab, then came back
  // to the login tab the scan sent them to.)
  if (isAuthPage && user) {
    const redirectParam = request.nextUrl.searchParams.get('redirect')
    const target =
      (redirectParam ? safeRedirect(redirectParam, '') : '') ||
      pendingClaimScanPath(request.cookies.get(PENDING_CLAIM_COOKIE)?.value) ||
      safeRedirect(null)
    return NextResponse.redirect(new URL(target, request.nextUrl.origin))
  }

  return response
}

export const config = {
  // Run on all paths except Next.js internals and static files (anything
  // with a file extension like .ico, .png, .js, .css is excluded).
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\..*).*)',
  ],
}
