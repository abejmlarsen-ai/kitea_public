import type { Metadata } from 'next'
import { createClient, createServiceRoleClient } from '@/lib/supabase/server'
import HuntsClient from '../hunts/HuntsClient'

export const metadata: Metadata = { title: 'Map | Kitea' }

// This route calls no Next.js "dynamic" API (no cookies/headers/searchParams),
// so without this it's a candidate for build-time static prerendering — which
// would freeze the hunt list at the last deploy instead of reading it fresh
// from Supabase on every request. Force dynamic rendering explicitly.
export const dynamic = 'force-dynamic'

export default async function MapPage() {
  // Use service-role client so locations always load regardless of auth state.
  // RLS on hunt_locations requires authenticated role, but the map is public.
  const db = createServiceRoleClient()

  const isProd = process.env.NEXT_PUBLIC_VERCEL_ENV === 'production'
  const baseQuery = db
    .from('hunt_locations')
    .select('id, name, description, latitude, longitude, total_scans, region, city')
  const locationsQuery = isProd ? baseQuery.eq('is_active', true) : baseQuery

  // The locations query and the auth check are independent — run them
  // concurrently instead of one after another. Which hunts the current user
  // has already scanned (regardless of clue progress) is a bonus for logged-in
  // users only; anonymous visitors get an empty set and the map stays public.
  const [{ data: locations }, { data: { user }, supabase }] = await Promise.all([
    locationsQuery,
    createClient().then(async (sb) => ({ ...(await sb.auth.getUser()), supabase: sb })),
  ])

  let scannedLocationIds: string[] = []
  if (user) {
    const { data: scans } = await supabase
      .from('scans')
      .select('hunt_location_id')
      .eq('user_id', user.id)

    scannedLocationIds = Array.from(
      new Set(
        (scans ?? [])
          .map((s) => s.hunt_location_id)
          .filter((id): id is string => id != null)
      )
    )
  }

  return (
    <HuntsClient locations={locations ?? []} scannedLocationIds={scannedLocationIds} />
  )
}
