// ─── Shop Page ────────────────────────────────────────────────────────────────
import type { Metadata } from 'next'
import { createClient, createServiceRoleClient } from '@/lib/supabase/server'
import ShopClient from './ShopClient'

export const metadata: Metadata = { title: 'Shop' }

export type UnlockType = 'scan' | 'signup'

export type ShopProduct = {
  id: string
  name: string
  description: string | null
  image_url: string | null
  // Null for 'signup' products, which are not tied to a hunt.
  hunt_location_id: string | null
  price: number | null
  stripe_price_id: string | null
  unlock_type: UnlockType
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

  // Fetch every active product — both hunt-gated ('scan') and account-gated
  // ('signup'). The hunt_location_id filter that used to live on this query is
  // gone; the two categories are split below so signup products survive.
  const { data: rawProducts } = await serviceClient
    .from('products')
    .select('id, name, description, image_url, hunt_location_id, price, stripe_price_id, unlock_type')
    .eq('is_active', true)
    .order('created_at', { ascending: true })

  // ── Split into the two unlock categories ──────────────────────────────────
  // Data errors are skipped with a warning rather than rendered or thrown:
  //   • 'signup' product with a hunt_location_id
  //   • 'scan'   product without a hunt_location_id
  const scanProducts: ShopProduct[] = []
  const signupProducts: ShopProduct[] = []

  for (const p of rawProducts ?? []) {
    const unlock_type: UnlockType = p.unlock_type === 'signup' ? 'signup' : 'scan'
    const base = {
      id: p.id,
      name: p.name,
      description: p.description ?? null,
      image_url: p.image_url ?? null,
      price: p.price ?? null,
      stripe_price_id: p.stripe_price_id ?? null,
    }

    if (unlock_type === 'signup') {
      if (p.hunt_location_id !== null) {
        console.warn(
          `[shop] skipping product ${p.id} (${p.name}): unlock_type='signup' but hunt_location_id is set`
        )
        continue
      }
      signupProducts.push({ ...base, hunt_location_id: null, unlock_type: 'signup' })
    } else {
      if (p.hunt_location_id === null) {
        console.warn(
          `[shop] skipping product ${p.id} (${p.name}): unlock_type='scan' but hunt_location_id is null`
        )
        continue
      }
      scanProducts.push({ ...base, hunt_location_id: p.hunt_location_id, unlock_type: 'scan' })
    }
  }

  // Collect unique hunt_location_ids that have 'scan' products
  const huntLocationIds = [
    ...new Set(
      scanProducts
        .map((p) => p.hunt_location_id)
        .filter((id): id is string => id !== null)
    ),
  ]

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
      const { count: collectibleCount } = await serviceClient
        .from('collectibles')
        .select('id', { count: 'exact', head: true })
        .eq('user_id', user.id)
        .eq('hunt_location_id', locId)
        .eq('status', 'minted')

      const hasScan       = (scanCount ?? 0) > 0
      const hasCollectible = (collectibleCount ?? 0) > 0

      if (hasScan !== hasCollectible) {
        console.warn(
          `[shop] scan/collectible discrepancy for user=${user.id} hunt=${locId}: scans=${scanCount} collectibles=${collectibleCount}`
        )
      }

      // Grant access if either confirms the scan
      if (!hasScan && !hasCollectible) continue

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
        products: scanProducts.filter((p) => p.hunt_location_id === locId),
      })
    }
  }

  return (
    <div className="page-theme page-theme--shop">
      <ShopClient
        huntGroups={huntGroups}
        signupProducts={user ? signupProducts : []}
        userId={user?.id ?? null}
      />
    </div>
  )
}
