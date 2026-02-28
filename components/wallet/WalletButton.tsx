'use client'
// ─── WalletButton ─────────────────────────────────────────────────────────────
// Shows a subtle dark pill with the connected wallet address.
// Renders nothing if no wallet is active (WalletAutoConnect handles creation).

import { useState } from 'react'
import { useActiveAccount } from 'thirdweb/react'

export default function WalletButton() {
  const account = useActiveAccount()
  const [copied, setCopied] = useState(false)

  if (!account?.address) return null

  const address = account.address
  const truncated = `${address.slice(0, 6)}...${address.slice(-4)}`

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(address)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {
      // clipboard API not available
    }
  }

  return (
    <div className="wallet-display">
      <span className="wallet-display__icon">✦</span>
      <span className="wallet-display__address">{truncated}</span>
      <button
        className="wallet-display__copy"
        onClick={handleCopy}
        title={copied ? 'Copied!' : 'Copy wallet address'}
        aria-label={copied ? 'Address copied' : 'Copy wallet address'}
      >
        {copied ? '✓' : '⧉'}
      </button>
    </div>
  )
}
