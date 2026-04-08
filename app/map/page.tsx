import type { Metadata } from 'next'
import { createServiceRoleClient } from '@/lib/supabase/server'
import HuntsClient from '../hunts/HuntsClient'

export const metadata: Metadata = { title: 'Map | Kitea' }

export default async function MapPage() {
  // Use service-role client so locations always load regardless of auth state.
  // RLS on hunt_locations requires authenticated role, but the map is public.
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const db = createServiceRoleClient() as any

  const isProd = process.env.NEXT_PUBLIC_VERCEL_ENV === 'production'
  const baseQuery = db
    .from('hunt_locations')
    .select('id, name, description, latitude, longitude, total_scans, region, city')
  const { data: locations, error: locError } = await (
    isProd ? baseQuery.eq('is_active', true) : baseQuery
  )

  console.log('[map/page] locations count:', locations?.length ?? 0, '| error:', locError?.message ?? null)
  if (locations && locations.length > 0) {
    console.log('[map/page] first location sample:', JSON.stringify(locations[0]))
  }

  return (
    <HuntsClient locations={locations ?? []} />
  )
}
