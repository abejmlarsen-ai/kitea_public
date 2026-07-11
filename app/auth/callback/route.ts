// ─── Supabase Auth Callback ───────────────────────────────────────────────────
// Exchanges the one-time "code" query param for a Supabase session cookie.
// On first login inserts a minted founder collectible row directly (DB-only).
// Set the redirect URL in Supabase dashboard to:
//   https://kitea-ao.com/auth/callback

import { NextResponse, type NextRequest } from 'next/server'
import { createServerClient, type CookieOptions } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { createServiceRoleClient } from '@/lib/supabase/server'

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
      const { data: { user } } = await supabase.auth.getUser()

      if (user) {
        console.log('[auth/callback] user authenticated:', user.id)

        const db = createServiceRoleClient()

        // ── 1. Upsert profile row ──────────────────────────────────────────
        const { error: upsertError } = await supabase
          .from('profiles')
          .upsert({ id: user.id }, { onConflict: 'id', ignoreDuplicates: true })

        if (upsertError) {
          console.error('[auth/callback] profile upsert failed:', upsertError.message)
        } else {
          console.log('[auth/callback] profile upserted for:', user.id)
        }

        // ── 2. Idempotency — skip if founder collectible already exists ────
        const { data: existing } = await db
          .from('collectibles')
          .select('id, status')
          .eq('user_id', user.id)
          .is('hunt_location_id', null)
          .eq('status', 'minted')
          .maybeSingle()

        if (existing) {
          console.log('[auth/callback] founder collectible already exists — skipping')
        } else {
          // ── 3. Count existing founder collectibles for edition number ────
          const { count } = await db
            .from('collectibles')
            .select('*', { count: 'exact', head: true })
            .eq('status', 'minted')
            .is('hunt_location_id', null)

          const edition_number = (count ?? 0) + 1
          console.log('[auth/callback] inserting founder collectible — edition_number:', edition_number)

          const { error: insertError } = await db
            .from('collectibles')
            .insert({
              user_id:          user.id,
              hunt_location_id: null,
              scan_id:          null,
              token_id:         null,
              edition_number,
              status:           'minted',
              chain:            null,
              contract_address: null,
              transaction_hash: null,
              minted_at:        new Date().toISOString(),
            })

          if (insertError) {
            console.error('[auth/callback] founder collectible insert failed:', insertError.message)
          } else {
            console.log('[auth/callback] founder collectible inserted — edition_number:', edition_number)
          }
        }
      }

      return NextResponse.redirect(`${origin}${next}`)
    }
  }

  return NextResponse.redirect(`${origin}/login?error=auth_callback_failed`)
}
