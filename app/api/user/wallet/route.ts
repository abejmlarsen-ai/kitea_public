// ─── POST /api/user/wallet ────────────────────────────────────────────────────
// Saves a wallet address to the user's profile.
// Blockchain minting is no longer performed — collectibles are DB-only.
import { NextRequest, NextResponse } from 'next/server'
import { createServiceRoleClient } from '@/lib/supabase/server'

export async function POST(req: NextRequest) {
  try {
    const { wallet_address } = (await req.json()) as { wallet_address: string }
    console.log('[user/wallet] called with address:', wallet_address)

    const authHeader = req.headers.get('authorization')
    if (!authHeader) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const supabase = createServiceRoleClient()
    const token = authHeader.replace('Bearer ', '')
    const { data: { user }, error: userError } = await supabase.auth.getUser(token)

    if (userError || !user) {
      return NextResponse.json({ error: 'Invalid session' }, { status: 401 })
    }

    const { error: updateError } = await supabase
      .from('profiles')
      .update({ wallet_address })
      .eq('id', user.id)

    if (updateError) {
      console.error('[user/wallet] Failed to update wallet:', updateError.message)
      return NextResponse.json({ error: 'Failed to save wallet' }, { status: 500 })
    }

    console.log('[user/wallet] wallet saved for user:', user.id)
    return NextResponse.json({ success: true })

  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error'
    console.error('[user/wallet] unexpected error:', message)
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
