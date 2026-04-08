// ─── NFT Mint Route — database-only ─────────────────────────────────────────
// No blockchain calls. Records a collectible directly in nft_tokens as 'minted'.
import { NextRequest, NextResponse } from 'next/server'
import { createServiceRoleClient } from '@/lib/supabase/server'

export async function POST(req: NextRequest) {
  try {
    const body = (await req.json()) as {
      user_id: string
      hunt_location_id: string | null
      scan_number?: number
      scan_id?: string | null
      is_founder?: boolean
    }

    const { user_id, hunt_location_id } = body

    if (!user_id) {
      return NextResponse.json({ error: 'user_id required' }, { status: 400 })
    }

    console.log('[nft/mint] db-only mint — user_id:', user_id, '| hunt_location_id:', hunt_location_id ?? 'null (founder)')

    const supabase = createServiceRoleClient()

    // ── Idempotency: return early if already minted ────────────────────────
    const idempotencyQuery = supabase
      .from('nft_tokens')
      .select('id, edition_number')
      .eq('user_id', user_id)
      .eq('status', 'minted')

    const { data: existing } = await (
      hunt_location_id
        ? idempotencyQuery.eq('hunt_location_id', hunt_location_id)
        : idempotencyQuery.is('hunt_location_id', null)
    ).maybeSingle()

    if (existing) {
      console.log('[nft/mint] already minted — edition_number:', existing.edition_number)
      return NextResponse.json({ status: 'already_minted', edition_number: existing.edition_number })
    }

    // ── Edition number: count existing minted rows for this location + 1 ──
    const countQuery = supabase
      .from('nft_tokens')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'minted')

    const { count } = await (
      hunt_location_id
        ? countQuery.eq('hunt_location_id', hunt_location_id)
        : countQuery.is('hunt_location_id', null)
    )

    const edition_number = (count ?? 0) + 1

    console.log('[nft/mint] inserting minted row — edition_number:', edition_number)

    // ── Insert minted row ──────────────────────────────────────────────────
    const { data: newRow, error: insertError } = await supabase
      .from('nft_tokens')
      .insert({
        user_id,
        hunt_location_id: hunt_location_id ?? null,
        status:            'minted',
        chain:             null,
        token_id:          null,
        contract_address:  null,
        transaction_hash:  null,
        edition_number,
        minted_at:         new Date().toISOString(),
      })
      .select('id, edition_number')
      .single()

    if (insertError) {
      console.error('[nft/mint] insert error:', insertError.message)
      return NextResponse.json({ error: 'Failed to save collectible' }, { status: 500 })
    }

    console.log('[nft/mint] minted row inserted — id:', newRow.id, '| edition_number:', newRow.edition_number)
    return NextResponse.json({ status: 'minted', edition_number: newRow.edition_number })

  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error'
    console.error('[nft/mint] unexpected error:', message)
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
