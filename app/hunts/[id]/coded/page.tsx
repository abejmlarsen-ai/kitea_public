import { createClient, createServiceRoleClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import HuntPageClient from '../HuntPageClient'
import HuntNotFound from '../HuntNotFound'

// Clue content and scan status must be read fresh on every visit, not baked
// in at build/deploy time. createClient() already calls cookies() which
// implicitly forces dynamic rendering — this makes that guarantee explicit.
export const dynamic = 'force-dynamic'

export default async function HuntCodedPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const db = createServiceRoleClient()

  const { data: huntLocation } = await db
    .from('hunt_locations')
    .select('id, name, description, total_scans, latitude, longitude')
    .eq('id', id)
    .single()

  if (!huntLocation) {
    return <HuntNotFound />
  }

  const [clueRes, scansRes] = await Promise.all([
    db.from('hunt_clues').select('text_content, answer, image_url, hint_text').eq('hunt_location_id', id).maybeSingle(),
    db.from('scans').select('id').eq('hunt_location_id', id).eq('user_id', user.id).maybeSingle(),
  ])

  const clue = clueRes.data

  const clueImageUrl = clue?.image_url
    ? await db.storage.from('hunt-assets-private').createSignedUrl(clue.image_url, 3600).then((r) => r.data?.signedUrl ?? null)
    : null

  return (
    <HuntPageClient
      huntLocation={huntLocation}
      userId={user.id}
      clue={clue}
      clueImageUrl={clueImageUrl}
      hasScanned={!!scansRes.data}
    />
  )
}
