// ─── Admin Page (Server Component) ───────────────────────────────────────────
// 1. Middleware already blocked unauthenticated users, but we double-check here.
// 2. We additionally verify is_admin=true on the user's profiles row.
//    If either check fails we redirect — no error message is shown to non-admins.

import { redirect } from 'next/navigation'
import type { Metadata } from 'next'
import { createClient } from '@/lib/supabase/server'
import AdminClient from './AdminClient'

export const metadata: Metadata = { title: 'Admin' }

export default async function AdminPage() {
  const supabase = await createClient()

  // Auth check (belt-and-suspenders in case middleware is bypassed)
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  // is_admin check — the column exists in the DB but was added after the last
  // types generation, so we cast to access it safely.
  const { data: profileRaw } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single()

  const isAdmin =
    (profileRaw as Record<string, unknown> | null)?.is_admin === true

  if (!isAdmin) {
    redirect('/')
  }

  return <AdminClient />
}
