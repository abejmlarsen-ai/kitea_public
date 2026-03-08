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
  const progressRes = await fetch(
    `${baseUrl}/api/hunt/progress?user_id=${user.id}&hunt_location_id=${params.id}`,
    { cache: 'no-store' }
  )
  const progressData = progressRes.ok ? await progressRes.json() : null

  return (
    <HuntPageClient
      huntLocation={huntLocation}
      userId={user.id}
      progressData={progressData}
    />
  )
}
