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
      // ── Founder NFT: trigger on every auth (mint route is idempotent) ─────
      const { data: { user } } = await supabase.auth.getUser()
      if (user) {
        console.log('[auth/callback] user authenticated:', user.id)

        // Upsert profile row — no-op if it already exists
        const { error: upsertError } = await supabase
          .from('profiles')
          .upsert({ id: user.id }, { onConflict: 'id', ignoreDuplicates: true })

        if (upsertError) {
          console.error('[auth/callback] profile upsert failed:', upsertError.message)
        } else {
          console.log('[auth/callback] profile upserted for:', user.id)
        }

        // Count all profiles to determine this user's founder edition number
        const { count, error: countError } = await supabase
          .from('profiles')
          .select('*', { count: 'exact', head: true })

        if (countError) {
          console.error('[auth/callback] profile count failed:', countError.message)
        }

        const founderNumber = count ?? 1
        const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? origin

        console.log(
          '[auth/callback] triggering founder mint — user:', user.id,
          'edition:', founderNumber,
          'url:', `${siteUrl}/api/nft/mint`,
        )

        // ── IMPORTANT: await the fetch — do NOT fire-and-forget ────────────
        // Serverless runtimes (Vercel) may freeze the process the moment the
        // redirect response is returned.  A background fetch() that is not
        // awaited will be killed before it resolves, so the mint never runs.
        try {
          const mintRes = await fetch(`${siteUrl}/api/nft/mint`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              user_id: user.id,
              hunt_location_id: null,
              scan_number: founderNumber,
              scan_id: null,
              is_founder: true,
            }),
          })

          if (!mintRes.ok) {
            const body = await mintRes.text()
            console.error(
              '[auth/callback] founder mint returned error — status:',
              mintRes.status, 'body:', body,
            )
          } else {
            const result = await mintRes.json() as Record<string, unknown>
            console.log(
              '[auth/callback] founder mint succeeded — status:', mintRes.status,
              'result:', result,
            )
          }
        } catch (fetchErr) {
          console.error('[auth/callback] founder mint fetch threw:', fetchErr)
        }
      }

      return NextResponse.redirect(`${origin}${next}`)
    }
  }

  return NextResponse.redirect(`${origin}/login?error=auth_callback_failed`)
}
