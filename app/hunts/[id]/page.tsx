import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import HuntPageClient from './HuntPageClient'

export default async function HuntPage({ params }: { params: { id: string } }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  const { data: huntLocation } = await supabase
    .from('hunt_locations')
    .select('id, name, description, total_scans, latitude, longitude')
    .eq('id', params.id)
    .single()

  if (!huntLocation) redirect('/hunts')

  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL ?? 'http://localhost:3000'

  let progressData = null
  try {
    const progressRes = await fetch(
      `${baseUrl}/api/hunt/progress?user_id=${user.id}&hunt_location_id=${params.id}`,
      { cache: 'no-store' }
    )
    progressData = progressRes.ok ? await progressRes.json() : null
  } catch (err) {
    console.error('[hunt/page] progress fetch failed:', err)
  }

  console.log('[hunt/page] huntLocation:', huntLocation)
  console.log('[hunt/page] progressData:', JSON.stringify(progressData, null, 2))

  return (
    <HuntPageClient
      huntLocation={huntLocation}
      userId={user.id}
      progressData={progressData}
    />
  )
}
