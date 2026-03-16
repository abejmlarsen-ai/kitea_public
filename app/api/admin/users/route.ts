// ─── Admin Users API ──────────────────────────────────────────────────────────
// GET  /api/admin/users — returns profiles rows merged with auth emails
// PATCH /api/admin/users — toggles is_admin on a single profile
//
// Both endpoints verify the calling user is an admin before responding.
// The service-role key is required to read auth.users emails and to write
// is_admin without being blocked by RLS.

import { NextResponse } from 'next/server'
import { createClient as createSupabaseAdmin } from '@supabase/supabase-js'
import { createClient } from '@/lib/supabase/server'

// ── Helper: verify calling user is admin ──────────────────────────────────────
async function getAdminUser() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return null

  const { data: profileRaw } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single()

  const isAdmin =
    (profileRaw as Record<string, unknown> | null)?.is_admin === true

  return isAdmin ? user : null
}

// ── Service-role client factory ────────────────────────────────────────────────
function serviceClient() {
  return createSupabaseAdmin(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
}

// ── GET /api/admin/users ───────────────────────────────────────────────────────
export async function GET() {
  const admin = await getAdminUser()
  if (!admin) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const client = serviceClient()

  const [{ data: authData }, { data: profiles }] = await Promise.all([
    client.auth.admin.listUsers({ perPage: 1000 }),
    client.from('profiles').select('*').order('created_at', { ascending: false }),
  ])

  // Build a map of id → email from the auth table
  const emailMap = new Map(
    (authData?.users ?? []).map((u) => [u.id, u.email ?? null])
  )

  const combined = (profiles ?? []).map((p) => ({
    id: p.id,
    first_name: p.first_name,
    last_name: p.last_name,
    email: emailMap.get(p.id) ?? null,
    mobile_number: p.mobile_number ?? null,
    // is_admin was added to the DB after types were generated
    is_admin: Boolean((p as Record<string, unknown>).is_admin),
    created_at: p.created_at ?? null,
  }))

  return NextResponse.json(combined)
}

// ── PATCH /api/admin/users ─────────────────────────────────────────────────────
export async function PATCH(request: Request) {
  const admin = await getAdminUser()
  if (!admin) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const { userId, isAdmin } = (await request.json()) as {
    userId: string
    isAdmin: boolean
  }

  if (!userId) {
    return NextResponse.json({ error: 'userId required' }, { status: 400 })
  }

  const client = serviceClient()

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { error } = await (client as any)
    .from('profiles')
    .update({ is_admin: isAdmin })
    .eq('id', userId)

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ success: true })
}
