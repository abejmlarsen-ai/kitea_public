'use client'

import { Suspense, useEffect, useState } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

// ─── Inner component ─────────────────────────────────────────────────────
// useSearchParams() must live inside a component wrapped by <Suspense>.
// Next.js requires this for static build compatibility.

function ScanContent() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const [status, setStatus] = useState<'loading' | 'already_scanned' | 'error'>('loading')
  const [message, setMessage] = useState('')
  const [scanNumber, setScanNumber] = useState<number | null>(null)

  // ── Process the scan on mount ────────────────────────────────────────────
  useEffect(() => {
    async function processScan() {
      const tag_uid = searchParams.get('tag')

      if (!tag_uid) {
        setStatus('error')
        setMessage('No tag ID found. Please scan the tag again.')
        return
      }

      // Check the user is logged in
      const supabase = createClient()
      const { data: { session } } = await supabase.auth.getSession()

      if (!session) {
        // Not logged in — send them to login then back here after
        router.push(`/login?redirect=/scan?tag=${encodeURIComponent(tag_uid)}`)
        return
      }

      // Send the scan to the API for verification and recording
      try {
        const response = await fetch('/api/nfc/scan', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${session.access_token}`
          },
          body: JSON.stringify({ tag_uid })
        })

        const result = await response.json()

        if (result.success) {
          // Fire-and-forget mint — do not await, redirect immediately
          fetch('/api/nft/mint', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              user_id:          session.user.id,
              hunt_location_id: result.hunt_location_id || null,
              scan_number:      result.scan_number,
            }),
          }).catch(() => { /* non-blocking — ignore errors */ })

          // Redirect immediately to hunt page
          if (result.hunt_location_id) {
            router.push(`/hunts/${result.hunt_location_id}?scanned=true`)
          } else {
            router.push(`/library?scan=success&location=${encodeURIComponent(result.location?.name || '')}&edition=${result.scan_number}`)
          }
          return
        } else if (result.already_scanned) {
          setStatus('already_scanned')
          setMessage(result.message)
          setScanNumber(result.scan_number)
        } else {
          setStatus('error')
          setMessage(result.error || 'Something went wrong.')
        }
      } catch {
        setStatus('error')
        setMessage('Connection error. Please try again.')
      }
    }

    processScan()
  }, [searchParams, router])

  return (
    <div className="scan-page">
      <div className="scan-container">

        {status === 'loading' && (
          <div className="scan-loading">
            <div className="scan-spinner" />
            <p>Verifying your scan…</p>
          </div>
        )}

        {status === 'already_scanned' && (
          <div className="scan-already">
            <div className="scan-icon">◈</div>
            <h2>Already Scanned</h2>
            <p>{message}</p>
            <p className="scan-number">You were #{scanNumber}</p>
            <button
              className="scan-btn"
              onClick={() => router.push('/map')}
            >
              Find More Locations
            </button>
          </div>
        )}

        {status === 'error' && (
          <div className="scan-error">
            <div className="scan-icon">✕</div>
            <h2>Scan Failed</h2>
            <p>{message}</p>
            <button
              className="scan-btn"
              onClick={() => router.push('/map')}
            >
              Back to Map
            </button>
          </div>
        )}

      </div>
    </div>
  )
}

// ─── Page export ─────────────────────────────────────────────────────
// Wraps ScanContent in Suspense so Next.js can statically build this route
// while still reading dynamic search params at runtime.

export default function ScanPage() {
  return (
    <Suspense
      fallback={
        <div className="scan-page">
          <div className="scan-container">
            <div className="scan-loading">
              <div className="scan-spinner" />
              <p>Loading…</p>
            </div>
          </div>
        </div>
      }
    >
      <ScanContent />
    </Suspense>
  )
}
