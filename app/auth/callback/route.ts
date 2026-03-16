// ─── Supabase Auth Callback ───────────────────────────────────────────────────
// Exchanges the one-time "code" query param for a Supabase session cookie.
// Set the redirect URL in Supabase dashboard to:
//   https://kitea-ao.com/auth/callback

import { NextResponse, type NextRequest } from 'next/server'
import { createServerClient, type CookieOptions } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { createServiceRoleClient } from '@/lib/supabase/server'
import { mintNFT } from '@/lib/thirdweb/mint'

export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')
  const next = searchParams.get('next') ?? '/library'

  if (code) {
    const cookieStore = await cookies()
    // Anon client — only used to exchange the OAuth code for a session
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

        // Service-role client for nft_tokens + profile reads (bypasses RLS)
        const db = createServiceRoleClient()

        // ── 1. Upsert profile row ──────────────────────────────────────────
        // Use the anon client here — it has the user session and the un-typed
        // createServerClient skips strict schema checks on profiles.
        const { error: upsertError } = await supabase
          .from('profiles')
          .upsert({ id: user.id }, { onConflict: 'id', ignoreDuplicates: true })

        if (upsertError) {
          console.error('[auth/callback] profile upsert failed:', upsertError.message)
        } else {
          console.log('[auth/callback] profile upserted for:', user.id)
        }

        // ── 2. Count profiles to determine founder edition number ──────────
        const { count, error: countError } = await db
          .from('profiles')
          .select('*', { count: 'exact', head: true })

        if (countError) {
          console.error('[auth/callback] profile count failed:', countError.message)
        }

        const founderNumber = count ?? 1
        console.log('[auth/callback] founder edition number:', founderNumber)

        // ── 3. Idempotency — skip if NFT already pending or minted ─────────
        const { data: existing, error: idempotencyError } = await db
          .from('nft_tokens')
          .select('id, status')
          .eq('user_id', user.id)
          .is('hunt_location_id', null)
          .in('status', ['minted', 'pending'])
          .maybeSingle()

        if (idempotencyError) {
          console.error('[auth/callback] idempotency check error:', idempotencyError.message)
        }

        if (existing) {
          console.log('[auth/callback] founder NFT already exists (status:', existing.status + ') — skipping mint')
        } else {
          // ── 4. Fetch wallet address ──────────────────────────────────────
          const { data: profile, error: profileError } = await db
            .from('profiles')
            .select('wallet_address')
            .eq('id', user.id)
            .single()

          if (profileError) {
            console.error('[auth/callback] profile fetch failed:', profileError.message)
          }

          const walletAddress = profile?.wallet_address ?? null
          const contractAddress = process.env.NEXT_PUBLIC_NFT_CONTRACT_ADDRESS ?? ''
          const chain = 'base-sepolia-testnet'

          if (!walletAddress) {
            // ── 4a. No wallet yet — insert pending row; drained when wallet connects
            console.log('[auth/callback] no wallet — inserting pending founder NFT for user:', user.id)

            const { data: pendingRow, error: insertError } = await db
              .from('nft_tokens')
              .insert({
                user_id: user.id,
                hunt_location_id: null,
                scan_id: null,
                token_id: '0',
                edition_number: founderNumber,
                status: 'pending',
                contract_address: contractAddress,
                chain,
              })
              .select('id')
              .single()

            if (insertError) {
              console.error('[auth/callback] pending NFT insert failed:', insertError.message, insertError.details)
            } else {
              console.log('[auth/callback] pending founder NFT row created:', pendingRow.id)
            }
          } else {
            // ── 4b. Wallet present — mint on-chain directly ──────────────
            console.log('[auth/callback] wallet found:', walletAddress, '— minting founder NFT directly')

            try {
              const txHash = await mintNFT({
                toAddress: walletAddress,
                tokenId: BigInt(0),
                amount: 1,
              })

              console.log('[auth/callback] founder NFT minted — txHash:', txHash)

              const { error: mintRecordError } = await db
                .from('nft_tokens')
                .insert({
                  user_id: user.id,
                  hunt_location_id: null,
                  scan_id: null,
                  token_id: '0',
                  edition_number: founderNumber,
                  status: 'minted',
                  transaction_hash: txHash,
                  contract_address: contractAddress,
                  chain,
                })

              if (mintRecordError) {
                console.error('[auth/callback] minted NFT record insert failed:', mintRecordError.message)
              } else {
                console.log('[auth/callback] minted founder NFT record saved')
              }
            } catch (mintErr) {
              console.error('[auth/callback] mintNFT threw:', mintErr)
            }
          }
        }
      }

      return NextResponse.redirect(`${origin}${next}`)
    }
  }

  return NextResponse.redirect(`${origin}/login?error=auth_callback_failed`)
}
