'use client'

import { useState, useEffect, useCallback } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import dynamic from 'next/dynamic'
import { createClient } from '@/lib/supabase/client'

const HuntAreaMap = dynamic(() => import('./HuntAreaMap'), { ssr: false })

// Parchment palette
// #F5F0E8 → #E8DCC8 → #D4C4A0 → #C4A882
// #0B2838  dark text    #4A7C8C  ocean accent    #8A7A5E  mid-tone

interface HuntLocationData {
  id:          string
  name:        string
  description: string
  total_scans: number
  latitude:    number
  longitude:   number
}

interface ProgressData {
  clue: {
    image_url:      string | null
    text_content:   string | null
    code_type_hint: string | null
  } | null
  questions:             { id: string; question_text: string; order_index: number; hint_after_attempts: number }[]
  progress:              { current_question_index: number; location_revealed: boolean; completed_at: string | null } | null
  attempts:              { question_id: string; attempt_count: number; solved: boolean }[]
  initial_clue_hint:     string | null
  initial_clue_attempts: number
  initial_clue_solved:   boolean
  reveal_directions:     string | null
  reveal_image_url:      string | null
}

interface CollectibleData {
  scan_count:    number
  nft_image_url: string | null
}

interface Props {
  huntLocation: HuntLocationData
  userId:       string
  progressData: ProgressData | null
  hasScanned:   boolean
}

export default function HuntClient({ huntLocation, userId, progressData, hasScanned }: Props) {
  const router = useRouter()

  // ── Clue answer state ──────────────────────────────────────────────────────
  const [clueInput,      setClueInput]      = useState('')
  const [clueWrong,      setClueWrong]      = useState(false)
  const [clueSubmitting, setClueSubmitting] = useState(false)
  const [clueSolved,     setClueSolved]     = useState(progressData?.initial_clue_solved ?? false)
  const [clueHint,       setClueHint]       = useState<string | null>(progressData?.initial_clue_hint ?? null)
  const [showClueHint,   setShowClueHint]   = useState(false)

  // ── Hint questions state ───────────────────────────────────────────────────
  const [hintQIndex,     setHintQIndex]     = useState(progressData?.progress?.current_question_index ?? 0)
  const [hintInput,      setHintInput]      = useState('')
  const [hintWrong,      setHintWrong]      = useState(false)
  const [hintSubmitting, setHintSubmitting] = useState(false)
  const [hintQComplete,  setHintQComplete]  = useState(false)

  // ── Scan popup state ───────────────────────────────────────────────────────
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
    const params  = new URLSearchParams(window.location.search)
    const scanned = params.get('scanned') === 'true'

    if (scanned) {
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
          const uniqueScanners = new Set((scansRes.data ?? []).map((r: { user_id: string }) => r.user_id)).size
          setCollectible({
            scan_count:    uniqueScanners,
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            nft_image_url: (locationRes.data as any)?.nft_image_url ?? null,
          })
        }
        requestAnimationFrame(() => requestAnimationFrame(() => setPopupVisible(true)))
      }).catch(() => {
        setCollectibleErr(true)
        requestAnimationFrame(() => requestAnimationFrame(() => setPopupVisible(true)))
      })
    }

    const qs = progressData?.questions ?? []
    const at = progressData?.attempts  ?? []
    if (qs.length > 0 && qs.every(q => at.some(a => a.question_id === q.id && a.solved))) {
      setHintQComplete(true)
    }
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  // ── Submit clue answer ─────────────────────────────────────────────────────
  async function submitClueAnswer() {
    if (!clueInput.trim() || clueSubmitting) return
    setClueSubmitting(true)
    try {
      const res = await fetch('/api/hunt/answer', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type:             'initial_clue',
          user_id:          userId,
          hunt_location_id: huntLocation.id,
          answer:           clueInput,
        }),
      })
      const data = await res.json() as { correct: boolean; showHint?: boolean; hint?: string | null; attemptCount?: number }
      if (data.correct) {
        setClueSolved(true)
      } else {
        setClueWrong(true)
        setTimeout(() => setClueWrong(false), 600)
        if (data.showHint && data.hint) {
          setClueHint(data.hint)
          setShowClueHint(true)
        }
      }
    } finally {
      setClueSubmitting(false)
    }
  }

  // ── Submit hint question answer ────────────────────────────────────────────
  async function submitHintAnswer() {
    if (!hintInput.trim() || hintSubmitting) return
    const qs       = progressData?.questions ?? []
    const currentQ = qs[hintQIndex]
    if (!currentQ) return
    setHintSubmitting(true)
    try {
      const res = await fetch('/api/hunt/answer', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type:        'question',
          user_id:     userId,
          question_id: currentQ.id,
          answer:      hintInput,
        }),
      })
      if (!res.ok) {
        setHintWrong(true)
        setTimeout(() => setHintWrong(false), 600)
        return
      }
      const data = await res.json() as { correct: boolean }
      if (data.correct) {
        const next = hintQIndex + 1
        if (next >= qs.length) {
          setHintQComplete(true)
        } else {
          setHintQIndex(next)
          setHintInput('')
        }
      } else {
        setHintWrong(true)
        setTimeout(() => setHintWrong(false), 600)
      }
    } finally {
      setHintSubmitting(false)
    }
  }

  const questions = progressData?.questions ?? []
  const clue      = progressData?.clue

  return (
    <div style={{ background: 'transparent', minHeight: '100vh', color: '#0B2838' }}>

      {/* ── SCAN POPUP MODAL ─────────────────────────────────────────────── */}
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
            boxShadow: '0 8px 48px rgba(0,0,0,0.28), 0 2px 12px rgba(0,0,0,0.14)',
            width: 'min(480px, 92vw)', maxHeight: '90vh', overflowY: 'auto',
            padding: '2rem 1.75rem 1.75rem',
            opacity: popupVisible ? 1 : 0, transition: 'opacity 0.25s ease, transform 0.25s ease',
            textAlign: 'center',
          }}>
            <button onClick={dismissPopup} aria-label="Close" style={{
              position: 'absolute', top: '0.9rem', right: '0.9rem',
              background: 'transparent', border: 'none', cursor: 'pointer',
              padding: '0.25rem', color: '#8A7A5E', fontSize: '1.4rem', lineHeight: 1,
            }}>✕</button>
            <h2 style={{ fontSize: 'clamp(1.5rem,6vw,2rem)', fontWeight: 700, color: '#0B2838', margin: '0 0 0.5rem', lineHeight: 1.2 }}>
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
            {!collectibleErr && collectible && !collectible.nft_image_url && (
              <div style={{
                margin: '0 auto 1.5rem', borderRadius: '0.75rem', background: '#F5F0E8',
                maxWidth: '320px', padding: '3rem 1rem', color: '#8A7A5E', fontSize: '0.875rem',
              }}>
                Collectible image coming soon
              </div>
            )}
            <Link href="/library" style={{
              display: 'inline-block', background: '#0B2838', color: '#FFFFFF',
              padding: '0.75rem 2rem', borderRadius: '0.5rem', fontWeight: 700,
              fontSize: '1rem', textDecoration: 'none', letterSpacing: '0.02em',
            }}>
              View Collection →
            </Link>
          </div>
        </>
      )}

      {/* ── STICKY HEADER ────────────────────────────────────────────────── */}
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '0.75rem 1.5rem', background: '#F5F0E8', borderBottom: '1px solid #8A7A5E',
        position: 'sticky', top: 0, zIndex: 100,
      }}>
        <img src="/images/Kitea Logo Only.png" alt="Kitea" style={{ height: '36px', width: 'auto' }} />
        <a href="/map" className="hunt-btn-return">← Return to Map</a>
      </div>

      {/* ── CELEBRATION BANNER ───────────────────────────────────────────── */}
      {isScanned && (
        <div style={{
          background: '#0B2838', color: '#F5F0E8',
          padding: '2rem 1.5rem', textAlign: 'center', borderBottom: '2px solid #8A7A5E',
        }}>
          <p style={{ fontSize: '2rem', margin: '0 0 0.5rem', lineHeight: 1 }}>✦</p>
          <h2 style={{ fontSize: 'clamp(1.4rem,5vw,2rem)', fontWeight: 700, margin: '0 0 0.5rem', color: '#F5F0E8' }}>
            Tag Found!
          </h2>
          <p style={{ fontSize: '1rem', color: 'rgba(245,240,232,0.85)', margin: '0 0 1.25rem' }}>
            Your collectible has been added to your collection
          </p>
          <Link href="/library" style={{
            display: 'inline-block', background: '#F5F0E8', color: '#0B2838',
            padding: '0.65rem 1.5rem', borderRadius: '6px', fontWeight: 700,
            fontSize: '0.95rem', textDecoration: 'none',
          }}>
            View Your Collection →
          </Link>
        </div>
      )}

      <div className="hunt-layout">

        {/* ── LEFT COLUMN ──────────────────────────────────────────────── */}
        <div className="hunt-col-main">

          {/* ── a. HERO SECTION with watermark ─────────────────────────── */}
          <div style={{ position: 'relative', padding: '1.5rem 0 1rem', marginBottom: '1.5rem' }}>
            {/* Watermark — behind all content */}
            <div aria-hidden="true" style={{
              position: 'absolute', inset: 0, zIndex: 0, pointerEvents: 'none',
              display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden',
            }}>
              <img
                src="/images/Kitea Logo Only.png"
                alt=""
                style={{ opacity: 0.12, width: '55%', maxWidth: '280px', objectFit: 'contain' }}
              />
            </div>
            {/* Hero content — above watermark */}
            <div style={{ position: 'relative', zIndex: 1 }}>
              <h1 style={{ fontSize: 'clamp(1.5rem,6vw,2.25rem)', fontWeight: 700, color: '#0B2838', margin: 0 }}>
                {huntLocation.name}
              </h1>
            </div>
          </div>

          {/* ── b. CLUE IMAGE ──────────────────────────────────────────── */}
          {clue?.image_url ? (
            <div style={{ position: 'relative', zIndex: 1, marginBottom: '1rem' }}>
              <img
                src={clue.image_url}
                alt="Hunt clue"
                style={{
                  display: 'block', width: '100%', maxHeight: '400px',
                  objectFit: 'contain', borderRadius: '8px', margin: '0 auto',
                }}
              />
            </div>
          ) : (
            <div style={{
              position: 'relative', zIndex: 1, marginBottom: '1rem',
              background: '#E8DCC8', borderRadius: '8px',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              height: '200px', color: '#8A7A5E', fontSize: '0.9rem',
            }}>
              Clue image coming soon
            </div>
          )}

          {/* ── c. CLUE TEXT ───────────────────────────────────────────── */}
          <div style={{ position: 'relative', zIndex: 1, marginBottom: '1.5rem' }}>
            {clue?.text_content ? (
              <p style={{ fontSize: '1rem', lineHeight: 1.7, color: '#0B2838', margin: 0 }}>
                {clue.text_content}
              </p>
            ) : (
              <p style={{ fontSize: '1rem', color: '#8A7A5E', margin: 0, fontStyle: 'italic' }}>
                The clue for this hunt is coming soon.
              </p>
            )}
            {clue?.code_type_hint && (
              <span style={{
                display: 'inline-block', marginTop: '0.75rem',
                background: '#4A7C8C', color: '#FFFFFF', borderRadius: '99px',
                padding: '0.25rem 0.75rem', fontSize: '0.75rem', fontWeight: 600, letterSpacing: '0.04em',
              }}>
                {clue.code_type_hint}
              </span>
            )}
          </div>

          {/* ── d. CLUE ANSWER INPUT ───────────────────────────────────── */}
          <div style={{ position: 'relative', zIndex: 1, marginBottom: '2rem' }}>
            <p style={{
              fontSize: '0.75rem', fontWeight: 700, color: '#4A7C8C',
              textTransform: 'uppercase', letterSpacing: '0.08em', margin: '0 0 0.75rem',
            }}>
              Answer the Clue
            </p>
            {clueSolved ? (
              <div style={{
                background: 'rgba(74,124,140,0.12)', border: '1.5px solid #4A7C8C',
                borderRadius: '0.75rem', padding: '1rem 1.25rem', color: '#4A7C8C', fontWeight: 600,
              }}>
                ✓ Clue answered — find the tag!
              </div>
            ) : (
              <div style={{
                background: 'rgba(74,124,140,0.08)', border: '1px solid #D4C4A0',
                borderRadius: '0.75rem', padding: '1rem 1.25rem',
              }}>
                <input
                  type="text"
                  value={clueInput}
                  onChange={e => setClueInput(e.target.value)}
                  onKeyDown={e => { if (e.key === 'Enter') { void submitClueAnswer() } }}
                  className={`hunt-input-sm${clueWrong ? ' shake' : ''}`}
                  placeholder="Your answer…"
                  style={{ position: 'relative', zIndex: 1 }}
                />
                <button
                  onClick={submitClueAnswer}
                  disabled={clueSubmitting}
                  className="hunt-btn-submit-sm"
                  style={{ position: 'relative', zIndex: 1 }}
                >
                  {clueSubmitting ? 'Checking…' : 'Submit'}
                </button>
                {showClueHint && clueHint && (
                  <p style={{
                    marginTop: '0.75rem', fontSize: '0.875rem', color: '#4A7C8C',
                    fontStyle: 'italic', position: 'relative', zIndex: 1,
                  }}>
                    Hint: {clueHint}
                  </p>
                )}
              </div>
            )}
          </div>

          {/* ── e. HINTS SECTION ───────────────────────────────────────── */}
          <div style={{ position: 'relative', zIndex: 1, marginBottom: '2rem' }}>
            <p style={{
              fontSize: '0.75rem', fontWeight: 700, color: '#4A7C8C',
              textTransform: 'uppercase', letterSpacing: '0.08em', margin: '0 0 0.75rem',
            }}>
              Navigation Hints
            </p>

            {questions.length > 0 ? (
              <div className="hunt-questions-panel" style={{ marginTop: 0 }}>
                <p style={{ fontSize: '0.75rem', fontWeight: 600, color: '#4A7C8C', margin: '0 0 1rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                  Answer these hints to navigate to the tag
                </p>
                {hintQComplete ? (
                  <div style={{ textAlign: 'center', padding: '1rem', color: '#4A7C8C', fontWeight: 600, position: 'relative', zIndex: 1 }}>
                    ✓ All hints answered — good luck finding it!
                  </div>
                ) : (
                  <div style={{ position: 'relative', zIndex: 1 }}>
                    {/* Progress dots */}
                    <div style={{ display: 'flex', gap: '0.4rem', marginBottom: '1rem', alignItems: 'center' }}>
                      {questions.map((_, i) => (
                        <span key={i} style={{
                          display: 'inline-block',
                          width:  i === hintQIndex ? '14px' : '10px',
                          height: i === hintQIndex ? '14px' : '10px',
                          borderRadius: '50%',
                          background: i <= hintQIndex ? '#4A7C8C' : 'transparent',
                          border:     i > hintQIndex ? '1.5px solid #8A7A5E' : 'none',
                          transition: 'all 0.2s', flexShrink: 0,
                        }} />
                      ))}
                    </div>
                    <p style={{ fontSize: '1rem', fontWeight: 600, color: '#0B2838', marginBottom: '0.75rem', lineHeight: 1.4 }}>
                      {questions[hintQIndex]?.question_text}
                    </p>
                    <input
                      type="text"
                      value={hintInput}
                      onChange={e => setHintInput(e.target.value)}
                      onKeyDown={e => { if (e.key === 'Enter') { void submitHintAnswer() } }}
                      className={`hunt-input-sm${hintWrong ? ' shake' : ''}`}
                      placeholder="Your answer…"
                    />
                    <button
                      onClick={submitHintAnswer}
                      disabled={hintSubmitting}
                      className="hunt-btn-submit-sm"
                    >
                      {hintSubmitting ? 'Checking…' : 'Submit'}
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <p style={{ fontSize: '0.9rem', color: '#8A7A5E', fontStyle: 'italic', margin: 0 }}>
                Navigation hints coming soon.
              </p>
            )}
          </div>

          {/* ── f. WHERE TO SCAN / REVEAL SECTION — bottom ─────────────── */}
          <div style={{ position: 'relative', zIndex: 1 }}>
            <p style={{
              fontSize: '0.75rem', fontWeight: 700, color: '#4A7C8C',
              textTransform: 'uppercase', letterSpacing: '0.08em', margin: '0 0 0.75rem',
            }}>
              Where to Scan
            </p>
            <div style={{
              background: 'rgba(74,124,140,0.10)', border: '1px solid #4A7C8C',
              borderRadius: '0.75rem', padding: '1rem 1.25rem', marginBottom: '1rem',
              position: 'relative', zIndex: 1,
            }}>
              {progressData?.reveal_directions ? (
                <p style={{ fontSize: '1rem', fontWeight: 500, color: '#0B2838', margin: 0, lineHeight: 1.55 }}>
                  {progressData.reveal_directions}
                </p>
              ) : (
                <>
                  <p style={{ fontSize: '1rem', fontWeight: 500, color: '#0B2838', margin: '0 0 0.25rem', lineHeight: 1.55 }}>
                    Tap your phone to the Kitea tag when you find it
                  </p>
                  <p style={{ fontSize: '0.8rem', color: '#8A7A5E', margin: 0 }}>
                    Make sure NFC is enabled on your phone
                  </p>
                </>
              )}
            </div>

            {/* Reveal image from Supabase private storage */}
            {progressData?.reveal_image_url ? (
              <div style={{ position: 'relative', zIndex: 1, marginBottom: '1rem' }}>
                <img
                  src={progressData.reveal_image_url}
                  alt="Reveal"
                  style={{
                    display: 'block', width: '100%', maxHeight: '400px',
                    objectFit: 'contain', borderRadius: '8px', margin: '0 auto',
                  }}
                />
              </div>
            ) : (
              <div style={{
                position: 'relative', zIndex: 1, marginBottom: '1rem',
                background: '#E8DCC8', borderRadius: '8px',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                height: '160px', color: '#8A7A5E', fontSize: '0.875rem',
              }}>
                Reveal image coming soon
              </div>
            )}
          </div>

        </div>

        {/* ── RIGHT COLUMN — area map ──────────────────────────────────── */}
        <div className="hunt-col-map">
          <div style={{ borderRadius: '0.75rem', overflow: 'hidden', boxShadow: '0 2px 12px rgba(0,0,0,0.12)', marginBottom: '0.5rem' }}>
            <HuntAreaMap lat={huntLocation.latitude} lng={huntLocation.longitude} />
          </div>
          <p style={{ fontSize: '0.75rem', color: '#8A7A5E', textAlign: 'center', margin: 0 }}>
            Hunt area
          </p>
        </div>

      </div>
    </div>
  )
}
