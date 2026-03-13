'use server'
// ─── Server Action: Founder NFT — queue pending row ──────────────────────
// Called from the login flow (LoginForm) after signInWithPassword succeeds,
// and from auth/callback after OAuth / magic-link.
//
// This action ONLY inserts a pending row — no on-chain transaction here.
// The actual mint is triggered client-side when the user loads /library:
// LibraryClient calls POST /api/nft/mint, which upgrades the pending row to
// minted once the user has a connected wallet.
//
// This decouples the blockchain transaction from the login flow so login is
// instant and the mint happens asynchronously.
//
// Idempotent: no-op if nft_tokens already has a pending or minted row.

import { createServiceRoleClient } from '@/lib/supabase/server'

export async function mintFounderNft(
  userId: string
): Promise<{ status: string }> {
  try {
    console.log('[mintFounderNft] called for user:', userId)

    const db = createServiceRoleClient()

    // ── 1. Count profiles to determine edition number ───────────────────
    const { count, error: countError } = await db
      .from('profiles')
      .select('*', { count: 'exact', head: true })

    if (countError) {
      console.error('[mintFounderNft] profile count failed:', countError.message)
    }

    const founderNumber = count ?? 1
    console.log('[mintFounderNft] founder edition number:', founderNumber)

    // ── 2. Idempotency — skip if row already exists ────────────────────
    const { data: existing, error: idempotencyError } = await db
      .from('nft_tokens')
      .select('id, status')
      .eq('user_id', userId)
      .is('hunt_location_id', null)
      .in('status', ['minted', 'pending'])
      .maybeSingle()

    if (idempotencyError) {
      console.error('[mintFounderNft] idempotency check error:', idempotencyError.message)
    }

    if (existing) {
      console.log('[mintFounderNft] already exists (status:', existing.status + ') — skipping')
      return { status: existing.status ?? 'pending' }
    }

    // ── 3. Insert pending row ─────────────────────────────────────────────
    console.log('[mintFounderNft] inserting pending row for user:', userId)

    const contractAddress = process.env.NEXT_PUBLIC_NFT_CONTRACT_ADDRESS ?? ''

    const { data: pendingRow, error: insertError } = await db
      .from('nft_tokens')
      .insert({
        user_id: userId,
        hunt_location_id: null,
        scan_id: null,
        token_id: '0',
        edition_number: founderNumber,
        status: 'pending',
        contract_address: contractAddress,
        chain: 'base-sepolia-testnet',
      })
      .select('id')
      .single()

    if (insertError) {
      console.error('[mintFounderNft] pending insert failed:', insertError.message, insertError.details)
      throw insertError
    }

    console.log('[mintFounderNft] pending row created:', pendingRow.id)
    return { status: 'pending' }
  } catch (err: unknown) {
    // Normalise to a plain serialisable Error before propagating.
    // Next.js server actions cannot transmit non-Error thrown values to the
    // client — they produce "An unexpected response was received from the
    // server" instead of a usable rejection.
    const msg = err instanceof Error ? err.message : String(err)
    console.error('[mintFounderNft]', err)
    throw new Error(`mintFounderNft failed: ${msg}`)
  }
}
