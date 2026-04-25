'use client'

import { useState, useCallback, useEffect } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import dynamic from 'next/dynamic'
import { createClient } from '@/lib/supabase/client'

const HuntAreaMap = dynamic(() => import('./HuntAreaMap'), { ssr: false })

// Parchment palette: #F5F0E8 · #E8DCC8 · #D4C4A0 · #C4A882
// Text: #0B2838 · Accent: #4A7C8C · Mid: #8A7A5E

interface HuntLocation {
  id: string; name: string; description: string; total_scans: number; latitude: number; longitude: number
}
interface ClueData {
  text_content: string | null; answer: string | null; image_url: string | null
}
interface HintsData {
  hint_1_text: string | null; hint_1_answer: string | null
  hint_2_text: string | null; hint_2_answer: string | null
  hint_3_text: string | null; hint_3_answer: string | null
}
interface RevealsData {
  reveal_directions: string | null; reveal_image_url: string | null
}
interface Props {
  huntLocation:   HuntLocation
  userId:         string
  clue:           ClueData | null
  hints:          HintsData | null
  reveals:        RevealsData | null
  clueImageUrl:   string | null
  revealImageUrl: string | null
  hasScanned:     boolean
}
interface CollectibleData { scan_count: number; nft_image_url: string | null }

const BTN_PRIMARY: React.CSSProperties = {
  display: 'block', width: '100%', padding: '0.75rem',
  background: '#4A7C8C', color: '#FFFFFF', border: 'none',
  borderRadius: '6px', fontSize: '1rem', fontWeight: 600,
  cursor: 'pointer', transition: 'background 0.2s ease',
}
const INPUT_STYLE: React.CSSProperties = {
  display: 'block', width: '100%', padding: '0.75rem 1rem',
  background: 'rgba(255,255,255,0.85)', border: '1px solid #8A7A5E',
  borderRadius: '6px', color: '#0B2838', fontSize: '1rem',
  boxSizing: 'border-box', marginBottom: '0.75rem', outline: 'none',
}
const SECTION: React.CSSProperties = { position: 'relative', zIndex: 2 }

export default function HuntClient({
  huntLocation, userId, clue, hints, reveals,
  clueImageUrl, revealImageUrl, hasScanned,
}: Props) {
  const router = useRouter()

  // ── clue answer state ─────────────────────────────────────────────────────
  const [clueInput,            setClueInput]            = useState('')
  const [clueWrong,            setClueWrong]            = useState(false)
  const [clueWrongMsg,         setClueWrongMsg]         = useState(false)
  const [clueSubmitting,       setClueSubmitting]       = useState(false)
  const [clueAnsweredCorrectly, setClueAnsweredCorrectly] = useState(false)

  // ── hint panel state ──────────────────────────────────────────────────────
  const [showHintPanel,  setShowHintPanel]  = useState(false)
  const [activeHintIdx,  setActiveHintIdx]  = useState(0)
  const [hint1Correct,   setHint1Correct]   = useState(false)
  const [hint2Correct,   setHint2Correct]   = useState(false)
  const [hint3Correct,   setHint3Correct]   = useState(false)
  const [hintInput,      setHintInput]      = useState('')
  const [hintWrong,      setHintWrong]      = useState(false)
  const [hintWrongMsg,   setHintWrongMsg]   = useState(false)
  const [hintSubmitting, setHintSubmitting] = useState(false)

  // ── scan popup state ──────────────────────────────────────────────────────
  const [isScanned,      setIsScanned]      = useState(hasScanned)
  const [showPopup,      setShowPopup]      = useState(false)
  const [popupVisible,   setPopupVisible]   = useState(false)
  const [collectible,    setCollectible]    = useState<CollectibleData | null>(null)
  const [collectibleErr, setCollectibleErr] = useState(false)

  // ── derived ───────────────────────────────────────────────────────────────
  const h1 = hints?.hint_1_text ?? null
  const h2 = hints?.hint_2_text ?? null
  const h3 = hints?.hint_3_text ?? null
  const availableHints: number[] = [...(h1 ? [1] : []), ...(h2 ? [2] : []), ...(h3 ? [3] : [])]
  const hintCorrectMap: Record<number, boolean> = { 1: hint1Correct, 2: hint2Correct, 3: hint3Correct }
  const hintTextMap:    Record<number, string>  = { 1: h1 ?? '', 2: h2 ?? '', 3: h3 ?? '' }
  const allHintsAnswered = availableHints.length > 0 && availableHints.every(n => hintCorrectMap[n])
  const revealUnlocked   = clueAnsweredCorrectly || allHintsAnswered
  const showReveal       = revealUnlocked || isScanned
  const activeHintNum    = availableHints[activeHintIdx] ?? availableHints[0] ?? 1

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
        setClueAnsweredCorrectly(true)
      } else {
        setClueWrong(true)
        setClueWrongMsg(true)
        setTimeout(() => setClueWrong(false), 600)
      }
    } finally {
      setClueSubmitting(false)
    }
  }

  async function submitHintAnswer() {
    if (!hintInput.trim() || hintSubmitting) return
    setHintSubmitting(true)
    setHintWrongMsg(false)
    try {
      const res  = await fetch('/api/hunt/answer', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'question', user_id: userId,
          question_id: `${huntLocation.id}__hint__${activeHintNum}`,
          answer: hintInput,
        }),
      })
      const data = await res.json() as { correct: boolean }
      if (data.correct) {
        if (activeHintNum === 1) setHint1Correct(true)
        else if (activeHintNum === 2) setHint2Correct(true)
        else if (activeHintNum === 3) setHint3Correct(true)
        setHintInput('')
      } else {
        setHintWrong(true)
        setHintWrongMsg(true)
        setTimeout(() => setHintWrong(false), 600)
      }
    } finally {
      setHintSubmitting(false)
    }
  }

  function switchHint(idx: number) {
    setActiveHintIdx(idx)
    setHintInput('')
    setHintWrong(false)
    setHintWrongMsg(false)
  }

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

      {/* ── STICKY HEADER ─────────────────────────────────────────────────── */}
      <div style={{
        position: 'sticky', top: 0, zIndex: 100,
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '0.75rem 1.5rem', background: '#F5F0E8', borderBottom: '1px solid #8A7A5E',
      }}>
        <img src="/images/Kitea Logo Only.png" alt="Kitea" style={{ height: '36px', width: 'auto' }} />
        <a href="/map" className="hunt-btn-return">← Return to Map</a>
      </div>

      {/* ── 1. HERO ───────────────────────────────────────────────────────── */}
      <section style={{ ...SECTION, background: '#F5F0E8', padding: '2.5rem 1.5rem 2rem', textAlign: 'center' }}>
        <div style={{ maxWidth: '900px', margin: '0 auto' }}>
          <h1 style={{ fontSize: 'clamp(1.75rem,6vw,2.5rem)', fontWeight: 700, color: '#0B2838', margin: 0 }}>
            {huntLocation.name}
          </h1>
        </div>
      </section>

      {/* ── 2. TWO-COLUMN: CLUE IMAGE + MAP ──────────────────────────────── */}
      <section style={{ ...SECTION, background: '#F5F0E8', padding: '0 1.5rem 2rem' }}>
        <div style={{ maxWidth: '900px', margin: '0 auto', display: 'flex', gap: '1.5rem', flexWrap: 'wrap', alignItems: 'stretch' }}>
          {/* Left — clue image */}
          <div style={{ flex: '1 1 300px', minWidth: 0 }}>
            {clueImageUrl ? (
              <img
                src={clueImageUrl}
                alt="Hunt clue"
                style={{ display: 'block', width: '100%', maxHeight: '380px', objectFit: 'contain', borderRadius: '8px' }}
              />
            ) : (
              <div style={{
                background: '#E8DCC8', borderRadius: '8px', height: '300px',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                color: '#8A7A5E', fontSize: '0.9rem',
              }}>
                Clue image coming soon
              </div>
            )}
          </div>
          {/* Right — area map */}
          <div style={{ flex: '1 1 300px', minWidth: 0, borderRadius: '8px', overflow: 'hidden', boxShadow: '0 2px 12px rgba(0,0,0,0.12)' }}>
            <HuntAreaMap lat={huntLocation.latitude} lng={huntLocation.longitude} height={300} />
          </div>
        </div>
      </section>

      {/* ── 3. CLUE TEXT ──────────────────────────────────────────────────── */}
      <section style={{ ...SECTION, background: '#E8DCC8', padding: '2rem 1.5rem' }}>
        <div style={{ maxWidth: '900px', margin: '0 auto' }}>
          {clue?.text_content ? (
            <p style={{ margin: 0, fontSize: '1rem', lineHeight: 1.8, color: '#0B2838', whiteSpace: 'pre-wrap' }}>
              {clue.text_content}
            </p>
          ) : (
            <p style={{ margin: 0, fontSize: '1rem', color: '#8A7A5E', fontStyle: 'italic' }}>
              The clue for this hunt is coming soon.
            </p>
          )}
        </div>
      </section>

      {/* ── 4. ANSWER INPUT ───────────────────────────────────────────────── */}
      <section style={{ ...SECTION, background: '#F5F0E8', padding: '2rem 1.5rem' }}>
        <div style={{ maxWidth: '560px', margin: '0 auto' }}>
          <label style={{ display: 'block', fontWeight: 700, color: '#0B2838', marginBottom: '0.75rem', fontSize: '1rem' }}>
            What is the answer?
          </label>

          {clueAnsweredCorrectly ? (
            <div style={{
              background: 'rgba(74,124,140,0.12)', border: '1.5px solid #4A7C8C',
              borderRadius: '8px', padding: '1rem 1.25rem', color: '#4A7C8C',
              fontWeight: 600, fontSize: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem',
            }}>
              <span style={{ fontSize: '1.25rem' }}>✓</span>
              Correct! The reveal is now unlocked below.
            </div>
          ) : (
            <>
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
                <p style={{ marginTop: '0.5rem', color: '#C4A882', fontSize: '0.9rem', fontWeight: 600 }}>
                  Not quite — try again
                </p>
              )}
            </>
          )}

          {/* "Do you want a hint?" link — only if hints exist */}
          {availableHints.length > 0 && !clueAnsweredCorrectly && (
            <button
              onClick={() => setShowHintPanel(true)}
              style={{
                marginTop: '1rem', background: 'none', border: 'none', padding: 0,
                color: '#4A7C8C', fontSize: '0.9rem', textDecoration: 'underline',
                cursor: 'pointer', fontWeight: 500,
              }}
            >
              Do you want a hint?
            </button>
          )}
        </div>
      </section>

      {/* ── 5. HINT PANEL ─────────────────────────────────────────────────── */}
      {showHintPanel && availableHints.length > 0 && (
        <section style={{ ...SECTION, background: '#F5F0E8', padding: '0 1.5rem 2rem' }}>
          <div style={{ maxWidth: '560px', margin: '0 auto' }}>
            <div style={{ background: '#E8DCC8', borderRadius: '8px', padding: '1.5rem' }}>
              <p style={{ margin: '0 0 1.25rem', fontWeight: 600, color: '#0B2838', lineHeight: 1.5 }}>
                Answer the three location based questions below for a hint.
              </p>

              {/* Dot navigation */}
              <div style={{ display: 'flex', gap: '0.75rem', marginBottom: '1.25rem', justifyContent: 'center' }}>
                {availableHints.map((hintNum, i) => {
                  const correct = hintCorrectMap[hintNum]
                  const active  = i === activeHintIdx
                  return (
                    <button
                      key={hintNum}
                      onClick={() => switchHint(i)}
                      style={{
                        width: active ? '38px' : '30px',
                        height: active ? '38px' : '30px',
                        borderRadius: '50%',
                        background: correct ? '#4A7C8C' : active ? '#C4A882' : 'transparent',
                        border: `2px solid ${correct ? '#4A7C8C' : active ? '#C4A882' : '#8A7A5E'}`,
                        color: correct || active ? '#FFFFFF' : '#8A7A5E',
                        cursor: 'pointer',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        fontSize: correct ? '1rem' : '0.85rem',
                        fontWeight: 700,
                        transition: 'all 0.2s',
                        flexShrink: 0,
                      }}
                    >
                      {correct ? '✓' : hintNum}
                    </button>
                  )
                })}
              </div>

              {/* Active question */}
              {hintCorrectMap[activeHintNum] ? (
                <div style={{
                  background: 'rgba(74,124,140,0.12)', border: '1.5px solid #4A7C8C',
                  borderRadius: '6px', padding: '0.75rem 1rem', color: '#4A7C8C',
                  fontWeight: 600, display: 'flex', alignItems: 'center', gap: '0.5rem',
                }}>
                  <span>✓</span> Answered correctly
                </div>
              ) : (
                <>
                  <p style={{ margin: '0 0 0.75rem', fontWeight: 600, color: '#0B2838', lineHeight: 1.5 }}>
                    {hintTextMap[activeHintNum]}
                  </p>
                  <input
                    type="text"
                    value={hintInput}
                    onChange={e => setHintInput(e.target.value)}
                    onKeyDown={e => { if (e.key === 'Enter') { void submitHintAnswer() } }}
                    className={hintWrong ? 'shake' : undefined}
                    placeholder="Your answer..."
                    style={{ ...INPUT_STYLE }}
                  />
                  <button
                    onClick={() => { void submitHintAnswer() }}
                    disabled={hintSubmitting}
                    style={{ ...BTN_PRIMARY, opacity: hintSubmitting ? 0.7 : 1 }}
                  >
                    {hintSubmitting ? 'Checking…' : 'Submit'}
                  </button>
                  {hintWrongMsg && (
                    <p style={{ marginTop: '0.5rem', color: '#C4A882', fontSize: '0.9rem', fontWeight: 600 }}>
                      Not quite — try again
                    </p>
                  )}
                </>
              )}
            </div>
          </div>
        </section>
      )}

      {/* ── CELEBRATION BANNER (above Where to Scan) ───────────────────────── */}
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
            fontSize: '0.95rem', textDecoration: 'none',
          }}>
            View Collection
          </Link>
        </section>
      )}

      {/* ── 6. WHERE TO SCAN ──────────────────────────────────────────────── */}
      <section style={{ ...SECTION, background: '#D4C4A0', padding: '2rem 1.5rem 3rem' }}>
        <div style={{ maxWidth: '640px', margin: '0 auto' }}>
          <h2 style={{ fontSize: '1.25rem', fontWeight: 700, color: '#0B2838', margin: '0 0 1rem' }}>
            Where to Scan
          </h2>

          {showReveal ? (
            <>
              {reveals?.reveal_directions ? (
                <p style={{ fontSize: '1rem', lineHeight: 1.7, color: '#0B2838', margin: '0 0 1.5rem', whiteSpace: 'pre-wrap' }}>
                  {reveals.reveal_directions}
                </p>
              ) : (
                <p style={{ fontSize: '1rem', color: '#8A7A5E', margin: '0 0 1.5rem', fontStyle: 'italic' }}>
                  Directions coming soon.
                </p>
              )}
              {revealImageUrl ? (
                <div style={{ position: 'relative', zIndex: 2 }}>
                  <img
                    src={revealImageUrl}
                    alt="Reveal"
                    style={{
                      display: 'block', width: '100%', maxHeight: '400px',
                      objectFit: 'contain', borderRadius: '8px', margin: '0 auto',
                    }}
                  />
                </div>
              ) : (
                <div style={{
                  background: '#E8DCC8', borderRadius: '8px', height: '200px',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  color: '#8A7A5E', fontSize: '0.875rem',
                }}>
                  Reveal image coming soon
                </div>
              )}
            </>
          ) : (
            <p style={{ fontSize: '1rem', color: '#0B2838', margin: 0, lineHeight: 1.7 }}>
              Solve the clue. Find the Kitea tag and scan.
            </p>
          )}
        </div>
      </section>

    </div>
  )
}
