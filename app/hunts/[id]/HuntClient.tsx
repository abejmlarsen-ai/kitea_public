'use client'

import { useState, useCallback, useEffect } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import RevealLocationButton from './RevealLocationButton'
import { isPlaceholderArtworkHunt, PLACEHOLDER_CAPTION_STYLE } from '@/lib/hunts/placeholderArtwork'

// Parchment palette: #F5F0E8 · #E8DCC8 · #D4C4A0 · #C4A882
// Text: #0B2838 · Accent: #4A7C8C · Mid: #8A7A5E

interface HuntLocation {
  id: string; name: string; description: string | null; total_scans: number | null; latitude: number | null; longitude: number | null
}
interface ClueData {
  text_content: string | null; answer: string | null; image_url: string | null; hint_text: string | null
}
interface Props {
  huntLocation:    HuntLocation
  userId:          string
  clue:            ClueData | null
  clueImageUrl:    string | null
  hasScanned:      boolean
  hasRevealData:   boolean
  initialRevealed: boolean
}
interface CollectibleData { scan_count: number; art_image_url: string | null }

const BTN_PRIMARY: React.CSSProperties = {
  display: 'block', width: '100%', padding: '0.75rem',
  background: '#4A7C8C', color: '#FFFFFF', border: 'none',
  borderRadius: '6px', fontSize: '1rem', fontWeight: 600,
  cursor: 'pointer', transition: 'background 0.2s ease',
  position: 'relative', zIndex: 2,
}
const INPUT_STYLE: React.CSSProperties = {
  display: 'block', width: '100%', padding: '0.75rem 1rem',
  background: 'rgba(255,255,255,0.85)', border: '1px solid #8A7A5E',
  borderRadius: '6px', color: '#0B2838', fontSize: '1rem',
  boxSizing: 'border-box', marginBottom: '0.75rem', outline: 'none',
  position: 'relative', zIndex: 2,
}
const SECTION: React.CSSProperties = { position: 'relative', zIndex: 2 }

export default function HuntClient({
  huntLocation, userId, clue, clueImageUrl, hasScanned, hasRevealData, initialRevealed,
}: Props) {
  const router = useRouter()
  const isPlaceholder = isPlaceholderArtworkHunt(huntLocation.id)

  // ── clue answer state ─────────────────────────────────────────────────────
  const [clueInput,      setClueInput]      = useState('')
  const [clueWrong,      setClueWrong]      = useState(false)
  const [clueWrongMsg,   setClueWrongMsg]   = useState(false)
  const [clueSubmitting, setClueSubmitting] = useState(false)

  // ── lightbox state ────────────────────────────────────────────────────────
  const [lightboxOpen, setLightboxOpen] = useState(false)

  // ── scan popup state ──────────────────────────────────────────────────────
  const [isScanned,      setIsScanned]      = useState(hasScanned)
  const [showPopup,      setShowPopup]      = useState(false)
  const [popupVisible,   setPopupVisible]   = useState(false)
  const [collectible,    setCollectible]    = useState<CollectibleData | null>(null)
  const [collectibleErr, setCollectibleErr] = useState(false)
  const [collectibleImgFailed, setCollectibleImgFailed] = useState(false)

  const dismissPopup = useCallback(() => {
    setPopupVisible(false)
    setTimeout(() => {
      setShowPopup(false)
      const url = new URL(window.location.href)
      url.searchParams.delete('scanned')
      router.replace(url.pathname + (url.search || ''))
    }, 250)
  }, [router])

  // ── scan URL param effect ─────────────────────────────────────────────────
  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    if (params.get('scanned') === 'true') {
      setIsScanned(true)
      setShowPopup(true)
      const supabase = createClient()
      Promise.all([
        supabase.from('scans').select('user_id').eq('hunt_location_id', huntLocation.id),
        supabase.from('hunt_locations').select('art_image_url').eq('id', huntLocation.id).maybeSingle(),
      ]).then(async ([scansRes, locationRes]) => {
        if (scansRes.error || locationRes.error) {
          setCollectibleErr(true)
        } else {
          const unique = new Set((scansRes.data ?? []).map((r: { user_id: string }) => r.user_id)).size
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          let artImageUrl = (locationRes.data as any)?.art_image_url ?? null
          // art_image_url is a relative path into the private bucket — sign it
          // before use so it actually resolves as an <img> src.
          if (artImageUrl && !artImageUrl.startsWith('http')) {
            const res = await fetch(`/api/collectible/image?path=${encodeURIComponent(artImageUrl)}`)
            const signed = await res.json().catch(() => null)
            artImageUrl = signed?.signedUrl ?? null
          }
          setCollectible({ scan_count: unique, art_image_url: artImageUrl })
        }
        requestAnimationFrame(() => requestAnimationFrame(() => setPopupVisible(true)))
      }).catch(() => {
        setCollectibleErr(true)
        requestAnimationFrame(() => requestAnimationFrame(() => setPopupVisible(true)))
      })
    }
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  // ── Escape key closes lightbox ────────────────────────────────────────────
  useEffect(() => {
    if (!lightboxOpen) return
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') setLightboxOpen(false) }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [lightboxOpen])

  async function submitClueAnswer() {
    if (!clueInput.trim() || clueSubmitting) return
    setClueSubmitting(true)
    setClueWrongMsg(false)
    try {
      const res  = await fetch('/api/hunt/answer', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type: 'initial_clue', user_id: userId, hunt_location_id: huntLocation.id, answer: clueInput }),
      })
      const data = await res.json() as { correct: boolean }
      if (data.correct) {
        // coded_clue_solved is now true server-side; the completion trigger
        // has already flipped location_revealed if applicable. The reveal
        // page decides what to show purely from the hunt_reveals RLS policy.
        router.push(`/hunts/${huntLocation.id}/reveal`)
        return
      }
      setClueWrong(true)
      setClueWrongMsg(true)
      setTimeout(() => setClueWrong(false), 600)
    } finally {
      setClueSubmitting(false)
    }
  }

  return (
    <div style={{ color: '#0B2838', minHeight: '100vh' }}>

      {/* ── LIGHTBOX ──────────────────────────────────────────────────────── */}
      {lightboxOpen && clueImageUrl && (
        <div
          onClick={() => setLightboxOpen(false)}
          style={{
            position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.9)', zIndex: 1000,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}
        >
          <button
            onClick={e => { e.stopPropagation(); setLightboxOpen(false) }}
            aria-label="Close lightbox"
            style={{
              position: 'absolute', top: '1rem', right: '1rem',
              background: 'transparent', border: 'none', cursor: 'pointer',
              color: '#FFFFFF', fontSize: '2rem', lineHeight: 1, padding: '0.5rem',
              zIndex: 1001,
            }}
          >✕</button>
          <img
            src={clueImageUrl}
            alt="Hunt clue — full size"
            onClick={e => e.stopPropagation()}
            style={{ maxWidth: '95vw', maxHeight: '95vh', objectFit: 'contain' }}
          />
        </div>
      )}

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
            {!collectibleErr && collectible && (() => {
              const showFallback = isPlaceholder || collectibleImgFailed
              return (
                <>
                  <div style={{
                    position: 'relative', margin: showFallback ? '0 auto 0.5rem' : '0 auto 1.5rem',
                    borderRadius: '0.75rem', overflow: 'hidden', background: '#F5F0E8',
                    maxWidth: '320px', height: '280px',
                  }}>
                    <img
                      src={showFallback ? '/images/Kitea Logo Only.png' : (collectible.art_image_url ?? '/images/Kitea Logo Only.png')}
                      alt="Collectible"
                      onError={() => setCollectibleImgFailed(true)}
                      style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'contain' }}
                    />
                  </div>
                  {showFallback && (
                    <div style={{
                      ...PLACEHOLDER_CAPTION_STYLE,
                      maxWidth: '320px', margin: '0 auto 1.5rem', textAlign: 'center',
                      fontSize: '0.8rem', fontWeight: 700, padding: '0.4rem', borderRadius: '6px',
                    }}>
                      Placeholder design
                    </div>
                  )}
                </>
              )
            })()}
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
      <div style={{ ...SECTION, background: '#F5F0E8', padding: '1rem 1.5rem 0', textAlign: 'center' }}>
        <a
          href={`/hunts/${huntLocation.id}?select=1`}
          style={{ fontSize: '0.85rem', color: '#4A7C8C', fontWeight: 600, textDecoration: 'underline' }}
        >
          ← Back to selection
        </a>
      </div>

      {/* ── 1. HERO ───────────────────────────────────────────────────────── */}
      <section style={{ ...SECTION, background: '#F5F0E8', padding: '2.5rem 1.5rem 2rem', textAlign: 'center' }}>
        <div style={{ maxWidth: '900px', margin: '0 auto', position: 'relative', zIndex: 2 }}>
          <h1 style={{ fontSize: 'clamp(1.75rem,6vw,2.5rem)', fontWeight: 700, color: '#0B2838', margin: 0 }}>
            {huntLocation.name}
          </h1>
        </div>
      </section>

      {/* ── 2. CLUE IMAGE (full-width, max 600px) ─────────────────────────── */}
      <section style={{ ...SECTION, background: '#F5F0E8', padding: '0 1.5rem 2rem' }}>
        <div style={{ maxWidth: '600px', margin: '0 auto', position: 'relative', zIndex: 2 }}>
          {clueImageUrl ? (
            <>
              <img
                src={clueImageUrl}
                alt="Hunt clue"
                onClick={() => setLightboxOpen(true)}
                style={{
                  display: 'block', width: '100%', maxHeight: '380px',
                  objectFit: 'contain', borderRadius: '8px', cursor: 'pointer',
                  position: 'relative', zIndex: 2,
                }}
              />
              <p style={{
                margin: '0.4rem 0 0', fontSize: '0.75rem', color: '#8A7A5E',
                fontStyle: 'italic', textAlign: 'center', position: 'relative', zIndex: 2,
              }}>
                click to enlarge
              </p>
            </>
          ) : (
            <div style={{
              background: '#E8DCC8', borderRadius: '8px', height: '300px',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              color: '#8A7A5E', fontSize: '0.9rem',
              position: 'relative', zIndex: 2,
            }}>
              Clue image coming soon
            </div>
          )}
        </div>
      </section>

      {/* ── 3. CLUE TEXT ──────────────────────────────────────────────────── */}
      <section style={{ ...SECTION, background: '#E8DCC8', padding: '2rem 1.5rem' }}>
        <div style={{ maxWidth: '900px', margin: '0 auto', position: 'relative', zIndex: 2 }}>
          {clue?.text_content ? (
            <p style={{ margin: 0, fontSize: 'clamp(0.78rem, 1.5vw, 0.9rem)', lineHeight: 1.6, color: '#0B2838', whiteSpace: 'pre-wrap', maxWidth: '100%' }}>
              {clue.text_content}
            </p>
          ) : (
            <p style={{ margin: 0, fontSize: '1rem', color: '#8A7A5E', fontStyle: 'italic' }}>
              The clue for this hunt is coming soon.
            </p>
          )}
        </div>
      </section>

      {/* ── 4. PLAIN HINT (read-only, not a question) ───────────────────────── */}
      {clue?.hint_text && (
        <section style={{ ...SECTION, background: '#F5F0E8', padding: '0 1.5rem 2rem' }}>
          <div style={{ maxWidth: '900px', margin: '0 auto', position: 'relative', zIndex: 2 }}>
            <div style={{ background: '#E8DCC8', borderRadius: '8px', padding: '1rem 1.25rem' }}>
              <p style={{
                margin: 0, fontSize: '0.78rem', fontWeight: 700, color: '#8A7A5E',
                textTransform: 'uppercase', letterSpacing: '0.06em',
              }}>
                Hint
              </p>
              <p style={{ margin: '0.4rem 0 0', fontSize: '0.9rem', lineHeight: 1.6, color: '#0B2838', whiteSpace: 'pre-wrap' }}>
                {clue.hint_text}
              </p>
            </div>
          </div>
        </section>
      )}

      {/* ── 5. ANSWER INPUT ───────────────────────────────────────────────── */}
      <section style={{ ...SECTION, background: '#F5F0E8', padding: '2rem 1.5rem' }}>
        <div style={{ maxWidth: '560px', margin: '0 auto', position: 'relative', zIndex: 2 }}>
          <label style={{ display: 'block', fontWeight: 700, color: '#0B2838', marginBottom: '0.75rem', fontSize: '1rem', position: 'relative', zIndex: 2 }}>
            What is the answer?
          </label>

          <input
            type="text"
            value={clueInput}
            onChange={e => setClueInput(e.target.value)}
            onKeyDown={e => { if (e.key === 'Enter') { void submitClueAnswer() } }}
            className={clueWrong ? 'shake' : undefined}
            placeholder="Your answer..."
            style={INPUT_STYLE}
          />
          <button
            onClick={() => { void submitClueAnswer() }}
            disabled={clueSubmitting}
            style={{ ...BTN_PRIMARY, opacity: clueSubmitting ? 0.7 : 1 }}
          >
            {clueSubmitting ? 'Checking…' : 'Submit'}
          </button>
          {clueWrongMsg && (
            <p style={{ marginTop: '0.5rem', color: '#C4A882', fontSize: '0.9rem', fontWeight: 600, position: 'relative', zIndex: 2 }}>
              Not quite — try again
            </p>
          )}
        </div>
      </section>

      {/* ── CELEBRATION BANNER ────────────────────────────────────────────── */}
      {isScanned && (
        <section style={{
          ...SECTION, background: '#0B2838', color: '#F5F0E8',
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
            fontSize: '0.95rem', textDecoration: 'none', position: 'relative', zIndex: 2,
          }}>
            View Collection
          </Link>
        </section>
      )}

      {/* ── REVEAL LOCATION ──────────────────────────────────────────────── */}
      <RevealLocationButton
        huntLocationId={huntLocation.id}
        userId={userId}
        hasRevealData={hasRevealData}
        initialRevealed={initialRevealed}
      />

    </div>
  )
}
