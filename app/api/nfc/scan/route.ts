// ─── NFC Scan Verification ────────────────────────────────────────────────────
// POST /api/nfc/scan
// Verifies a scanned NFC tag UID and records the scan in the database.
import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/client'
import { createClient as createServerClient } from '@supabase/supabase-js'

export async function POST(request: NextRequest) {
  try {
    // Step 1 — Parse the incoming scan data
    // When a user scans a tag, their app sends us the tag ID
    const body = await request.json()
    const { tag_uid } = body

    if (!tag_uid) {
      return NextResponse.json(
        { error: 'No tag ID provided' },
        { status: 400 }
      )
    }

    // Step 2 — Create a Supabase server client with the service role key
    // This bypasses RLS so we can do admin operations like recording scans
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )

    // Step 3 — Get the authenticated user from the request
    // We read the auth token from the request cookies
    const authHeader = request.headers.get('authorization')
    if (!authHeader) {
      return NextResponse.json(
        { error: 'You must be logged in to scan' },
        { status: 401 }
      )
    }

    const token = authHeader.replace('Bearer ', '')
    const { data: { user }, error: userError } = await supabase.auth.getUser(token)

    if (userError || !user) {
      return NextResponse.json(
        { error: 'Invalid session. Please log in again.' },
        { status: 401 }
      )
    }

    // Step 4 — Look up the NFC tag in the database
    // Check the tag exists and is active
    const { data: tag, error: tagError } = await supabase
      .from('nfc_tags')
      .select('*, hunt_locations(*)')
      .eq('tag_uid', tag_uid)
      .eq('is_active', true)
      .single()

    if (tagError || !tag) {
      return NextResponse.json(
        { error: 'Tag not recognised. Make sure you are scanning an official Kitea tag.' },
        { status: 404 }
      )
    }

    // Step 5 — Check if this user has already scanned this location
    const { data: existingScan } = await supabase
      .from('scans')
      .select('id, scan_number')
      .eq('user_id', user.id)
      .eq('location_id', tag.location_id)
      .single()

    if (existingScan) {
      return NextResponse.json({
        success: false,
        already_scanned: true,
        message: 'You have already scanned this location.',
        scan_number: existingScan.scan_number,
        location: tag.hunt_locations
      })
    }

    // Step 6 — Get the current scan count to assign this user a scan number
    const { data: location } = await supabase
      .from('hunt_locations')
      .select('total_scans, name')
      .eq('id', tag.location_id)
      .single()

    const scan_number = (location?.total_scans ?? 0) + 1

    // Step 7 — Record the scan in the database
    // This also triggers the automatic scan counter update we set up earlier
    const { error: scanError } = await supabase
      .from('scans')
      .insert({
        user_id: user.id,
        location_id: tag.location_id,
        tag_uid: tag_uid,
        scan_number: scan_number,
        scanned_at: new Date().toISOString()
      })

    if (scanError) {
      console.error('Scan insert error:', scanError)
      return NextResponse.json(
        { error: 'Failed to record scan. Please try again.' },
        { status: 500 }
      )
    }

    // Step 8 — Return success with all the details
    // The app uses this response to show the user their scan result
    return NextResponse.json({
      success: true,
      message: `You are number ${scan_number} to scan ${location?.name}!`,
      scan_number: scan_number,
      location: tag.hunt_locations
    })

  } catch (error) {
    console.error('Scan error:', error)
    return NextResponse.json(
      { error: 'Something went wrong. Please try again.' },
      { status: 500 }
    )
  }
}