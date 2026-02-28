'use client'

import { ConnectButton } from 'thirdweb/react'
import { inAppWallet, createWallet } from 'thirdweb/wallets'
import { createClient } from '@/lib/supabase/client'
import { thirdwebClient } from '@/lib/thirdweb/client'
import type { Wallet } from 'thirdweb/wallets'

const wallets = [
  inAppWallet({ auth: { options: ['email', 'google'] } }),
  createWallet('io.metamask'),
  createWallet('com.coinbase.wallet'),
]

export default function WalletButton() {
  async function handleConnect(wallet: Wallet) {
    const address = wallet.getAccount()?.address
    if (!address) return

    try {
      const supabase = createClient()
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) return

      await fetch('/api/user/wallet', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({ wallet_address: address }),
      })
    } catch (err) {
      console.error('[WalletButton] Failed to save wallet address:', err)
    }
  }

  return (
    <ConnectButton
      client={thirdwebClient}
      wallets={wallets}
      theme="dark"
      onConnect={handleConnect}
    />
  )
}
