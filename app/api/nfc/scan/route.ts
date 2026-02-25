// ─── NFC Scan Verification ────────────────────────────────────────────────────
// POST /api/nfc/scan
// Verifies a scanned NFC tag UID and records the scan in the database.

import { NextRequest, NextResponse } from 'next/server'
import { createClient as createServerClient } from '@supabase/supabase-js'

export async function POST(request: NextRequest) {
  try {
    // ── Step 1 — Parse the incoming scan data ────────────────────────────────
    const body = await request.json()
    const { tag_uid } = body

    console.log('[scan] incoming tag_uid:', tag_uid)

    if (!tag_uid) {
      return NextResponse.json(
        { error: 'No tag ID provided' },
        { status: 400 }
      )
    }

    // ── Step 2 — Service-role Supabase client (bypasses RLS) ─────────────────
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )

    // ── Step 3 — Verify the authenticated user from the Authorization header ──
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

    // ── Step 4 — Look up the NFC tag ─────────────────────────────────────────
    // Match on either uid or tag_uid column (both store the same value).
    // Use !hunt_location_id to explicitly tell Supabase which FK column
    // joins nfc_tags → hunt_locations (without this hint the join silently
    // returns null when the FK column name is not the Supabase default).
    const { data: tag, error: tagError } = await supabase
      .from('nfc_tags')
      .select('*, hunt_locations!hunt_location_id(*)')
      .or(`tag_uid.eq.${tag_uid},uid.eq.${tag_uid}`)
      .eq('is_active', true)
      .single()

    console.log('[scan] tag query result:', JSON.stringify(tag, null, 2))
    console.log('[scan] tag query error:', tagError?.message ?? null)
    console.log('[scan] tag.hunt_location_id:', tag?.hunt_location_id ?? 'undefined')
    console.log('[scan] tag.location_id:', tag?.location_id ?? 'undefined')

    if (tagError || !tag) {
      return NextResponse.json(
        { error: 'Tag not recognised. Make sure you are scanning an official Kitea tag.' },
        { status: 404 }
      )
    }

    // hunt_location_id is the FK that joins to hunt_locations
    const huntLocationId = tag.hunt_location_id

    // ── Step 5 — Check if this user has already scanned this location ─────────
    const { data: existingScan, error: existingError } = await supabase
      .from('scans')
      .select('id, scan_number')
      .eq('user_id', user.id)
      .eq('location_id', huntLocationId)
      .single()

    console.log('[scan] existingScan:', JSON.stringify(existingScan, null, 2))
    console.log('[scan] existingScan error:', existingError?.message ?? null)

    if (existingScan) {
      return NextResponse.json({
        success: false,
        already_scanned: true,
        message: 'You have already scanned this location.',
        scan_number: existingScan.scan_number,
        location: tag.hunt_locations
      })
    }

    // ── Step 6 — Get current scan count to assign a scan number ──────────────
    const { data: locationData, error: locationError } = await supabase
      .from('hunt_locations')
      .select('total_scans, name')
      .eq('id', huntLocationId)
      .single()

    console.log('[scan] locationData:', JSON.stringify(locationData, null, 2))
    console.log('[scan] locationData error:', locationError?.message ?? null)

    const scan_number = (locationData?.total_scans ?? 0) + 1

    // ── Step 7 — Record the scan ──────────────────────────────────────────────
    const { error: scanError } = await supabase
      .from('scans')
      .insert({
        user_id: user.id,
        location_id: huntLocationId,
        tag_uid: tag_uid,
        scan_number: scan_number,
        scanned_at: new Date().toISOString()
      })

    console.log('[scan] scanError:', scanError?.message ?? null)

    if (scanError) {
      console.error('[scan] scan insert error:', scanError)
      return NextResponse.json(
        { error: 'Failed to record scan. Please try again.' },
        { status: 500 }
      )
    }

    // ── Step 8 — Return success ───────────────────────────────────────────────
    console.log('[scan] success — scan_number:', scan_number)
    return NextResponse.json({
      success: true,
      message: `You are number ${scan_number} to scan ${locationData?.name}!`,
      scan_number: scan_number,
      location: tag.hunt_locations
    })

  } catch (error) {
    console.error('[scan] unexpected error:', error)
    return NextResponse.json(
      { error: 'Something went wrong. Please try again.' },
      { status: 500 }
    )
  }
}
