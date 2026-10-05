// ─── NFC Scan Verification ───────────────────────────────────────────────────
// POST /api/nfc/scan
// Verifies a scanned NFC tag UID, records the scan and mints the collectible.
//
// Retry-safe, idempotent and race-safe: each user ends up with exactly one
// scan and one minted collectible per hunt location, however many times (or
// how concurrently) this is called. A repeat call after a failed mint mints
// now; a repeat call after success returns "already collected". scan_number
// and edition_number are assigned atomically in Postgres (record_scan and
// mint_hunt_collectible — supabase/migrations/20261002120000_atomic_scan_and_mint.sql).
import { NextRequest, NextResponse } from 'next/server'
import type { SupabaseClient } from '@supabase/supabase-js'
import type { Database } from '@/lib/types/database'
import { createServiceRoleClient } from '@/lib/supabase/server'
import { mintCollectible } from '@/lib/collectibles/mint'
import { isValidTagUid } from '@/lib/hunts/tagUid'
import { PENDING_CLAIM_COOKIE, clearedPendingClaimCookieOptions } from '@/lib/auth/pendingClaim'

// Postgres unique_violation — always means "already collected", never an error
const UNIQUE_VIOLATION = '23505'

/**
 * Returns a JSON response that also clears the pending-claim cookie. Used once
 * the claim is settled (claimed, already collected, or can never succeed), so
 * the user isn't sent back to /scan on their next login. Not used for 401s
 * (they still need to sign in) or 500s (worth retrying).
 */
function settled(body: unknown, init?: ResponseInit) {
  const response = NextResponse.json(body, init)
  response.cookies.set(PENDING_CLAIM_COOKIE, '', clearedPendingClaimCookieOptions)
  return response
}

/** The user's scan for a hunt location, if any. Tolerates zero or more rows. */
async function findScan(
  db: SupabaseClient<Database>,
  user_id: string,
  hunt_location_id: string,
): Promise<{ id: string; scan_number: number } | null> {
  const { data, error } = await db
    .from('scans')
    .select('id, scan_number')
    .eq('user_id', user_id)
    .eq('hunt_location_id', hunt_location_id)
    .order('scanned_at', { ascending: true, nullsFirst: false })
    .limit(1)

  if (error) {
    console.error('[scan] scan lookup error:', error.message)
    return null
  }
  const row = data?.[0]
  return row ? { id: row.id, scan_number: row.scan_number as number } : null
}

export async function POST(request: NextRequest) {
  try {
    // ── Step 1 — Parse the incoming scan data ──────────────────────────────
    const body = await request.json()
    const { tag_uid } = body
    console.log('[scan] incoming tag_uid:', tag_uid)

    if (!tag_uid) {
      return NextResponse.json(
        { error: 'No tag ID provided' },
        { status: 400 }
      )
    }

    // Tag UIDs are hex with optional colons (test tags: "TEST:<id>"). Anything
    // else is rejected before it reaches a database filter.
    if (!isValidTagUid(tag_uid)) {
      return settled(
        { error: 'Tag not recognised. Make sure you are scanning an official Kitea tag.' },
        { status: 404 }
      )
    }

    // ── Step 2 — Service-role Supabase client (bypasses RLS) ─────────────
    const supabase = createServiceRoleClient()

    // ── Step 3 — Verify authenticated user from Authorization header ──────
    const authHeader = request.headers.get('authorization')
    if (!authHeader) {
      console.log('[scan] missing authorization header')
      return NextResponse.json(
        { error: 'You must be logged in to scan' },
        { status: 401 }
      )
    }

    const token = authHeader.replace('Bearer ', '')
    const { data: { user }, error: userError } = await supabase.auth.getUser(token)
    console.log('[scan] user:', user?.id ?? null, '| userError:', userError?.message ?? null)

    if (userError || !user) {
      return NextResponse.json(
        { error: 'Invalid session. Please log in again.' },
        { status: 401 }
      )
    }

    // ── Step 4 — Look up the NFC tag ──────────────────────────────────────
    // Normalise the incoming UID so chips programmed with any casing or
    // formatting resolve correctly:
    //   raw          e.g. "04:6a:61:22:49:68:80"  (as received)
    //   upper        e.g. "04:6A:61:22:49:68:80"  (uppercase)
    //   stripped     e.g. "046a61224968"           (colons removed)
    //   strippedUpper e.g. "046A61224968"          (uppercase + no colons)
    // One IN query covers all four variants. .in() passes them as values —
    // never splice the UID into filter syntax (an .or() string would let a
    // crafted UID add its own conditions and match someone else's tag).
    const uidVariants = Array.from(new Set([
      tag_uid,
      tag_uid.toUpperCase(),
      tag_uid.replace(/:/g, ''),
      tag_uid.toUpperCase().replace(/:/g, ''),
    ]))

    console.log('[scan] uid variants tried:', uidVariants)

    // Tolerates zero or more matches (e.g. the same chip stored in two UID
    // formats): the oldest active tag wins.
    const { data: tags, error: tagError } = await supabase
      .from('nfc_tags')
      .select('*, hunt_locations!hunt_location_id(*)')
      .in('tag_uid', uidVariants)
      .eq('is_active', true)
      .order('created_at', { ascending: true })
      .limit(1)

    const tag = tags?.[0] ?? null
    console.log('[scan] tag:', tag?.id ?? null, '| hunt_location_id:', tag?.hunt_location_id ?? null, '| tagError:', tagError?.message ?? null)

    if (tagError) {
      console.error('[scan] tag lookup failed:', tagError.message)
      return NextResponse.json(
        { error: 'Something went wrong. Please try again.' },
        { status: 500 }
      )
    }

    // No active tag with this UID — unknown or deactivated. Terminal.
    if (!tag) {
      return settled(
        { error: 'Tag not recognised. Make sure you are scanning an official Kitea tag.' },
        { status: 404 }
      )
    }

    const huntLocationId = tag.hunt_location_id

    if (!huntLocationId) {
      return settled(
        { error: 'This tag is not yet linked to a hunt location.' },
        { status: 409 }
      )
    }

    // ── Step 5 — The hunt must be live ───────────────────────────────────
    const location = tag.hunt_locations
    if (location?.is_active === false) {
      return settled(
        { success: false, hunt_not_active: true, error: 'This hunt is not active right now.' },
        { status: 403 }
      )
    }

    // ── Step 6 — Record the scan (or find the existing one) ─────────────
    // record_scan assigns scan_number atomically in the database and is
    // idempotent per (user, hunt location). An existing scan does NOT end the
    // request: if an earlier mint failed, Step 7 mints now.
    let scan: { id: string; scan_number: number; created: boolean } | null = null

    const { data: scanRows, error: scanError } = await supabase.rpc('record_scan', {
      p_user_id:          user.id,
      p_hunt_location_id: huntLocationId,
      p_nfc_tag_id:       tag.id,
      p_tag_uid:          tag_uid,
    })

    if (scanError?.code === UNIQUE_VIOLATION) {
      // A concurrent request won the race on scans_user_hunt_uniq — use its row.
      console.warn('[scan] concurrent scan insert detected for', user.id)
      const existing = await findScan(supabase, user.id, huntLocationId)
      if (existing) scan = { ...existing, created: false }
    } else if (scanError) {
      console.error('[scan] record_scan failed:', scanError.code, scanError.message)
    } else if (scanRows?.[0]) {
      const row = scanRows[0]
      scan = { id: row.scan_id, scan_number: row.scan_number, created: row.created }
    }

    if (!scan) {
      return NextResponse.json(
        { error: 'Failed to record scan. Please try again.' },
        { status: 500 }
      )
    }

    console.log('[scan] scan', scan.created ? 'recorded' : 'already existed', '— id:', scan.id, '| scan_number:', scan.scan_number)

    // ── Step 7 — Mint (awaited). Returns only once the minted row exists:
    // the existing one, a reused failed/pending row, or a new one.
    const mintResult = await mintCollectible(supabase, {
      user_id:          user.id,
      hunt_location_id: huntLocationId,
      scan_id:          scan.id,
    })

    if (!mintResult.ok) {
      console.error('[scan] mint failed after scan was logged:', mintResult.error)
      return NextResponse.json(
        { error: 'Your scan was recorded, but we could not create your collectible. Please scan again to retry.' },
        { status: 500 }
      )
    }

    // ── Step 8 — Already collected: both the scan and the collectible existed
    if (!scan.created && mintResult.status === 'already_minted') {
      return settled({
        success:           false,
        already_scanned:   true,
        already_collected: true,
        message:           'You have already collected this hunt.',
        scan_number:       scan.scan_number,
        hunt_location_id:  huntLocationId,
        collectible_id:    mintResult.collectible_id,
        edition_number:    mintResult.edition_number,
        location,
      })
    }

    // ── Step 9 — Sign the art image URL so the popup can render it directly
    // from this response — no follow-up round trip to sign it client-side.
    // Left null if the hunt has no art yet; the client treats null as "show
    // the placeholder logo" exactly like it already does elsewhere.
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let artImageUrl = (location as any)?.art_image_url ?? null
    if (artImageUrl && !artImageUrl.startsWith('http')) {
      const { data: signed, error: signError } = await supabase.storage
        .from('hunt-assets-private')
        .createSignedUrl(artImageUrl, 3600)
      if (signError || !signed?.signedUrl) {
        console.error('[scan] failed to sign art image URL:', signError?.message ?? 'no signedUrl')
        artImageUrl = null
      } else {
        artImageUrl = signed.signedUrl
      }
    }

    console.log('[scan] success — scan_number:', scan.scan_number, '| collectible:', mintResult.status, mintResult.edition_number)
    return settled({
      success: true,
      message: `You are number ${scan.scan_number} to scan ${location?.name}!`,
      scan_number: scan.scan_number,
      total_scanners: scan.scan_number,
      hunt_name: location?.name ?? null,
      hunt_location_id: huntLocationId,
      location,
      collectible_id: mintResult.collectible_id,
      edition_number: mintResult.edition_number,
      art_image_url: artImageUrl,
    })
  } catch (error) {
    console.error('[scan] unexpected error:', error)
    return NextResponse.json(
      { error: 'Something went wrong. Please try again.' },
      { status: 500 }
    )
  }
}
