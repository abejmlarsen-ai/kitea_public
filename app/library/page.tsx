// ─── Library Page (Protected) ────────────────────────────────────────────────
import type { Metadata } from 'next'
import Image from 'next/image'
import { createClient } from '@/lib/supabase/server'
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
  hunt_locations: { name: string } | null
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
      .from('nft_tokens')
      .select(
        'id, token_id, edition_number, hunt_location_id, status, transaction_hash, minted_at, hunt_locations(name)'
      )
      .eq('user_id', user.id)
      .eq('status', 'minted')
      .order('minted_at', { ascending: false })

    if (data) nfts = data as unknown as MintedNFT[]
  }

  return (
    <div className="page-theme page-theme--library">
      <section className="logo-hero logo-hero--library">
        <Image
          src="/images/Kitea Logo Only.png"
          alt="Kitea logo"
          width={400}
          height={400}
          priority
          style={{ objectFit: 'contain', width: 'auto' }}
        />
      </section>

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
          <LibraryClient nfts={nfts} />
        </div>
      </section>
    </div>
  )
}
