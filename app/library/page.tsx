// ─── Library Page (Protected) ────────────────────────────────────────────
import type { Metadata } from 'next'
import { createClient, createServiceRoleClient } from '@/lib/supabase/server'
import WalletButton from '@/components/wallet/WalletButton'
import WalletAutoConnect from '@/components/wallet/WalletAutoConnect'
import LibraryClient from './LibraryClient'

export const metadata: Metadata = { title: 'Library' }

export type MintedNFT = {
  id: string
  token_id: number
  edition_number: number
  hunt_location_id: string | null
  status: string
  transaction_hash: string | null
  minted_at: string | null
  hunt_locations: { name: string; nft_image_url: string | null } | null
  // Pre-generated 1-hour signed URL for the NFT image (null if no image path).
  nft_signed_image_url: string | null
}

export default async function LibraryPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  let firstName = 'there'
  let walletAddress: string | null = null

  if (user) {
    const result = await supabase
      .from('profiles')
      .select('first_name, wallet_address')
      .eq('id', user.id)
      .maybeSingle()

    const profile = result.data as {
      first_name?: string
      wallet_address?: string | null
    } | null

    firstName =
      profile?.first_name ??
      (user.user_metadata?.first_name as string | undefined) ??
      'there'

    walletAddress = profile?.wallet_address ?? null
  }

  let nfts: MintedNFT[] = []
  if (user) {
    const { data } = await supabase
      .from('collectibles')
      .select(
        'id, token_id, edition_number, hunt_location_id, status, transaction_hash, minted_at, hunt_locations(name, nft_image_url)'
      )
      .eq('user_id', user.id)
      .eq('status', 'minted')
      .order('minted_at', { ascending: false })

    if (data) {
      // Generate 1-hour signed URLs for any NFT that has a private image path.
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const srClient = createServiceRoleClient() as any
      const rawNfts = data as unknown as Omit<MintedNFT, 'nft_signed_image_url'>[]

      nfts = await Promise.all(
        rawNfts.map(async (nft) => {
          const imagePath = nft.hunt_locations?.nft_image_url ?? null

          // If already a full URL keep it; if a path, sign it; if null, skip.
          let nft_signed_image_url: string | null = null
          if (imagePath) {
            if (imagePath.startsWith('http')) {
              nft_signed_image_url = imagePath
            } else {
              const { data: signed } = await srClient.storage
                .from('hunt-assets-private')
                .createSignedUrl(imagePath, 3600)
              nft_signed_image_url = signed?.signedUrl ?? null
            }
          }

          return { ...nft, nft_signed_image_url }
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
          <div className="nft-wallet-area">
            <WalletButton />
            {!walletAddress && user?.email && (
              <WalletAutoConnect userEmail={user.email} userId={user.id} />
            )}
          </div>
        </div>
      </section>

      <section className="library-section">
        <div className="container">
          <LibraryClient
            nfts={nfts}
            userId={user?.id ?? null}
            walletAddress={walletAddress}
          />
        </div>
      </section>
    </div>
  )
}
