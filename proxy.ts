// ─── Route protection proxy (Next.js 16) ─────────────────────────────────────
// Runs on every request (except static files / API routes).
// Refreshes the Supabase session cookie and enforces auth guards.

import { createServerClient, type CookieOptions } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function proxy(request: NextRequest) {
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

  // IMPORTANT: do not add logic between createServerClient and getUser()
  const { data: { user } } = await supabase.auth.getUser()
  const { pathname } = request.nextUrl

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
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|api|.*\\..*).*)',
  ],
}
