'use client'
// ─── WalletAutoConnect ────────────────────────────────────────────────────────
// Lightweight client component that triggers server-side wallet pre-generation.
// On mount it POSTs to /api/user/wallet/generate, which deterministically
// derives an Ethereum address from the user's email + a server-side secret.
// No Thirdweb paid plan or client-side wallet SDK required.
//
// Only rendered when wallet_address is null in the user's profile — once the
// address is saved the parent page will no longer render this component.

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'

interface WalletAutoConnectProps {
  /** The logged-in user's email — sent to the generate endpoint */
  userEmail: string
  /** Supabase user UUID — kept for parity with parent; not used client-side */
  userId: string
}

export default function WalletAutoConnect({ userEmail, userId }: WalletAutoConnectProps) {
  const [showToast, setShowToast] = useState(false)

  useEffect(() => {
    let cancelled = false

    const generate = async () => {
      try {
        const supabase = createClient()
        const {
          data: { session },
        } = await supabase.auth.getSession()

        if (!session?.access_token || cancelled) return

        const res = await fetch('/api/user/wallet/generate', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${session.access_token}`,
          },
          body: JSON.stringify({ email: userEmail }),
        })

        if (!res.ok || cancelled) {
          const body = await res.json().catch(() => ({}))
          console.error('[WalletAutoConnect] generate failed:', res.status, body)
          return
        }

        setShowToast(true)
        setTimeout(() => setShowToast(false), 4100)
      } catch (err) {
        console.error('[WalletAutoConnect] failed for', userEmail, ':', err)
      }
    }

    generate()
    return () => {
      cancelled = true
    }
  }, [userEmail, userId])

  if (!showToast) return null

  return (
    <div className="wallet-toast" role="status" aria-live="polite">
      ✦ Your Kitea wallet has been created
    </div>
  )
}
