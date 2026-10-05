import { createClient, createServiceRoleClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import HuntNotFound from './HuntNotFound'
import HuntEntryClient from './HuntEntryClient'

// This is the entry gate for a hunt: it always shows the two-path options
// screen — the user re-picks a path every time they open the page, no
// previous choice is restored. createClient() already calls cookies() which
// forces dynamic rendering; this makes that guarantee explicit.
export const dynamic = 'force-dynamic'

export default async function HuntPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>
  searchParams: Promise<{ scanned?: string }>
}) {
  const { id } = await params
  const { scanned } = await searchParams
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const db = createServiceRoleClient()

  const { data: huntLocation } = await db
    .from('hunt_locations')
    .select('id, name')
    .eq('id', id)
    .single()

  if (!huntLocation) {
    return <HuntNotFound />
  }

  return (
    <div className="page-theme page-theme--hunt">
      <div style={{ padding: '1rem 1.5rem 0' }}>
        <Link href="/map" className="nav-return-map-btn">← Return to map</Link>
      </div>
      <HuntEntryClient
        huntLocationId={huntLocation.id}
        huntName={huntLocation.name}
        scanned={scanned === 'true'}
      />
    </div>
  )
}
