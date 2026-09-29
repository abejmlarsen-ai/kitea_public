// ─── Founder collectible awarding ────────────────────────────────────────────
// The "Founder" collectible is the collectibles row with hunt_location_id = null,
// granted once per account. It used to be awarded from two divergent places
// (an inline block in the auth callback and an un-awaited POST in LoginForm).
// Every path now goes through this one function: service-role, idempotent,
// awaited. Database-only — no blockchain calls, same as lib/collectibles/mint.ts.
import { createServiceRoleClient } from '@/lib/supabase/server'

export type FounderAwardResult =
  | { ok: true;  status: 'awarded' | 'already_awarded' }
  | { ok: false; error: string }

export async function awardFounderCollectible(userId: string): Promise<FounderAwardResult> {
  const db = createServiceRoleClient()

  // ── Idempotency — skip if a minted founder collectible already exists ──────
  const { data: existing, error: existingError } = await db
    .from('collectibles')
    .select('id')
    .eq('user_id', userId)
    .is('hunt_location_id', null)
    .eq('status', 'minted')
    .maybeSingle()

  if (existingError) {
    console.error('[founder] idempotency check failed:', existingError.message)
    return { ok: false, error: existingError.message }
  }

  if (existing) {
    console.log('[founder] collectible already exists — skipping for', userId)
    return { ok: true, status: 'already_awarded' }
  }

  // ── Edition number — count existing minted founder rows + 1 ───────────────
  const { count, error: countError } = await db
    .from('collectibles')
    .select('*', { count: 'exact', head: true })
    .eq('status', 'minted')
    .is('hunt_location_id', null)

  if (countError) {
    console.error('[founder] edition count failed:', countError.message)
    return { ok: false, error: countError.message }
  }

  const edition_number = (count ?? 0) + 1

  // ── Insert the minted row ────────────────────────────────────────────────
  const { error: insertError } = await db
    .from('collectibles')
    .insert({
      user_id:          userId,
      hunt_location_id: null,
      scan_id:          null,
      token_id:         null,
      edition_number,
      status:           'minted',
      chain:            null,
      contract_address: null,
      transaction_hash: null,
      minted_at:        new Date().toISOString(),
    })

  if (insertError) {
    // A concurrent call may have inserted the row between our check and this
    // insert. A unique-constraint violation therefore means "already awarded",
    // not a failure — never two rows, never a 500.
    if (insertError.code === '23505') {
      console.warn('[founder] concurrent insert detected — treating as already awarded for', userId)
      return { ok: true, status: 'already_awarded' }
    }
    console.error('[founder] insert failed:', insertError.message)
    return { ok: false, error: insertError.message }
  }

  console.log('[founder] collectible inserted — edition_number:', edition_number, '| user:', userId)
  return { ok: true, status: 'awarded' }
}
