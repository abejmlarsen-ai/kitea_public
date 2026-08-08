// ─── Shared collectible mint logic ────────────────────────────────────────────
// Database-only — no blockchain calls. Called both server-side from
// /api/nfc/scan (so a scan only reports success once the reward actually
// exists) and from the standalone /api/collectible/mint route.
import type { SupabaseClient } from '@supabase/supabase-js'
import type { Database } from '@/lib/types/database'

export type MintParams = {
  user_id:          string
  hunt_location_id: string | null
}

export type MintResult =
  | { ok: true;  status: 'minted' | 'already_minted'; edition_number: number }
  | { ok: false; error: string }

export async function mintCollectible(
  db: SupabaseClient<Database>,
  { user_id, hunt_location_id }: MintParams
): Promise<MintResult> {
  // ── Idempotency: return early if already minted ────────────────────────
  const idempotencyQuery = db
    .from('collectibles')
    .select('id, edition_number')
    .eq('user_id', user_id)
    .eq('status', 'minted')

  const { data: existing, error: existingErr } = await (
    hunt_location_id
      ? idempotencyQuery.eq('hunt_location_id', hunt_location_id)
      : idempotencyQuery.is('hunt_location_id', null)
  ).maybeSingle()

  if (existingErr) {
    console.error('[mintCollectible] idempotency check error:', existingErr.message)
    return { ok: false, error: 'Failed to check for an existing collectible.' }
  }

  if (existing) {
    console.log('[mintCollectible] already minted — edition_number:', existing.edition_number)
    return { ok: true, status: 'already_minted', edition_number: existing.edition_number as number }
  }

  // ── Edition number: count existing minted rows for this location + 1 ──
  const countQuery = db
    .from('collectibles')
    .select('*', { count: 'exact', head: true })
    .eq('status', 'minted')

  const { count, error: countErr } = await (
    hunt_location_id
      ? countQuery.eq('hunt_location_id', hunt_location_id)
      : countQuery.is('hunt_location_id', null)
  )

  if (countErr) {
    console.error('[mintCollectible] count error:', countErr.message)
    return { ok: false, error: 'Failed to determine the edition number.' }
  }

  const edition_number = (count ?? 0) + 1

  // ── Insert minted row ──────────────────────────────────────────────────
  const { data: newRow, error: insertError } = await db
    .from('collectibles')
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

  if (insertError || !newRow) {
    console.error('[mintCollectible] insert error:', insertError?.message)
    return { ok: false, error: 'Failed to save the collectible.' }
  }

  console.log('[mintCollectible] minted row inserted — id:', newRow.id, '| edition_number:', newRow.edition_number)
  return { ok: true, status: 'minted', edition_number: newRow.edition_number as number }
}
