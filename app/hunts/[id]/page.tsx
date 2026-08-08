import { createClient, createServiceRoleClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import HuntNotFound from './HuntNotFound'
import HuntEntryClient from './HuntEntryClient'
import HuntBackButton from '@/components/layout/HuntBackButton'

// This is the entry gate for a hunt: it decides whether to show the two-path
// options screen or skip straight to the user's previously selected path.
// That decision depends on live hunt_progress state, so it must never be
// cached/prerendered — createClient() already calls cookies() which forces
// dynamic rendering, this makes that guarantee explicit.
export const dynamic = 'force-dynamic'

export default async function HuntPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>
  searchParams: Promise<{ select?: string; scanned?: string }>
}) {
  const { id } = await params
  const { select, scanned } = await searchParams
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

  // The scan flow lands here with ?scanned=true to trigger the "Tag Found!"
  // celebration on whichever path page the user ends up on — carry it
  // through every redirect below instead of dropping it at this gate.
  const scannedSuffix = scanned === 'true' ? '?scanned=true' : ''

  // "Back to selection" links here with ?select=1 to force the options
  // screen regardless of any previously saved selected_path.
  const forceReselect = select === '1'

  if (!forceReselect) {
    const { data: progress } = await db
      .from('hunt_progress')
      .select('selected_path')
      .eq('user_id', user.id)
      .eq('hunt_location_id', id)
      .maybeSingle()

    if (progress?.selected_path === 'coded')    redirect(`/hunts/${id}/coded${scannedSuffix}`)
    if (progress?.selected_path === 'location') redirect(`/hunts/${id}/location${scannedSuffix}`)
    // No row, or selected_path not set yet — first visit, fall through to
    // the options screen below.
  }

  return (
    <div className="page-theme page-theme--hunt">
      <HuntBackButton />
      <HuntEntryClient
        huntLocationId={huntLocation.id}
        huntName={huntLocation.name}
        userId={user.id}
        scanned={scanned === 'true'}
      />
    </div>
  )
}
