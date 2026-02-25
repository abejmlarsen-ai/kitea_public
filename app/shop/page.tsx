// ─── Shop Page ────────────────────────────────────────────────────────────────
// Server Component — fetches products + unlock state, then hands off to client.

import type { Metadata } from 'next'
import { createClient } from '@/lib/supabase/server'
import ShopClient from './ShopClient'

export const metadata: Metadata = { title: 'Shop' }

// The DB has a `price` column that was added after types were last generated.
// We add it here via a local augmented type + runtime cast.
export type ShopProduct = {
  id: string
  name: string
  description: string | null
  image_url: string | null
  hunt_location_id: string | null
  price: number
}

// Raw row shape returned from Supabase — typed as unknown so we can cast safely.
type RawProduct = {
  id: string
  name: string
  description?: string | null
  image_url?: string | null
  hunt_location_id?: string | null
  is_active?: boolean
  created_at?: string
  price?: number
  [key: string]: unknown
}

export default async function ShopPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  // Fetch all active products — cast to unknown first to escape generated types.
  const { data: rawProducts } = await supabase
    .from('products')
    .select('*')
    .eq('is_active', true)
    .order('created_at', { ascending: true })

  const products: ShopProduct[] = ((rawProducts as unknown as RawProduct[]) ?? []).map((p) => ({
    id: p.id,
    name: p.name,
    description: p.description ?? null,
    image_url: p.image_url ?? null,
    hunt_location_id: p.hunt_location_id ?? null,
    price: p.price ?? 0,
  }))

  // Fetch products this user has unlocked via scanning
  let unlockedProductIds: string[] = []
  if (user) {
    const { data: unlocks } = await supabase
      .from('product_unlocks')
      .select('product_id')
      .eq('user_id', user.id)

    type RawUnlock = { product_id: string; [key: string]: unknown }
    unlockedProductIds = ((unlocks as unknown as RawUnlock[]) ?? []).map((u) => u.product_id)
  }

  return (
    <ShopClient
      products={products}
      userId={user?.id ?? null}
      unlockedProductIds={unlockedProductIds}
    />
  )
}
