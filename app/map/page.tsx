import type { Metadata } from 'next'
import { createClient } from '@/lib/supabase/server'
import HuntsClient from '../hunts/HuntsClient'

export const metadata: Metadata = { title: 'Map | Kitea' }

export default async function MapPage() {
  const supabase = await createClient()

  const { data: locations, error: locError } = await supabase
    .from('hunt_locations')
    .select('id, name, description, latitude, longitude, total_scans, region, city')
    .eq('is_active', true)

  console.log('[map/page] locations count:', locations?.length ?? 0, '| error:', locError?.message ?? null)
  if (locations && locations.length > 0) {
    console.log('[map/page] first location sample:', JSON.stringify(locations[0]))
  }

  return (
    <HuntsClient locations={locations ?? []} />
  )
}
