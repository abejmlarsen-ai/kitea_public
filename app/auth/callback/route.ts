// ─── Supabase Auth Callback ───────────────────────────────────────────────────
// Exchanges the one-time "code" query param for a Supabase session cookie.
// On first login inserts a minted founder collectible row directly (DB-only).
// Set the redirect URL in Supabase dashboard to:
//   https://kitea-ao.com/auth/callback

import { NextResponse, type NextRequest } from 'next/server'
import { createServerClient, type CookieOptions } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { awardFounderCollectible } from '@/lib/collectibles/founder'
import { safeRedirect } from '@/lib/auth/safeRedirect'
import { PENDING_CLAIM_COOKIE, pendingClaimScanPath } from '@/lib/auth/pendingClaim'

export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')

  if (code) {
    const cookieStore = await cookies()

    // Where to land: a valid ?next (internal paths only), else a pending
    // claim from a signed-out scan, else /library.
    const nextParam = searchParams.get('next')
    const next =
      (nextParam ? safeRedirect(nextParam, '') : '') ||
      pendingClaimScanPath(cookieStore.get(PENDING_CLAIM_COOKIE)?.value) ||
      safeRedirect(null)

    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() { return cookieStore.getAll() },
          setAll(cookiesToSet: { name: string; value: string; options: CookieOptions }[]) {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            )
          },
        },
      }
    )

    const { error } = await supabase.auth.exchangeCodeForSession(code)
    if (!error) {
      const { data: { user } } = await supabase.auth.getUser()

      if (user) {
        console.log('[auth/callback] user authenticated:', user.id)

        // ── 1. Upsert profile row ──────────────────────────────────────────
        const { error: upsertError } = await supabase
          .from('profiles')
          .upsert({ id: user.id }, { onConflict: 'id', ignoreDuplicates: true })

        if (upsertError) {
          console.error('[auth/callback] profile upsert failed:', upsertError.message)
        } else {
          console.log('[auth/callback] profile upserted for:', user.id)
        }

        // ── 2. Grant the Founder collectible ──────────────────────────────
        // Magic link and email-confirmation land here. Same consolidated,
        // idempotent, awaited path as signup and login; a failure is logged
        // inside and left for the next login to retry.
        await awardFounderCollectible(user.id)
      }

      return NextResponse.redirect(`${origin}${next}`)
    }
  }

  return NextResponse.redirect(`${origin}/login?error=auth_callback_failed`)
}
