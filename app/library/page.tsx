// ─── Library Page (Protected) ────────────────────────────────────────────
import type { Metadata } from 'next'
import { createClient, createServiceRoleClient } from '@/lib/supabase/server'
import WalletButton from '@/components/wallet/WalletButton'
import WalletAutoConnect from '@/components/wallet/WalletAutoConnect'
import ThirdwebAppProvider from '@/components/providers/ThirdwebProvider'
import LibraryClient from './LibraryClient'
import { getCachedSignedUrl } from '@/lib/storage/signedUrlCache'

export const metadata: Metadata = { title: 'Library' }

// Must always read fresh — a scan can mint a new collectible moments before
// the user lands here, and createClient() alone doesn't guarantee this route
// won't be served from a stale cache. Same reasoning as map/page.tsx and
// hunts/[id]/page.tsx.
export const dynamic = 'force-dynamic'

export type MintedCollectible = {
  id: string
  token_id: number
  edition_number: number
  hunt_location_id: string | null
  status: string
  transaction_hash: string | null
  minted_at: string | null
  hunt_locations: { name: string; art_image_url: string | null } | null
  // Pre-generated 1-hour signed URL for the collectible's art image (null if no image path).
  art_signed_image_url: string | null
}

export default async function LibraryPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  let firstName = 'there'
  let walletAddress: string | null = null
  let collectibles: MintedCollectible[] = []

  if (user) {
    // Both queries only depend on user.id, not on each other — run them
    // concurrently instead of one after another.
    const [profileResult, collectiblesResult] = await Promise.all([
      supabase
        .from('profiles')
        .select('first_name, wallet_address')
        .eq('id', user.id)
        .maybeSingle(),
      supabase
        .from('collectibles')
        .select(
          'id, token_id, edition_number, hunt_location_id, status, transaction_hash, minted_at, hunt_locations(name, art_image_url)'
        )
        .eq('user_id', user.id)
        .eq('status', 'minted')
        .order('minted_at', { ascending: false }),
    ])

    const profile = profileResult.data as {
      first_name?: string
      wallet_address?: string | null
    } | null

    firstName =
      profile?.first_name ??
      (user.user_metadata?.first_name as string | undefined) ??
      'there'

    walletAddress = profile?.wallet_address ?? null

    const data = collectiblesResult.data

    if (data) {
      // Generate 1-hour signed URLs for any collectible that has a private art image path.
      const srClient = createServiceRoleClient()
      const rawCollectibles = data as unknown as Omit<MintedCollectible, 'art_signed_image_url'>[]

      collectibles = await Promise.all(
        rawCollectibles.map(async (collectible) => {
          const imagePath = collectible.hunt_locations?.art_image_url ?? null

          // If already a full URL keep it; if a path, sign it; if null, skip.
          let art_signed_image_url: string | null = null
          if (imagePath) {
            if (imagePath.startsWith('http')) {
              art_signed_image_url = imagePath
            } else {
              art_signed_image_url = await getCachedSignedUrl(srClient.storage, 'hunt-assets-private', imagePath)
            }
          }

          return { ...collectible, art_signed_image_url }
        })
      )
    }
  }

  return (
    <div className="page-theme page-theme--library">
      <section className="section_1 section_1--library">
        <div className="container">
          <p id="user-greeting">Welcome back, {firstName}!</p>
          <h2>Library</h2>
          <div className="collectible-wallet-area">
            {/* thirdweb/react is a heavy client SDK — scoped to just this
                page instead of the root layout, so Map/Hunt/every other
                route no longer pays for it. */}
            <ThirdwebAppProvider>
              <WalletButton />
              {!walletAddress && user?.email && (
                <WalletAutoConnect userEmail={user.email} userId={user.id} />
              )}
            </ThirdwebAppProvider>
          </div>
        </div>
      </section>

      {/* No .container here — the grid is full bleed, edge to edge. */}
      <section className="library-section">
        <LibraryClient
          collectibles={collectibles}
          userId={user?.id ?? null}
          walletAddress={walletAddress}
        />
      </section>
    </div>
  )
}
