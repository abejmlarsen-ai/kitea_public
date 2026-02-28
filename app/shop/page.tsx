// ─── Shop Page ────────────────────────────────────────────────────────────────
import type { Metadata } from 'next'
import { createClient } from '@/lib/supabase/server'
import ShopClient from './ShopClient'

export const metadata: Metadata = { title: 'Shop' }

export type ShopProduct = {
  id: string
  name: string
  description: string | null
  image_url: string | null
  hunt_location_id: string | null
  price: number
}

export type HuntLocation = {
  id: string
  name: string
}

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

type RawLocation = {
  id: string
  name: string
  [key: string]: unknown
}

export default async function ShopPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

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

  const { data: rawLocations } = await supabase
    .from('hunt_locations')
    .select('id, name')
    .eq('is_active', true)
    .order('name')

  const locations: HuntLocation[] = ((rawLocations as unknown as RawLocation[]) ?? []).map((l) => ({
    id: l.id,
    name: l.name,
  }))

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
      locations={locations}
    />
  )
}
