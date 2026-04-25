import { createClient, createServiceRoleClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import HuntPageClient from './HuntPageClient'

export default async function HuntPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const db = createServiceRoleClient() as any

  const { data: huntLocation } = await db
    .from('hunt_locations')
    .select('id, name, description, total_scans, latitude, longitude')
    .eq('id', id)
    .single()

  if (!huntLocation) {
    return (
      <div style={{
        display: 'flex', flexDirection: 'column', alignItems: 'center',
        justifyContent: 'center', minHeight: '100vh',
        background: '#F5F0E8', color: '#0B2838', padding: '2rem', textAlign: 'center',
        position: 'relative', zIndex: 2,
      }}>
        <h1 style={{ fontSize: '1.5rem', fontWeight: 700, marginBottom: '1rem' }}>Hunt not found</h1>
        <a href="/map" style={{
          padding: '0.75rem 1.5rem', background: '#4A7C8C', color: '#FFFFFF',
          borderRadius: '6px', textDecoration: 'none', fontWeight: 600,
        }}>
          Return to Map
        </a>
      </div>
    )
  }

  const [clueRes, hintsRes, revealsRes, scansRes] = await Promise.all([
    db.from('hunt_clues').select('*').eq('hunt_location_id', id).maybeSingle(),
    db.from('hunt_hints').select('*').eq('hunt_location_id', id).maybeSingle(),
    db.from('hunt_reveals').select('*').eq('hunt_location_id', id).maybeSingle(),
    db.from('scans').select('id').eq('hunt_location_id', id).eq('user_id', user.id).maybeSingle(),
  ])

  const clue    = clueRes.data    as { text_content: string | null; answer: string | null; image_url: string | null } | null
  const hints   = hintsRes.data   as {
    hint_1_text: string | null; hint_1_answer: string | null
    hint_2_text: string | null; hint_2_answer: string | null
    hint_3_text: string | null; hint_3_answer: string | null
  } | null
  const reveals = revealsRes.data as { reveal_directions: string | null; reveal_image_url: string | null } | null

  const [clueImageUrl, revealImageUrl] = await Promise.all([
    clue?.image_url
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      ? db.storage.from('hunt-assets-private').createSignedUrl(clue.image_url, 3600).then((r: any) => r.data?.signedUrl ?? null)
      : Promise.resolve(null),
    reveals?.reveal_image_url
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      ? db.storage.from('hunt-assets-private').createSignedUrl(reveals.reveal_image_url, 3600).then((r: any) => r.data?.signedUrl ?? null)
      : Promise.resolve(null),
  ])

  return (
    <HuntPageClient
      huntLocation={huntLocation}
      userId={user.id}
      clue={clue}
      hints={hints}
      reveals={reveals}
      clueImageUrl={clueImageUrl as string | null}
      revealImageUrl={revealImageUrl as string | null}
      hasScanned={!!scansRes.data}
    />
  )
}
