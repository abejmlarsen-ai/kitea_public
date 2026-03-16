// ─── Admin Page (Server Component) ───────────────────────────────────────────
// 1. Double-checks auth (proxy.ts already guards the route).
// 2. Verifies is_admin=true on the profiles row — redirects silently if not.
// 3. Reads ?tab= from the URL and passes it as initialTab to AdminClient
//    so clicking a dropdown item opens the correct tab immediately.

import { redirect } from 'next/navigation'
import type { Metadata } from 'next'
import { createClient } from '@/lib/supabase/server'
import AdminClient from './AdminClient'

export const metadata: Metadata = { title: 'Admin' }

type Tab = 'locations' | 'products' | 'nfc_tags' | 'orders' | 'users' | 'stats'
const VALID_TABS: Tab[] = ['locations', 'products', 'nfc_tags', 'orders', 'users', 'stats']

export default async function AdminPage({
  searchParams,
}: {
  searchParams: Promise<{ tab?: string }>
}) {
  const supabase = await createClient()

  // Auth check
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  // is_admin check — column added after last type generation, cast to access it
  const { data: profileRaw } = await supabase
    .from('profiles')
    .select('is_admin')
    .eq('id', user.id)
    .single()

  const isAdmin =
    (profileRaw as Record<string, unknown> | null)?.is_admin === true

  if (!isAdmin) redirect('/')

  // Resolve tab from query params (Next.js 16: searchParams is a Promise)
  const params     = await searchParams
  const tabParam   = params.tab
  const initialTab: Tab = VALID_TABS.includes(tabParam as Tab)
    ? (tabParam as Tab)
    : 'locations'

  return <AdminClient initialTab={initialTab} />
}
