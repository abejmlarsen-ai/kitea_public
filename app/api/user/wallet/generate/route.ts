// ─── POST /api/user/wallet/generate ──────────────────────────────────────────
// Deterministically generates an Ethereum wallet address for the authenticated
// user using keccak256(email + WALLET_SALT) as the private key.
// Idempotent: returns the existing address if one is already saved.
// Blockchain minting is no longer performed — collectibles are DB-only.
import { NextRequest, NextResponse } from 'next/server'
import { ethers } from 'ethers'
import { createServiceRoleClient } from '@/lib/supabase/server'

export async function POST(req: NextRequest) {
  try {
    const { email } = (await req.json()) as { email: string }
    console.log('[wallet/generate] called for email:', email)

    const authHeader = req.headers.get('authorization')
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const supabase = createServiceRoleClient()
    const token = authHeader.slice(7)
    const { data: { user }, error: userError } = await supabase.auth.getUser(token)

    if (userError || !user) {
      return NextResponse.json({ error: 'Invalid session' }, { status: 401 })
    }

    // Idempotency: return early if wallet already saved
    const { data: profile } = await supabase
      .from('profiles')
      .select('wallet_address')
      .eq('id', user.id)
      .single()

    if (profile?.wallet_address) {
      console.log('[wallet/generate] wallet already exists:', profile.wallet_address)
      return NextResponse.json({ wallet_address: profile.wallet_address, created: false })
    }

    // Generate deterministic wallet
    const salt = process.env.WALLET_SALT
    if (!salt) {
      console.error('[wallet/generate] WALLET_SALT env var is not set')
      return NextResponse.json({ error: 'Server misconfiguration: WALLET_SALT not set' }, { status: 500 })
    }

    const privateKey = ethers.id(email + salt)
    const generatedWallet = new ethers.Wallet(privateKey)
    const walletAddress = generatedWallet.address

    console.log('[wallet/generate] generated address:', walletAddress, 'for user:', user.id)

    const { error: updateError } = await supabase
      .from('profiles')
      .update({ wallet_address: walletAddress })
      .eq('id', user.id)

    if (updateError) {
      console.error('[wallet/generate] Failed to save wallet:', updateError.message)
      return NextResponse.json({ error: 'Failed to save wallet' }, { status: 500 })
    }

    console.log('[wallet/generate] wallet saved for user:', user.id)
    return NextResponse.json({ wallet_address: walletAddress, created: true })

  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error'
    console.error('[wallet/generate] unexpected error:', message)
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
