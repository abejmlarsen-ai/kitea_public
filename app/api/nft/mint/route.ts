import { NextRequest, NextResponse } from 'next/server'
import { createServiceRoleClient } from '@/lib/supabase/server'
import { mintNFT } from '@/lib/thirdweb/mint'

export async function POST(req: NextRequest) {
  try {
    const { user_id, hunt_location_id, scan_number, scan_id, is_founder } =
      (await req.json()) as {
        user_id: string
        hunt_location_id: string | null
        scan_number: number
        scan_id: string | null
        is_founder?: boolean
      }

    console.log('[nft/mint] Request received', {
      user_id,
      hunt_location_id,
      scan_number,
      scan_id,
      is_founder: is_founder ?? false,
    })

    // ── 0. Env var guard — fail fast with clear error if misconfigured ─────────
    const missingVars: string[] = []
    if (!process.env.THIRDWEB_SECRET_KEY)               missingVars.push('THIRDWEB_SECRET_KEY')
    if (!process.env.DEPLOYER_PRIVATE_KEY)               missingVars.push('DEPLOYER_PRIVATE_KEY')
    if (!process.env.NEXT_PUBLIC_NFT_CONTRACT_ADDRESS)   missingVars.push('NEXT_PUBLIC_NFT_CONTRACT_ADDRESS')
    if (!process.env.SUPABASE_SERVICE_ROLE_KEY)          missingVars.push('SUPABASE_SERVICE_ROLE_KEY')
    if (missingVars.length > 0) {
      console.error('[nft/mint] Missing required env vars:', missingVars.join(', '))
      return NextResponse.json(
        { error: 'Server misconfiguration: missing env vars: ' + missingVars.join(', ') },
        { status: 500 }
      )
    }

    console.log('[nft/mint] contract address:', process.env.NEXT_PUBLIC_NFT_CONTRACT_ADDRESS)
    console.log('[nft/mint] chain: base-sepolia (84532)')

    const supabase = createServiceRoleClient()

    // ── 1. Resolve token ID ───────────────────────────────────────────────
    let tokenIdText: string
    let tokenIdBigInt: bigint

    if (is_founder) {
      console.log('[nft/mint] Founder NFT — using token_id 0')
      tokenIdText = '0'
      tokenIdBigInt = BigInt(0)
    } else {
      console.log('[nft/mint] Fetching hunt location', hunt_location_id)
      const { data: location, error: locationError } = await supabase
        .from('hunt_locations')
        .select('name, nft_token_id')
        .eq('id', hunt_location_id!)
        .single()

      if (locationError || !location) {
        console.log('[nft/mint] Hunt location not found', locationError)
        return NextResponse.json(
          { error: 'Hunt location not found' },
          { status: 404 }
        )
      }

      console.log('[nft/mint] Location found', location)
      if (location.nft_token_id === null) {
        console.error('[nft/mint] Location has no nft_token_id configured:', hunt_location_id)
        return NextResponse.json({ error: 'Location has no NFT token configured' }, { status: 400 })
      }
      tokenIdText = String(location.nft_token_id)
      tokenIdBigInt = BigInt(location.nft_token_id)
    }

    // ── 2. Fetch user wallet address ───────────────────────────────────────
    console.log('[nft/mint] Fetching wallet address for user', user_id)
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('wallet_address')
      .eq('id', user_id)
      .single()

    if (profileError || !profile) {
      console.log('[nft/mint] Profile not found', profileError)
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    console.log('[nft/mint] Profile found, wallet_address:', profile.wallet_address ?? 'none')

    // ── 3. Idempotency check ─────────────────────────────────────────────────
    // Short-circuit only on 'minted'. For 'pending', capture the row ID so
    // we can upgrade it to 'minted' once the user has a wallet — avoids
    // duplicate rows on repeat calls.
    console.log('[nft/mint] Checking for existing NFT record')
    const baseIdempotencyQuery = supabase
      .from('nft_tokens')
      .select('*')
      .eq('user_id', user_id)
      .in('status', ['minted', 'pending'])

    const { data: existing, error: idempotencyError } = await (
      hunt_location_id === null
        ? baseIdempotencyQuery.is('hunt_location_id', null)
        : baseIdempotencyQuery.eq('hunt_location_id', hunt_location_id)
    ).maybeSingle()

    if (idempotencyError) {
      console.error('[nft/mint] Idempotency query error:', idempotencyError.message)
    }

    if (existing?.status === 'minted') {
      console.log('[nft/mint] Already minted — returning existing record', existing.id)
      return NextResponse.json({
        status: 'minted',
        token_id: existing.token_id,
        transaction_hash: existing.transaction_hash,
        contract_address: existing.contract_address,
        chain: existing.chain,
        edition_number: existing.edition_number,
      })
    }

    // Pending row ID — if set, upgrade the row rather than inserting a new one.
    const pendingRowId: string | null =
      existing?.status === 'pending' ? (existing.id as string) : null

    if (pendingRowId) {
      console.log('[nft/mint] Found pending row to potentially upgrade:', pendingRowId)
    }

    const contractAddress = process.env.NEXT_PUBLIC_NFT_CONTRACT_ADDRESS!
    const chain = 'base-sepolia-testnet'

    // ── 4. No wallet — return or insert pending row ────────────────────────
    if (!profile.wallet_address) {
      if (pendingRowId) {
        // Pending row already exists and we still have no wallet — return as-is.
        console.log('[nft/mint] No wallet and pending row exists — returning as-is')
        return NextResponse.json({
          status: 'pending',
          token_id: tokenIdText,
          contract_address: contractAddress,
          chain,
          edition_number: existing!.edition_number,
        })
      }

      console.log('[nft/mint] No wallet address — inserting pending NFT token')
      const { data: pendingRow, error: insertError } = await supabase
        .from('nft_tokens')
        .insert({
          user_id,
          hunt_location_id,
          scan_id,
          token_id: tokenIdText,
          edition_number: scan_number,
          status: 'pending',
          contract_address: contractAddress,
          chain,
        })
        .select()
        .single()

      if (insertError) {
        console.log('[nft/mint] Failed to insert pending row', insertError)
        return NextResponse.json(
          { error: 'Failed to save pending NFT' },
          { status: 500 }
        )
      }

      console.log('[nft/mint] Pending row inserted', pendingRow.id)
      return NextResponse.json({
        status: 'pending',
        token_id: tokenIdText,
        contract_address: contractAddress,
        chain,
        edition_number: scan_number,
      })
    }

    // ── 5. Mint on-chain ──────────────────────────────────────────────────────
    console.log('[nft/mint] Minting NFT to', profile.wallet_address)
    const transactionHash = await mintNFT({
      toAddress: profile.wallet_address as string,
      tokenId: tokenIdBigInt,
      amount: 1,
    })

    console.log('[nft/mint] Mint successful, tx hash:', transactionHash)

    // ── 6. Save minted record (upgrade pending row or insert new) ───────────
    if (pendingRowId) {
      // Upgrade the existing pending row to minted.
      console.log('[nft/mint] Upgrading pending row to minted:', pendingRowId)
      const { error: updateError } = await supabase
        .from('nft_tokens')
        .update({
          status: 'minted',
          transaction_hash: transactionHash,
          contract_address: contractAddress,
          chain,
        })
        .eq('id', pendingRowId)

      if (updateError) {
        console.error('[nft/mint] Failed to upgrade pending row:', updateError.message)
      } else {
        console.log('[nft/mint] Pending row upgraded to minted')
      }
    } else {
      // Insert a fresh minted row.
      const { data: mintedRow, error: mintInsertError } = await supabase
        .from('nft_tokens')
        .insert({
          user_id,
          hunt_location_id,
          scan_id,
          token_id: tokenIdText,
          edition_number: scan_number,
          transaction_hash: transactionHash,
          status: 'minted',
          contract_address: contractAddress,
          chain,
        })
        .select()
        .single()

      if (mintInsertError) {
        console.log('[nft/mint] Mint succeeded but failed to insert record', mintInsertError)
      } else {
        console.log('[nft/mint] Minted row inserted', mintedRow.id)
      }
    }

    return NextResponse.json({
      status: 'minted',
      token_id: tokenIdText,
      transaction_hash: transactionHash,
      contract_address: contractAddress,
      chain,
      edition_number: scan_number,
    })
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error'
    console.log('[nft/mint] Unexpected error:', message)
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
