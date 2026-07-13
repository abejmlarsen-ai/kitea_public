'use client'

import { useState, useCallback, useEffect } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

// Parchment palette: #F5F0E8 · #E8DCC8 · #D4C4A0 · #C4A882
// Text: #0B2838 · Accent: #4A7C8C · Mid: #8A7A5E

type HintNum = 1 | 2 | 3

interface HuntLocation {
  id: string
  name: string
}
interface HintsData {
  hint_1_text: string | null
  hint_2_text: string | null
  hint_3_text: string | null
}
interface Props {
  huntLocation:  HuntLocation
  userId:        string
  hints:         HintsData | null
  initialSolved: Record<HintNum, boolean>
  hasScanned:    boolean
}
interface CollectibleData { scan_count: number; nft_image_url: string | null }

const BTN_PRIMARY: React.CSSProperties = {
  display: 'block', width: '100%', padding: '0.65rem',
  background: '#4A7C8C', color: '#FFFFFF', border: 'none',
  borderRadius: '6px', fontSize: '0.95rem', fontWeight: 600,
  cursor: 'pointer', transition: 'background 0.2s ease',
}
const INPUT_STYLE: React.CSSProperties = {
  display: 'block', width: '100%', padding: '0.65rem 1rem',
  background: 'rgba(255,255,255,0.85)', border: '1px solid #8A7A5E',
  borderRadius: '6px', color: '#0B2838', fontSize: '0.95rem',
  boxSizing: 'border-box', marginBottom: '0.6rem', outline: 'none',
}

const HINT_NUMBERS: HintNum[] = [1, 2, 3]

export default function HuntLocationClient({
  huntLocation, userId, hints, initialSolved, hasScanned,
}: Props) {
  const router = useRouter()

  // ── per-hint answer state ─────────────────────────────────────────────────
  const [solved,     setSolved]     = useState<Record<HintNum, boolean>>(initialSolved)
  const [inputs,      setInputs]     = useState<Record<HintNum, string>>({ 1: '', 2: '', 3: '' })
  const [wrong,       setWrong]      = useState<Record<HintNum, boolean>>({ 1: false, 2: false, 3: false })
  const [wrongMsg,    setWrongMsg]   = useState<Record<HintNum, boolean>>({ 1: false, 2: false, 3: false })
  const [submittingN, setSubmittingN] = useState<HintNum | null>(null)

  // ── scan popup state (same as the Coded Clue path, for parity) ────────────
  const [isScanned,      setIsScanned]      = useState(hasScanned)
  const [showPopup,      setShowPopup]      = useState(false)
  const [popupVisible,   setPopupVisible]   = useState(false)
  const [collectible,    setCollectible]    = useState<CollectibleData | null>(null)
  const [collectibleErr, setCollectibleErr] = useState(false)

  const dismissPopup = useCallback(() => {
    setPopupVisible(false)
    setTimeout(() => {
      setShowPopup(false)
      const url = new URL(window.location.href)
      url.searchParams.delete('scanned')
      router.replace(url.pathname + (url.search || ''))
    }, 250)
  }, [router])

  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    if (params.get('scanned') === 'true') {
      setIsScanned(true)
      setShowPopup(true)
      const supabase = createClient()
      Promise.all([
        supabase.from('scans').select('user_id').eq('hunt_location_id', huntLocation.id),
        supabase.from('hunt_locations').select('nft_image_url').eq('id', huntLocation.id).maybeSingle(),
      ]).then(([scansRes, locationRes]) => {
        if (scansRes.error || locationRes.error) {
          setCollectibleErr(true)
        } else {
          const unique = new Set((scansRes.data ?? []).map((r: { user_id: string }) => r.user_id)).size
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          setCollectible({ scan_count: unique, nft_image_url: (locationRes.data as any)?.nft_image_url ?? null })
        }
        requestAnimationFrame(() => requestAnimationFrame(() => setPopupVisible(true)))
      }).catch(() => {
        setCollectibleErr(true)
        requestAnimationFrame(() => requestAnimationFrame(() => setPopupVisible(true)))
      })
    }
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  async function submitHint(n: HintNum) {
    const val = inputs[n].trim()
    if (!val || submittingN !== null || solved[n]) return
    setSubmittingN(n)
    setWrongMsg(prev => ({ ...prev, [n]: false }))
    try {
      const res  = await fetch('/api/hunt/answer', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'location_hint', user_id: userId, hunt_location_id: huntLocation.id,
          hint_number: n, answer: val,
        }),
      })
      const data = await res.json() as { correct: boolean }

      if (data.correct) {
        const next = { ...solved, [n]: true }
        setSolved(next)
        if (next[1] && next[2] && next[3]) {
          // All three location_hint_*_solved are now true server-side — the
          // completion trigger has already flipped location_revealed if
          // applicable. The reveal page decides what to show purely from
          // the hunt_reveals RLS policy, not anything checked here.
          router.push(`/hunts/${huntLocation.id}/reveal`)
          return
        }
      } else {
        setWrong(prev => ({ ...prev, [n]: true }))
        setWrongMsg(prev => ({ ...prev, [n]: true }))
        setTimeout(() => setWrong(prev => ({ ...prev, [n]: false })), 600)
      }
    } finally {
      setSubmittingN(null)
    }
  }

  const hintText = (n: HintNum): string | null =>
    n === 1 ? hints?.hint_1_text ?? null
    : n === 2 ? hints?.hint_2_text ?? null
    : hints?.hint_3_text ?? null

  return (
    <div style={{ color: '#0B2838', minHeight: '100vh' }}>

      {/* ── SCAN POPUP MODAL ──────────────────────────────────────────────── */}
      {showPopup && (
        <>
          <div onClick={dismissPopup} style={{
            position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', zIndex: 200,
            opacity: popupVisible ? 1 : 0, transition: 'opacity 0.25s ease',
          }} />
          <div role="dialog" aria-modal="true" style={{
            position: 'fixed', top: '50%', left: '50%', zIndex: 201,
            transform: popupVisible ? 'translate(-50%,-50%) scale(1)' : 'translate(-50%,-50%) scale(0.92)',
            background: '#FFFFFF', borderRadius: '1rem',
            boxShadow: '0 8px 48px rgba(0,0,0,0.28)',
            width: 'min(480px, 92vw)', maxHeight: '90vh', overflowY: 'auto',
            padding: '2rem 1.75rem 1.75rem',
            opacity: popupVisible ? 1 : 0, transition: 'opacity 0.25s ease, transform 0.25s ease',
            textAlign: 'center',
          }}>
            <button onClick={dismissPopup} aria-label="Close" style={{
              position: 'absolute', top: '0.9rem', right: '0.9rem',
              background: 'transparent', border: 'none', cursor: 'pointer',
              color: '#8A7A5E', fontSize: '1.4rem', lineHeight: 1, padding: '0.25rem',
            }}>✕</button>
            <h2 style={{ fontSize: 'clamp(1.5rem,6vw,2rem)', fontWeight: 700, color: '#0B2838', margin: '0 0 0.5rem' }}>
              Tag Found!
            </h2>
            {!collectibleErr && collectible && (
              <p style={{ fontSize: '1rem', color: '#4A7C8C', margin: '0 0 1.5rem', fontWeight: 500 }}>
                You are number <strong style={{ color: '#0B2838' }}>{collectible.scan_count}</strong> to find this tag
              </p>
            )}
            {collectibleErr && (
              <p style={{ fontSize: '1rem', color: '#4A7C8C', margin: '0 0 1.5rem' }}>
                Your collectible has been added to your collection
              </p>
            )}
            {!collectibleErr && !collectible && (
              <p style={{ fontSize: '1rem', color: '#8A7A5E', margin: '0 0 1.5rem' }}>Loading your collectible…</p>
            )}
            {collectible?.nft_image_url && (
              <div style={{
                position: 'relative', margin: '0 auto 1.5rem', borderRadius: '0.75rem',
                overflow: 'hidden', background: '#F5F0E8', maxWidth: '320px', height: '280px',
              }}>
                <img src={collectible.nft_image_url} alt="Collectible" style={{
                  position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'contain',
                }} />
              </div>
            )}
            <Link href="/library" style={{
              display: 'inline-block', background: '#0B2838', color: '#FFFFFF',
              padding: '0.75rem 2rem', borderRadius: '0.5rem', fontWeight: 700,
              fontSize: '1rem', textDecoration: 'none',
            }}>
              View Collection →
            </Link>
          </div>
        </>
      )}

      {/* ── BACK TO SELECTION ────────────────────────────────────────────── */}
      <div style={{ background: '#F5F0E8', padding: '1rem 1.5rem 0', textAlign: 'center' }}>
        <a
          href={`/hunts/${huntLocation.id}?select=1`}
          style={{ fontSize: '0.85rem', color: '#4A7C8C', fontWeight: 600, textDecoration: 'underline' }}
        >
          ← Back to selection
        </a>
      </div>

      {/* ── HERO ─────────────────────────────────────────────────────────── */}
      <section style={{ background: '#F5F0E8', padding: '2.5rem 1.5rem 1.25rem', textAlign: 'center' }}>
        <h1 style={{ fontSize: 'clamp(1.75rem,6vw,2.5rem)', fontWeight: 700, margin: '0 0 0.5rem' }}>
          {huntLocation.name}
        </h1>
        <p style={{ fontSize: '1rem', color: '#8A7A5E', margin: 0 }}>
          Answer all three to unlock the reveal.
        </p>
      </section>

      {/* ── THREE QUESTIONS ──────────────────────────────────────────────── */}
      <section style={{ background: '#E8DCC8', padding: '1.5rem 1.5rem 3rem' }}>
        <div style={{ maxWidth: '640px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {HINT_NUMBERS.map(n => {
            const text = hintText(n)
            const isSolved = solved[n]
            return (
              <div key={n} style={{
                background: 'rgba(255,255,255,0.85)', border: '1px solid #8A7A5E',
                borderRadius: '0.75rem', padding: '1.25rem',
              }}>
                <p style={{
                  margin: '0 0 0.4rem', fontSize: '0.78rem', fontWeight: 700, color: '#8A7A5E',
                  textTransform: 'uppercase', letterSpacing: '0.06em',
                }}>
                  Question {n}
                </p>
                <p style={{ margin: '0 0 0.85rem', fontSize: '0.95rem', color: '#0B2838', lineHeight: 1.5 }}>
                  {text ?? 'This question is coming soon.'}
                </p>

                {isSolved ? (
                  <div style={{
                    background: 'rgba(74,124,140,0.12)', border: '1.5px solid #4A7C8C',
                    borderRadius: '6px', padding: '0.6rem 0.9rem', color: '#4A7C8C',
                    fontWeight: 600, display: 'flex', alignItems: 'center', gap: '0.5rem',
                  }}>
                    <span>✓</span> Answered correctly
                  </div>
                ) : (
                  <>
                    <input
                      type="text"
                      value={inputs[n]}
                      onChange={e => setInputs(prev => ({ ...prev, [n]: e.target.value }))}
                      onKeyDown={e => { if (e.key === 'Enter') { void submitHint(n) } }}
                      className={wrong[n] ? 'shake' : undefined}
                      placeholder="Your answer..."
                      disabled={!text}
                      style={INPUT_STYLE}
                    />
                    <button
                      onClick={() => { void submitHint(n) }}
                      disabled={submittingN !== null || !text}
                      style={{ ...BTN_PRIMARY, opacity: submittingN === n ? 0.7 : 1 }}
                    >
                      {submittingN === n ? 'Checking…' : 'Submit'}
                    </button>
                    {wrongMsg[n] && (
                      <p style={{ marginTop: '0.5rem', color: '#C4A882', fontSize: '0.85rem', fontWeight: 600 }}>
                        Not quite — try again
                      </p>
                    )}
                  </>
                )}
              </div>
            )
          })}
        </div>
      </section>

      {/* ── CELEBRATION BANNER ────────────────────────────────────────────── */}
      {isScanned && (
        <section style={{
          background: '#0B2838', color: '#F5F0E8',
          padding: '2rem 1.5rem', textAlign: 'center',
        }}>
          <p style={{ fontSize: '2rem', margin: '0 0 0.5rem', lineHeight: 1 }}>✦</p>
          <h2 style={{ fontSize: 'clamp(1.4rem,5vw,2rem)', fontWeight: 700, margin: '0 0 0.5rem', color: '#F5F0E8' }}>
            Tag Found!
          </h2>
          <p style={{ fontSize: '1rem', color: 'rgba(245,240,232,0.85)', margin: '0 0 1.25rem' }}>
            Your collectible has been added to your collection.
          </p>
          <Link href="/library" style={{
            display: 'inline-block', background: '#F5F0E8', color: '#0B2838',
            padding: '0.65rem 1.5rem', borderRadius: '6px', fontWeight: 700,
            fontSize: '0.95rem', textDecoration: 'none',
          }}>
            View Collection
          </Link>
        </section>
      )}

    </div>
  )
}
