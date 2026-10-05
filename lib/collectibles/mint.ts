// ─── Shared collectible mint logic ────────────────────────────────────────────
// Database-only — no blockchain calls. Called only server-side from
// /api/nfc/scan, after the user's own scan is verified and recorded, so a
// scan only reports success once the reward actually exists. Never expose
// this behind a route that takes user_id from the request.
//
// The mint itself is the Postgres function mint_hunt_collectible
// (supabase/migrations/20261002120000_atomic_scan_and_mint.sql). It is
// idempotent and race-safe: it returns the existing minted row if there is
// one, reuses a failed/pending row if there is one, and assigns
// edition_number atomically in the same statement as the insert/update.
import type { SupabaseClient } from '@supabase/supabase-js'
import type { Database } from '@/lib/types/database'

export type MintParams = {
  user_id:          string
  hunt_location_id: string
  scan_id:          string
}

export type MintResult =
  | { ok: true;  status: 'minted' | 'already_minted'; collectible_id: string; edition_number: number }
  | { ok: false; error: string }

// Postgres unique_violation
const UNIQUE_VIOLATION = '23505'

/** The user's minted collectible for a hunt location, if any. Tolerates zero or more rows. */
export async function findMintedCollectible(
  db: SupabaseClient<Database>,
  user_id: string,
  hunt_location_id: string,
): Promise<{ id: string; edition_number: number } | null> {
  const { data, error } = await db
    .from('collectibles')
    .select('id, edition_number')
    .eq('user_id', user_id)
    .eq('hunt_location_id', hunt_location_id)
    .eq('status', 'minted')
    .order('minted_at', { ascending: true, nullsFirst: false })
    .limit(1)

  if (error) {
    console.error('[mintCollectible] minted lookup error:', error.message)
    return null
  }
  const row = data?.[0]
  return row ? { id: row.id, edition_number: row.edition_number as number } : null
}

export async function mintCollectible(
  db: SupabaseClient<Database>,
  { user_id, hunt_location_id, scan_id }: MintParams
): Promise<MintResult> {
  const { data, error } = await db.rpc('mint_hunt_collectible', {
    p_user_id:          user_id,
    p_hunt_location_id: hunt_location_id,
    p_scan_id:          scan_id,
  })

  if (error) {
    // A concurrent mint won the race on collectibles_user_hunt_minted_uniq.
    // That means "already collected", never an error — return the winner.
    if (error.code === UNIQUE_VIOLATION) {
      const existing = await findMintedCollectible(db, user_id, hunt_location_id)
      if (existing) {
        console.warn('[mintCollectible] concurrent mint detected — treating as already minted for', user_id)
        return { ok: true, status: 'already_minted', collectible_id: existing.id, edition_number: existing.edition_number }
      }
    }
    console.error('[mintCollectible] mint_hunt_collectible failed:', error.code, error.message)
    return { ok: false, error: 'Failed to save the collectible.' }
  }

  const row = data?.[0]
  if (!row) {
    console.error('[mintCollectible] mint_hunt_collectible returned no row')
    return { ok: false, error: 'Failed to save the collectible.' }
  }

  console.log('[mintCollectible]', row.minted_now ? 'minted' : 'already minted',
    '— id:', row.collectible_id, '| edition_number:', row.edition_number)
  return {
    ok:             true,
    status:         row.minted_now ? 'minted' : 'already_minted',
    collectible_id: row.collectible_id,
    edition_number: row.edition_number,
  }
}
