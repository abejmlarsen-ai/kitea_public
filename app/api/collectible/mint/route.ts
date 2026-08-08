// ─── Collectible Mint Route — database-only ─────────────────────────────────
// No blockchain calls. Records a collectible directly in collectibles as 'minted'.
// Mint logic itself lives in lib/collectibles/mint.ts, shared with
// /api/nfc/scan (which mints inline, server-side, before reporting success).
// This route stays standalone for the founder-collectible mint fired from
// LoginForm.tsx.
import { NextRequest, NextResponse } from 'next/server'
import { createServiceRoleClient } from '@/lib/supabase/server'
import { mintCollectible } from '@/lib/collectibles/mint'

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

    console.log('[collectible/mint] db-only mint — user_id:', user_id, '| hunt_location_id:', hunt_location_id ?? 'null (founder)')

    const db = createServiceRoleClient()
    const result = await mintCollectible(db, { user_id, hunt_location_id: hunt_location_id ?? null })

    if (!result.ok) {
      return NextResponse.json({ error: result.error }, { status: 500 })
    }

    return NextResponse.json({ status: result.status, edition_number: result.edition_number })

  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error'
    console.error('[collectible/mint] unexpected error:', message)
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
