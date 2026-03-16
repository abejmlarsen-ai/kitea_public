import { NextRequest, NextResponse } from 'next/server'
import { createServiceRoleClient } from '@/lib/supabase/server'
import { mintNFT } from '@/lib/thirdweb/mint'

export async function POST(req: NextRequest) {
  try {
    const { wallet_address } = (await req.json()) as { wallet_address: string }
    console.log('[user/wallet] called with address:', wallet_address)

    // ── 1. Authenticate user from Authorization header ───────────────────────────────────────────────
    const authHeader = req.headers.get('authorization')
    if (!authHeader) {
      console.log('[user/wallet] Missing authorization header')
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const supabase = createServiceRoleClient()
    const token = authHeader.replace('Bearer ', '')
    const { data: { user }, error: userError } = await supabase.auth.getUser(token)

    if (userError || !user) {
      console.log('[user/wallet] Invalid session:', userError?.message)
      return NextResponse.json({ error: 'Invalid session' }, { status: 401 })
    }

    const userId = user.id
    console.log('[user/wallet] Saving wallet for user:', userId, wallet_address)

    // ── 2. Save wallet address to profile ────────────────────────────────────────────────────────────────────────────
    const { error: updateError } = await supabase
      .from('profiles')
      .update({ wallet_address })
      .eq('id', userId)

    if (updateError) {
      console.log('[user/wallet] Failed to update wallet:', updateError.message)
      return NextResponse.json({ error: 'Failed to save wallet' }, { status: 500 })
    }

    console.log('[user/wallet] Wallet saved, checking for pending NFTs')

    // ── 3. Fetch pending NFT tokens for this user ──────────────────────────────────────────────────────────────────────
    const { data: pendingTokens } = await supabase
      .from('nft_tokens')
      .select('*')
      .eq('user_id', userId)
      .eq('status', 'pending')

    if (!pendingTokens || pendingTokens.length === 0) {
      console.log('[user/wallet] No pending NFTs')
      return NextResponse.json({ success: true, minted: 0 })
    }

    console.log('[user/wallet] Minting', pendingTokens.length, 'pending NFT(s)')

    // ── 4. Mint each pending token now that we have a wallet ─────────────────────────────────────────────
    let minted = 0
    for (const token of pendingTokens) {
      try {
        console.log('[user/wallet] Minting pending token:', token.id, 'token_id:', token.token_id)
        const transactionHash = await mintNFT({
          toAddress: wallet_address,
          tokenId: BigInt(token.token_id ?? '0'),
          amount: 1,
        })

        await supabase
          .from('nft_tokens')
          .update({ status: 'minted', transaction_hash: transactionHash })
          .eq('id', token.id)

        console.log('[user/wallet] Minted token:', token.id, 'tx:', transactionHash)
        minted++
      } catch (err) {
        console.error('[user/wallet] Failed to mint pending token:', token.id, err)
      }
    }

    return NextResponse.json({ success: true, minted })
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error'
    console.log('[user/wallet] Unexpected error:', message)
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
