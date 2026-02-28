// ─── Supabase Auth Callback ───────────────────────────────────────────────────
// Exchanges the one-time "code" query param for a Supabase session cookie.
// Set the redirect URL in Supabase dashboard to:
//   https://kitea-ao.com/auth/callback

import { NextResponse, type NextRequest } from 'next/server'
import { createServerClient, type CookieOptions } from '@supabase/ssr'
import { cookies } from 'next/headers'

export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')
  const next = searchParams.get('next') ?? '/library'

  if (code) {
    const cookieStore = await cookies()
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
      // ── Founder NFT: fire on every auth (mint route is idempotent) ──
      const { data: { user } } = await supabase.auth.getUser()
      if (user) {
        // Upsert profile row — no-op if it already exists
        await supabase
          .from('profiles')
          .upsert({ id: user.id }, { onConflict: 'id', ignoreDuplicates: true })

        // Count all profiles to determine this user's founder number
        const { count } = await supabase
          .from('profiles')
          .select('*', { count: 'exact', head: true })

        const founderNumber = count ?? 1
        const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? origin

        // Fire-and-forget — do not block the redirect
        fetch(`${siteUrl}/api/nft/mint`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            user_id: user.id,
            hunt_location_id: null,
            scan_number: founderNumber,
            scan_id: null,
            is_founder: true,
          }),
        }).catch((err) => console.error('[auth/callback] founder mint failed:', err))
      }

      return NextResponse.redirect(`${origin}${next}`)
    }
  }

  return NextResponse.redirect(`${origin}/login?error=auth_callback_failed`)
}
