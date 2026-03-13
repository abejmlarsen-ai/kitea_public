'use server'
// ─── Server Action: Founder NFT mint ─────────────────────────────────────────
// Called directly from the password-login flow (LoginForm) after
// signInWithPassword succeeds.  The OAuth/magic-link flow uses auth/callback
// which has its own identical logic.
//
// Idempotent: no-op if nft_tokens already has a pending or minted row.
//
// IMPORTANT: the outer try/catch re-throws every failure as a plain Error.
// Next.js server actions can only propagate plain Error objects — any other
// thrown value (Supabase PostgrestError, Thirdweb SDK error, etc.) causes
// "An unexpected response was received from the server" on the client.

import { createServiceRoleClient } from '@/lib/supabase/server'
import { mintNFT } from '@/lib/thirdweb/mint'

export async function mintFounderNft(userId: string): Promise<void> {
  try {
    console.log('[mintFounderNft] called for user:', userId)

    const db = createServiceRoleClient()

    // ── 1. Count profiles to determine edition number ───────────────────────
    const { count, error: countError } = await db
      .from('profiles')
      .select('*', { count: 'exact', head: true })

    if (countError) {
      console.error('[mintFounderNft] profile count failed:', countError.message)
    }

    const founderNumber = count ?? 1
    console.log('[mintFounderNft] founder edition number:', founderNumber)

    // ── 2. Idempotency — skip if row already exists ─────────────────────────
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
      return
    }

    // ── 3. Fetch wallet address ─────────────────────────────────────────────
    const { data: profile, error: profileError } = await db
      .from('profiles')
      .select('wallet_address')
      .eq('id', userId)
      .single()

    if (profileError) {
      console.error('[mintFounderNft] profile fetch failed:', profileError.message)
    }

    const walletAddress = profile?.wallet_address ?? null
    const contractAddress = process.env.NEXT_PUBLIC_NFT_CONTRACT_ADDRESS ?? ''
    const chain = 'base-sepolia-testnet'

    if (!walletAddress) {
      // ── 3a. No wallet yet — insert pending row; drained when wallet connects
      console.log('[mintFounderNft] no wallet — inserting pending row for user:', userId)

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
          chain,
        })
        .select('id')
        .single()

      if (insertError) {
        console.error('[mintFounderNft] pending insert failed:', insertError.message, insertError.details)
      } else {
        console.log('[mintFounderNft] pending row created:', pendingRow.id)
      }
    } else {
      // ── 3b. Wallet present — mint on-chain directly ─────────────────────
      console.log('[mintFounderNft] wallet found:', walletAddress, '— minting directly')

      const txHash = await mintNFT({
        toAddress: walletAddress,
        tokenId: BigInt(0),
        amount: 1,
      })

      console.log('[mintFounderNft] minted — txHash:', txHash)

      const { error: mintRecordError } = await db
        .from('nft_tokens')
        .insert({
          user_id: userId,
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
        console.error('[mintFounderNft] minted record insert failed:', mintRecordError.message)
      } else {
        console.log('[mintFounderNft] minted record saved')
      }
    }
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
