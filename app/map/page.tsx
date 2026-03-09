import type { Metadata } from 'next'
import { createClient } from '@/lib/supabase/server'
import HuntsClient from '../hunts/HuntsClient'

export const metadata: Metadata = { title: 'Map | Kitea' }

export default async function MapPage() {
  const supabase = await createClient()

  const { data: locations } = await supabase
    .from('hunt_locations')
    .select('id, name, description, latitude, longitude, total_scans, region, city')
    .eq('is_active', true)

  return (
    <HuntsClient locations={locations ?? []} />
  )
}
