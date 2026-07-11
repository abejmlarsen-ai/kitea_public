#!/usr/bin/env node
// ─── NFC Scan Flow Integration Test ──────────────────────────────────────────
// Proves the scan flow resolves purely from live Supabase data: inserts a
// throwaway hunt_locations + nfc_tags row, exercises POST /api/nfc/scan
// against a running server, asserts it resolves, then deletes everything it
// created (including the ephemeral test user).
//
// Run this any time a new tag/hunt is added, or after a schema change, to
// catch a column-name or RLS-policy regression before it hits production.
//
// Usage:
//   node --env-file=.env.local scripts/test-scan-flow.mjs
//
// Requires in the environment (.env.local):
//   NEXT_PUBLIC_SUPABASE_URL
//   NEXT_PUBLIC_SUPABASE_ANON_KEY
//   SUPABASE_SERVICE_ROLE_KEY   (not in .env.local by default — see .env.local.example)
//
// Requires the app server running and reachable — defaults to
// http://localhost:3000 (npm run dev), override with BASE_URL=... to point
// at a preview deployment instead.

import { createClient } from '@supabase/supabase-js'

const BASE_URL = process.env.BASE_URL || 'http://localhost:3000'
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL
const ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!SUPABASE_URL || !ANON_KEY || !SERVICE_ROLE_KEY) {
  console.error(
    '\n✗ Missing required env vars: NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_ANON_KEY, SUPABASE_SERVICE_ROLE_KEY.\n' +
    '  Run with:  node --env-file=.env.local scripts/test-scan-flow.mjs\n' +
    '  SUPABASE_SERVICE_ROLE_KEY is not currently in .env.local — copy it from .env.local.example / the Supabase dashboard.'
  )
  process.exit(1)
}

const admin = createClient(SUPABASE_URL, SERVICE_ROLE_KEY)
const anon = createClient(SUPABASE_URL, ANON_KEY)

const runId = Date.now().toString(36)
const testTagUid = `TEST:${runId}`
const testEmail = `scan-test-${runId}@kitea-test.invalid`
const testPassword = `Test-${runId}-!Aa1`

const created = { locationId: null, tagId: null, userId: null, scanId: null }

async function cleanup() {
  console.log('\n── Cleaning up ──')
  if (created.scanId) {
    const { error } = await admin.from('scans').delete().eq('id', created.scanId)
    console.log(error ? `  ! failed to delete scans row: ${error.message}` : '  deleted scans row')
  }
  if (created.tagId) {
    const { error } = await admin.from('nfc_tags').delete().eq('id', created.tagId)
    console.log(error ? `  ! failed to delete nfc_tags row: ${error.message}` : '  deleted nfc_tags row')
  }
  if (created.locationId) {
    const { error } = await admin.from('hunt_locations').delete().eq('id', created.locationId)
    console.log(error ? `  ! failed to delete hunt_locations row: ${error.message}` : '  deleted hunt_locations row')
  }
  if (created.userId) {
    const { error } = await admin.auth.admin.deleteUser(created.userId)
    console.log(error ? `  ! failed to delete test user: ${error.message}` : '  deleted test auth user')
  }
}

async function main() {
  console.log(`Scan flow integration test — run ${runId}`)
  console.log(`Target: ${BASE_URL}`)

  // ── 1. Throwaway hunt_location ────────────────────────────────────────────
  const { data: location, error: locErr } = await admin
    .from('hunt_locations')
    .insert({ name: `__TEST__ ${runId}`, is_active: true })
    .select('id')
    .single()
  if (locErr) throw new Error(`Could not insert test hunt_location: ${locErr.message}`)
  created.locationId = location.id
  console.log(`✓ inserted test hunt_location ${location.id}`)

  // ── 2. Throwaway nfc_tags row, pointed at that location ───────────────────
  const { data: tag, error: tagErr } = await admin
    .from('nfc_tags')
    .insert({ tag_uid: testTagUid, hunt_location_id: location.id, is_active: true })
    .select('id')
    .single()
  if (tagErr) throw new Error(`Could not insert test nfc_tags row: ${tagErr.message}`)
  created.tagId = tag.id
  console.log(`✓ inserted test nfc_tags row ${tag.id} (tag_uid=${testTagUid})`)

  // ── 3. Ephemeral auth user + session (scan requires a logged-in user) ─────
  const { data: userRes, error: userErr } = await admin.auth.admin.createUser({
    email: testEmail,
    password: testPassword,
    email_confirm: true,
  })
  if (userErr) throw new Error(`Could not create test user: ${userErr.message}`)
  created.userId = userRes.user.id
  console.log(`✓ created test user ${created.userId}`)

  const { data: signIn, error: signInErr } = await anon.auth.signInWithPassword({
    email: testEmail,
    password: testPassword,
  })
  if (signInErr) throw new Error(`Could not sign in as test user: ${signInErr.message}`)
  const accessToken = signIn.session.access_token
  console.log('✓ signed in as test user')

  // ── 4. Hit the real scan endpoint, exactly as the /scan page does ─────────
  const res = await fetch(`${BASE_URL}/api/nfc/scan`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${accessToken}`,
    },
    body: JSON.stringify({ tag_uid: testTagUid }),
  })
  const body = await res.json().catch(() => ({}))

  if (!res.ok || !body.success) {
    throw new Error(
      `Scan did not resolve successfully. HTTP ${res.status}. Response: ${JSON.stringify(body)}\n` +
      '  If this is "Tag not recognised": is the server pointed at the same Supabase project as ' +
      'this script? Does app/api/nfc/scan/route.ts query only columns that exist on nfc_tags ' +
      '(tag_uid, is_active, hunt_location_id)?'
    )
  }
  if (body.hunt_location_id !== location.id) {
    throw new Error(
      `Scan succeeded but resolved to the wrong hunt_location_id: expected ${location.id}, got ${body.hunt_location_id}`
    )
  }
  console.log(`✓ scan resolved successfully — scan_number=${body.scan_number}`)

  // Track the scans row it created so cleanup() can remove it.
  const { data: scanRow } = await admin
    .from('scans')
    .select('id')
    .eq('user_id', created.userId)
    .eq('hunt_location_id', location.id)
    .maybeSingle()
  if (scanRow) created.scanId = scanRow.id

  console.log('\n✓ PASS — scan flow resolves purely from live database state, no code changes needed')
}

main()
  .then(async () => {
    await cleanup()
    process.exit(0)
  })
  .catch(async (err) => {
    console.error('\n✗ FAIL —', err.message ?? err)
    await cleanup()
    process.exit(1)
  })
