import { createClient, createServiceRoleClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import HuntNotFound from '../HuntNotFound'
import HuntLocationClient from './HuntLocationClient'
import HuntBackButton from '@/components/layout/HuntBackButton'
import { getCachedSignedUrl } from '@/lib/storage/signedUrlCache'

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

  const [hintsRes, progressRes, scansRes, revealRes] = await Promise.all([
    db.from('hunt_hints')
      .select('hint_1_text, hint_2_text, hint_3_text, hint_1_answer, hint_2_answer, hint_3_answer')
      .eq('hunt_location_id', id).maybeSingle(),
    db.from('hunt_progress')
      .select('location_hint_1_solved, location_hint_2_solved, location_hint_3_solved, location_revealed')
      .eq('user_id', user.id).eq('hunt_location_id', id).maybeSingle(),
    db.from('scans').select('id').eq('hunt_location_id', id).eq('user_id', user.id).maybeSingle(),
    // Pulling the actual reveal content here too (not just existence) costs
    // nothing extra — same query — so an already-revealed user's reveal
    // content can be handed to the client instead of it re-fetching on mount.
    db.from('hunt_reveals').select('id, reveal_directions, reveal_image_url').eq('hunt_location_id', id).maybeSingle(),
  ])

  const hints    = hintsRes.data
  const progress = progressRes.data

  const initialRevealed = !!progress?.location_revealed
  let initialRevealContent: { directions: string | null; imageUrl: string | null } | null = null
  if (initialRevealed && revealRes.data) {
    let revealImageUrl = revealRes.data.reveal_image_url
    if (revealImageUrl && !revealImageUrl.startsWith('http')) {
      revealImageUrl = await getCachedSignedUrl(db.storage, 'hunt-assets-private', revealImageUrl)
    }
    initialRevealContent = { directions: revealRes.data.reveal_directions, imageUrl: revealImageUrl }
  }

  return (
    <div className="page-theme page-theme--hunt">
      <HuntBackButton />
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
        hasRevealData={!!revealRes.data}
        initialRevealed={initialRevealed}
        initialRevealContent={initialRevealContent}
        clueIsReal={
          [hints?.hint_1_answer, hints?.hint_2_answer, hints?.hint_3_answer]
            .every((a) => a != null && a !== '[PLACEHOLDER]')
        }
      />
    </div>
  )
}
