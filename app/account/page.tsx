import { redirect } from 'next/navigation'
import { createClient, createServiceRoleClient } from '@/lib/supabase/server'
import AccountClient from './AccountClient'

export const metadata = { title: 'Account' }

export default async function AccountPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  // ── Profile ──────────────────────────────────────────────────────────────
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const anonDb = supabase as any
  const { data: profile } = await anonDb
    .from('profiles')
    .select('first_name, last_name, mobile_number, date_of_birth, created_at')
    .eq('id', user.id)
    .maybeSingle()

  // ── Stats (service-role to bypass RLS safely) ────────────────────────────
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const db = createServiceRoleClient() as any

  const [scansRes, nftRes, huntRes] = await Promise.all([
    db.from('scans')
      .select('id', { count: 'exact', head: true })
      .eq('user_id', user.id),
    db.from('collectibles')
      .select('id', { count: 'exact', head: true })
      .eq('user_id', user.id)
      .eq('status', 'minted'),
    db.from('hunt_progress')
      .select('hunt_location_id', { count: 'exact', head: true })
      .eq('user_id', user.id)
      .not('completed_at', 'is', null),
  ])

  const stats = {
    tagsScanned:     (scansRes.count  ?? 0) as number,
    nftsEarned:      (nftRes.count    ?? 0) as number,
    huntsCompleted:  (huntRes.count   ?? 0) as number,
    memberSince:     profile?.created_at
      ? new Date(profile.created_at).toLocaleDateString('en-AU', { month: 'long', year: 'numeric' })
      : '—',
  }

  return (
    <div className="page-theme page-theme--account">
      <AccountClient
        userId={user.id}
        email={user.email ?? ''}
        profile={{
          first_name:    profile?.first_name    ?? '',
          last_name:     profile?.last_name     ?? '',
          mobile_number: profile?.mobile_number ?? '',
          date_of_birth: profile?.date_of_birth ?? '',
        }}
        stats={stats}
      />
    </div>
  )
}
