// ─── Library Page (Protected) ────────────────────────────────────────────────
// Middleware redirects unauthenticated users to /login before this renders.

import type { Metadata } from 'next'
import Image from 'next/image'
import { createClient } from '@/lib/supabase/server'
import LogoutButton from '@/components/auth/LogoutButton'
import WalletButton from '@/components/wallet/WalletButton'
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
  const { data: { user } } = await supabase.auth.getUser()

  // Fetch first name for personalised greeting
  let firstName = 'there'
  if (user) {
    const result = await supabase
      .from('profiles')
      .select('first_name')
      .eq('id', user.id)
      .maybeSingle()

    const profile = result.data as { first_name?: string } | null
    firstName =
      profile?.first_name ??
      (user.user_metadata?.first_name as string | undefined) ??
      'there'
  }

  // Fetch minted NFTs for this user
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
    <>
      <section className="logo-hero logo-hero--home">
        <Image
          src="/images/Kitea Logo Only.png"
          alt="Kitea logo"
          width={300}
          height={300}
          priority
          style={{ objectFit: 'contain', maxHeight: '60vh', width: 'auto' }}
        />
      </section>

      <section className="section_1 section_1--home">
        <div className="container">
          <p id="user-greeting">Welcome back, {firstName}!</p>
          <h2>Library</h2>
          <div className="nft-wallet-area">
            <WalletButton />
          </div>
          <LibraryClient nfts={nfts} />
        </div>
        <LogoutButton />
      </section>
    </>
  )
}
