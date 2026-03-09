import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import HuntPageClient from './HuntPageClient'

export default async function HuntPage({ params }: { params: { id: string } }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  console.log('[hunt/page] fetching huntLocation for id:', params.id)

  const { data: huntLocation, error: locationError } = await supabase
    .from('hunt_locations')
    .select('id, name, description, total_scans, latitude, longitude')
    .eq('id', params.id)
    .single()

  console.log('[hunt/page] huntLocation:', huntLocation, '| error:', locationError?.message ?? null)

  // Render an inline error instead of redirecting — prevents /hunts → /map bounce
  if (!huntLocation) {
    return (
      <div style={{
        display: 'flex', flexDirection: 'column', alignItems: 'center',
        justifyContent: 'center', minHeight: '100vh',
        background: '#f1faee', color: '#1d3557', padding: '2rem', textAlign: 'center',
      }}>
        <h1 style={{ fontSize: '1.5rem', fontWeight: 700, marginBottom: '1rem' }}>Hunt not found</h1>
        <p style={{ color: '#457b9d', marginBottom: '2rem' }}>
          {locationError ? locationError.message : 'This hunt location could not be loaded.'}
        </p>
        <a href="/map" style={{
          padding: '0.75rem 1.5rem', background: '#2a9d8f', color: 'white',
          borderRadius: '0.5rem', textDecoration: 'none', fontWeight: 600,
        }}>
          Return to Map
        </a>
      </div>
    )
  }

  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL ?? 'http://localhost:3000'

  let progressData = null
  try {
    const progressRes = await fetch(
      `${baseUrl}/api/hunt/progress?user_id=${user.id}&hunt_location_id=${params.id}`,
      { cache: 'no-store' }
    )
    progressData = progressRes.ok ? await progressRes.json() : null
    console.log('[hunt/page] progressData fetch status:', progressRes.status)
  } catch (err) {
    console.error('[hunt/page] progress fetch failed:', err)
  }

  console.log('[hunt/page] progressData:', JSON.stringify(progressData, null, 2))

  return (
    <HuntPageClient
      huntLocation={huntLocation}
      userId={user.id}
      progressData={progressData}
    />
  )
}
