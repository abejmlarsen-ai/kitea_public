// ─── Shop Page ────────────────────────────────────────────────────────────────
import type { Metadata } from 'next'
import { createClient, createServiceRoleClient } from '@/lib/supabase/server'
import ShopClient from './ShopClient'

export const metadata: Metadata = { title: 'Shop' }

export type ShopProduct = {
  id: string
  name: string
  description: string | null
  image_url: string | null
  hunt_location_id: string
  price: number | null
  stripe_price_id: string | null
}

export type HuntGroup = {
  hunt_location_id: string
  hunt_name: string
  scan_number: number
  products: ShopProduct[]
}

export default async function ShopPage() {
  const supabase = await createClient()
  const serviceClient = createServiceRoleClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  // Fetch all active products that are tied to a hunt
  const { data: rawProducts } = await serviceClient
    .from('products')
    .select('id, name, description, image_url, hunt_location_id, price, stripe_price_id')
    .eq('is_active', true)
    .not('hunt_location_id', 'is', null)
    .order('created_at', { ascending: true })

  const products: ShopProduct[] = (rawProducts ?? [])
    .filter((p): p is typeof p & { hunt_location_id: string } => p.hunt_location_id !== null)
    .map((p) => ({
      id: p.id,
      name: p.name,
      description: p.description ?? null,
      image_url: p.image_url ?? null,
      hunt_location_id: p.hunt_location_id,
      price: p.price ?? null,
      stripe_price_id: p.stripe_price_id ?? null,
    }))

  // Collect unique hunt_location_ids that have products
  const huntLocationIds = [...new Set(products.map((p) => p.hunt_location_id))]

  // Fetch hunt location names
  const { data: rawLocations } = await serviceClient
    .from('hunt_locations')
    .select('id, name')
    .in('id', huntLocationIds.length > 0 ? huntLocationIds : [''])

  const locationMap = new Map((rawLocations ?? []).map((l) => [l.id, l.name]))

  // Build hunt groups — only include hunts the user has scanned
  const huntGroups: HuntGroup[] = []

  if (user) {
    for (const locId of huntLocationIds) {
      // Check scans table
      const { count: scanCount } = await serviceClient
        .from('scans')
        .select('id', { count: 'exact', head: true })
        .eq('user_id', user.id)
        .eq('hunt_location_id', locId)

      // Check collectibles table
      const { count: nftCount } = await serviceClient
        .from('collectibles')
        .select('id', { count: 'exact', head: true })
        .eq('user_id', user.id)
        .eq('hunt_location_id', locId)
        .eq('status', 'minted')

      const hasScan = (scanCount ?? 0) > 0
      const hasNft = (nftCount ?? 0) > 0

      if (hasScan !== hasNft) {
        console.warn(
          `[shop] scan/nft discrepancy for user=${user.id} hunt=${locId}: scans=${scanCount} collectibles=${nftCount}`
        )
      }

      // Grant access if either confirms the scan
      if (!hasScan && !hasNft) continue

      // Compute scan number: count distinct users who scanned at or before this user
      let computedScanNumber = 1
      const { data: userFirstScan } = await serviceClient
        .from('scans')
        .select('scanned_at')
        .eq('user_id', user.id)
        .eq('hunt_location_id', locId)
        .order('scanned_at', { ascending: true })
        .limit(1)

      if (userFirstScan && userFirstScan.length > 0 && userFirstScan[0].scanned_at) {
        // Get all scans at or before this user's first scan, then count unique users
        const { data: priorScans } = await serviceClient
          .from('scans')
          .select('user_id')
          .eq('hunt_location_id', locId)
          .lte('scanned_at', userFirstScan[0].scanned_at)

        if (priorScans) {
          const uniqueUsers = new Set(priorScans.map((s) => s.user_id))
          computedScanNumber = uniqueUsers.size
        }
      }

      huntGroups.push({
        hunt_location_id: locId,
        hunt_name: locationMap.get(locId) ?? 'Hunt',
        scan_number: computedScanNumber,
        products: products.filter((p) => p.hunt_location_id === locId),
      })
    }
  }

  return (
    <div className="page-theme page-theme--shop">
      <ShopClient
        huntGroups={huntGroups}
        userId={user?.id ?? null}
      />
    </div>
  )
}
