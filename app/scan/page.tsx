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
  const [status, setStatus] = useState<'loading' | 'success' | 'already_scanned' | 'error'>('loading')
  const [message, setMessage] = useState('')
  const [scanNumber, setScanNumber] = useState<number | null>(null)
  const [locationName, setLocationName] = useState('')

  // ── Process the scan on mount ────────────────────────────────────────────
  useEffect(() => {
    async function processScan() {
      // Get the tag ID from the URL
      // When someone scans a tag it opens kitea-ao.com/scan?tag=TAG-ID-HERE
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
        router.push(`/login?redirect=/scan?tag=${tag_uid}`)
        return
      }

      // Send the scan to your API for verification and recording
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
          setStatus('success')
          setMessage(result.message)
          setScanNumber(result.scan_number)
          setLocationName(result.location?.name || '')
        } else if (result.already_scanned) {
          setStatus('already_scanned')
          setMessage(result.message)
          setScanNumber(result.scan_number)
          setLocationName(result.location?.name || '')
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

  // ── Auto-redirect to library after 2 s on success ───────────────────────
  useEffect(() => {
    if (status !== 'success' || !locationName || scanNumber === null) return
    const timer = setTimeout(() => {
      router.push(
        `/library?scan=success&location=${encodeURIComponent(locationName)}&edition=${scanNumber}`
      )
    }, 2000)
    return () => clearTimeout(timer)
  }, [status, locationName, scanNumber, router])

  return (
    <div className="scan-page">
      <div className="scan-container">

        {status === 'loading' && (
          <div className="scan-loading">
            <div className="scan-spinner" />
            <p>Verifying your scan…</p>
          </div>
        )}

        {status === 'success' && (
          <div className="scan-success">
            <div className="scan-icon">✦</div>
            <h2>Scan Confirmed!</h2>
            <p className="scan-number">#{scanNumber}</p>
            <p>{message}</p>
            <p className="scan-location">{locationName}</p>
            <button
              className="scan-btn"
              onClick={() =>
                router.push(
                  `/library?scan=success&location=${encodeURIComponent(locationName)}&edition=${scanNumber}`
                )
              }
            >
              View Your Library
            </button>
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
