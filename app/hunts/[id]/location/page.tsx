import { createClient, createServiceRoleClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import HuntNotFound from '../HuntNotFound'
import HuntLocationClient from './HuntLocationClient'

// Hint text and scan status must be read fresh on every visit, not baked in
// at build/deploy time. createClient() already calls cookies() which
// implicitly forces dynamic rendering — this makes that guarantee explicit.
export const dynamic = 'force-dynamic'

export default async function HuntLocationPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  // hunt_hints has no public/authenticated SELECT policy (admin-only RLS) —
  // its question text is meant to be visible to any hunter working this
  // path, same as hunt_clues on the Coded Clue page, so it's read via the
  // service-role client. The answers themselves are never fetched here or
  // sent to the client — checking them happens server-side in /api/hunt/answer.
  const db = createServiceRoleClient()

  const { data: huntLocation } = await db
    .from('hunt_locations')
    .select('id, name')
    .eq('id', id)
    .single()

  if (!huntLocation) {
    return <HuntNotFound />
  }

  const [hintsRes, progressRes, scansRes] = await Promise.all([
    db.from('hunt_hints')
      .select('hint_1_text, hint_2_text, hint_3_text')
      .eq('hunt_location_id', id).maybeSingle(),
    db.from('hunt_progress')
      .select('location_hint_1_solved, location_hint_2_solved, location_hint_3_solved')
      .eq('user_id', user.id).eq('hunt_location_id', id).maybeSingle(),
    db.from('scans').select('id').eq('hunt_location_id', id).eq('user_id', user.id).maybeSingle(),
  ])

  const hints    = hintsRes.data
  const progress = progressRes.data

  return (
    <div className="page-theme page-theme--hunt">
      <HuntLocationClient
        huntLocation={huntLocation}
        userId={user.id}
        hints={hints}
        initialSolved={{
          1: progress?.location_hint_1_solved ?? false,
          2: progress?.location_hint_2_solved ?? false,
          3: progress?.location_hint_3_solved ?? false,
        }}
        hasScanned={!!scansRes.data}
      />
    </div>
  )
}
