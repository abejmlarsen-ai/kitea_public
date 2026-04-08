'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import dynamic from 'next/dynamic'

const HuntAreaMap = dynamic(() => import('./HuntAreaMap'), { ssr: false })

// ── Parchment palette ─────────────────────────────────────────────────────────
// #F5F0E8 → #E8DCC8 → #D4C4A0 → #C4A882  (page gradient)
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
    image_url:          string | null
    text_content:       string | null
    code_type_hint:     string | null
  } | null
  questions: { id: string; question_text: string; order_index: number; hint_after_attempts: number }[]
  progress:  { current_question_index: number; location_revealed: boolean; completed_at: string | null } | null
  attempts:  { question_id: string; attempt_count: number; solved: boolean }[]
  initial_clue_attempts: number
  initial_clue_hint: string | null
  reveal_directions?: string | null
}

interface Props {
  huntLocation: HuntLocationData
  userId:       string
  progressData: ProgressData | null
  hasScanned:   boolean
}

export default function HuntClient({ huntLocation, userId, progressData, hasScanned }: Props) {

  console.log('[HuntClient] received huntLocation:', huntLocation)
  console.log('[HuntClient] received progressData:', progressData)
  console.log('[HuntClient] hasScanned:', hasScanned)

  // ── State ──────────────────────────────────────────────────────────────────
  const [locationQIndex,     setLocationQIndex]     = useState(progressData?.progress?.current_question_index ?? 0)
  const [locationInput,      setLocationInput]      = useState('')
  const [locationWrong,      setLocationWrong]      = useState(false)
  const [locationSubmitting, setLocationSubmitting] = useState(false)
  const [locationQComplete,  setLocationQComplete]  = useState(false)
  const [clueImgError,       setClueImgError]       = useState(false)
  const [isScanned,          setIsScanned]          = useState(hasScanned)

  // ── On mount — check ?scanned=true param ──────────────────────────────────
  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    if (params.get('scanned') === 'true') {
      setIsScanned(true)
    }

    // Initialise question completion state from saved progress
    const qs = progressData?.questions ?? []
    const at = progressData?.attempts  ?? []
    if (qs.length > 0 && qs.every(q => at.some(a => a.question_id === q.id && a.solved))) {
      setLocationQComplete(true)
    }
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  // ── Submit location question answer ───────────────────────────────────────
  async function submitLocationAnswer() {
    if (!locationInput.trim() || locationSubmitting) return
    const qs       = progressData?.questions ?? []
    const currentQ = qs[locationQIndex]
    if (!currentQ) return
    setLocationSubmitting(true)
    try {
      const res = await fetch('/api/hunt/answer', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type:        'question',
          user_id:     userId,
          question_id: currentQ.id,
          answer:      locationInput,
        }),
      })
      if (!res.ok) {
        setLocationWrong(true)
        setTimeout(() => setLocationWrong(false), 600)
        return
      }
      const data = await res.json() as { correct: boolean }
      if (data.correct) {
        const next = locationQIndex + 1
        if (next >= qs.length) {
          setLocationQComplete(true)
        } else {
          setLocationQIndex(next)
          setLocationInput('')
        }
      } else {
        setLocationWrong(true)
        setTimeout(() => setLocationWrong(false), 600)
      }
    } finally {
      setLocationSubmitting(false)
    }
  }

  const questions = progressData?.questions ?? []
  const clue      = progressData?.clue

  // ── MAIN LAYOUT ───────────────────────────────────────────────────────────
  return (
    <div style={{ background: 'transparent', minHeight: '100vh', color: '#0B2838' }}>

      {/* Sticky hunt header */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '0.75rem 1.5rem',
        background: '#F5F0E8',
        borderBottom: '1px solid #8A7A5E',
        position: 'sticky',
        top: 0,
        zIndex: 100,
      }}>
        <img
          src="/images/Kitea Logo Only.png"
          alt="Kitea"
          style={{ height: '36px', width: 'auto' }}
        />
        <a href="/map" className="hunt-btn-return">
          ← Return to Map
        </a>
      </div>

      {/* ── CELEBRATION BANNER — shown above content when scanned ──────────── */}
      {isScanned && (
        <div style={{
          background: 'linear-gradient(135deg, #4A7C8C 0%, #0B2838 100%)',
          color: '#F5F0E8',
          padding: '2rem 1.5rem',
          textAlign: 'center',
          borderBottom: '2px solid #8A7A5E',
        }}>
          <p style={{ fontSize: '2rem', margin: '0 0 0.5rem', lineHeight: 1 }}>✦</p>
          <h2 style={{ fontSize: 'clamp(1.4rem, 5vw, 2rem)', fontWeight: 700, margin: '0 0 0.5rem', color: '#F5F0E8' }}>
            Tag Found!
          </h2>
          <p style={{ fontSize: '1rem', color: 'rgba(245,240,232,0.85)', margin: '0 0 1.25rem' }}>
            Your collectible has been added to your collection
          </p>
          <Link href="/library" style={{
            display: 'inline-block',
            background: '#F5F0E8',
            color: '#0B2838',
            padding: '0.65rem 1.5rem',
            borderRadius: '6px',
            fontWeight: 700,
            fontSize: '0.95rem',
            textDecoration: 'none',
          }}>
            View Your Collection →
          </Link>
        </div>
      )}

      <div className='hunt-layout'>

        {/* ── LEFT COLUMN ──────────────────────────────────────────────────── */}
        <div className='hunt-col-main'>

          {/* Hunt name */}
          <h1 style={{ fontSize: 'clamp(1.5rem,6vw,2.25rem)', fontWeight: 700, color: '#0B2838', margin: '0 0 1.25rem' }}>
            {huntLocation.name}
          </h1>

          {/* ── CLUE — always visible ─────────────────────────────────────── */}
          {clue?.image_url && !clueImgError ? (
            <img
              src={clue.image_url}
              alt='Hunt clue'
              onError={() => setClueImgError(true)}
              style={{ width: '100%', maxHeight: '400px', objectFit: 'cover', borderRadius: '0.75rem', marginBottom: '1rem' }}
            />
          ) : (
            <div className='hunt-clue-placeholder'>
              Clue image coming soon
            </div>
          )}

          {clue?.text_content ? (
            <p style={{ fontSize: '1rem', lineHeight: 1.7, color: '#0B2838', marginBottom: '1rem' }}>
              {clue.text_content}
            </p>
          ) : (
            <p className='hunt-placeholder-text'>
              The clue for this hunt is being prepared. Check back soon.
            </p>
          )}

          {clue?.code_type_hint && (
            <span style={{
              display: 'inline-block', background: '#4A7C8C', color: '#FFFFFF',
              borderRadius: '99px', padding: '0.25rem 0.75rem',
              fontSize: '0.75rem', fontWeight: 600, marginBottom: '1.25rem', letterSpacing: '0.04em',
            }}>
              {clue.code_type_hint}
            </span>
          )}

          {/* ── REVEAL DIRECTIONS — always visible ────────────────────────── */}
          <div style={{
            background: 'rgba(74,124,140,0.10)',
            border: '1px solid #4A7C8C',
            borderRadius: '0.75rem',
            padding: '1rem 1.25rem',
            marginBottom: '1.5rem',
          }}>
            <p style={{ fontSize: '0.7rem', fontWeight: 700, color: '#4A7C8C', margin: '0 0 0.5rem', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
              Where to scan
            </p>
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

          {/* ── NAVIGATION CLUES — questions as optional helpers ──────────── */}
          <div>
            <p style={{
              fontSize: '0.75rem', fontWeight: 700, color: '#4A7C8C',
              textTransform: 'uppercase', letterSpacing: '0.08em', margin: '0 0 0.75rem',
            }}>
              Finding the Tag
            </p>

            {questions.length > 0 ? (
              <div className='hunt-questions-panel' style={{ marginTop: 0 }}>
                <p style={{ fontSize: '0.75rem', fontWeight: 600, color: '#4A7C8C', margin: '0 0 1rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                  Answer these questions to help navigate to the tag
                </p>

                {locationQComplete ? (
                  <div style={{ textAlign: 'center', padding: '1rem', color: '#4A7C8C', fontWeight: 600 }}>
                    ✓ All questions answered — good luck finding it!
                  </div>
                ) : (
                  <div>
                    {/* Progress dots */}
                    <div style={{ display: 'flex', gap: '0.4rem', marginBottom: '1rem', alignItems: 'center' }}>
                      {questions.map((_, i) => (
                        <span
                          key={i}
                          style={{
                            display: 'inline-block',
                            width:  i === locationQIndex ? '14px' : '10px',
                            height: i === locationQIndex ? '14px' : '10px',
                            borderRadius: '50%',
                            background: i <= locationQIndex ? '#4A7C8C' : 'transparent',
                            border: i > locationQIndex ? '1.5px solid #8A7A5E' : 'none',
                            transition: 'all 0.2s', flexShrink: 0,
                          }}
                        />
                      ))}
                    </div>

                    <p style={{ fontSize: '1rem', fontWeight: 600, color: '#0B2838', marginBottom: '0.75rem', lineHeight: 1.4 }}>
                      {questions[locationQIndex]?.question_text}
                    </p>

                    <input
                      type='text'
                      value={locationInput}
                      onChange={e => setLocationInput(e.target.value)}
                      onKeyDown={e => { if (e.key === 'Enter') { void submitLocationAnswer() } }}
                      className={`hunt-input-sm${locationWrong ? ' shake' : ''}`}
                      placeholder='Your answer…'
                    />

                    <button
                      onClick={submitLocationAnswer}
                      disabled={locationSubmitting}
                      className='hunt-btn-submit-sm'
                    >
                      {locationSubmitting ? 'Checking…' : 'Submit'}
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <p className='hunt-placeholder-text'>
                Navigation clues for this hunt are being finalised.
              </p>
            )}
          </div>

        </div>

        {/* ── RIGHT COLUMN — area map ───────────────────────────────────────── */}
        <div className='hunt-col-map'>
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
