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
}

export default function HuntClient({ huntLocation, userId, progressData }: Props) {

  console.log('[HuntClient] received huntLocation:', huntLocation)
  console.log('[HuntClient] received progressData:', progressData)

  // ── State ──────────────────────────────────────────────────────────────────
  const [mainAnswer,            setMainAnswer]            = useState('')
  const [mainAttempts,          setMainAttempts]          = useState(progressData?.initial_clue_attempts ?? 0)
  const [mainWrong,             setMainWrong]             = useState(false)
  const [mainSubmitting,        setMainSubmitting]        = useState(false)
  const [showHint,              setShowHint]              = useState(false)
  const [hintText,              setHintText]              = useState<string | null>(null)
  const [showLocationQuestions, setShowLocationQuestions] = useState(false)
  const [locationQIndex,        setLocationQIndex]        = useState(progressData?.progress?.current_question_index ?? 0)
  const [locationInput,         setLocationInput]         = useState('')
  const [locationWrong,         setLocationWrong]         = useState(false)
  const [locationSubmitting,    setLocationSubmitting]    = useState(false)
  const [locationQComplete,     setLocationQComplete]     = useState(false)
  const [revealed,              setRevealed]              = useState(progressData?.progress?.location_revealed ?? false)
  const [editionNumber,         setEditionNumber]         = useState('')
  const [isPostScan,            setIsPostScan]            = useState(false)
  const [clueImgError,          setClueImgError]          = useState(false)

  // ── On mount ───────────────────────────────────────────────────────────────
  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    if (params.get('scanned') === 'true') {
      setIsPostScan(true)
      setEditionNumber(params.get('edition') ?? '')
    }

    const initAttempts = progressData?.initial_clue_attempts ?? 0
    if (initAttempts >= 5 && progressData?.initial_clue_hint) {
      setShowHint(true)
      setHintText(progressData?.initial_clue_hint ?? null)
    }

    const qs = progressData?.questions ?? []
    const at = progressData?.attempts  ?? []
    if (qs.length > 0 && qs.every(q => at.some(a => a.question_id === q.id && a.solved))) {
      setLocationQComplete(true)
      if (progressData?.initial_clue_hint) {
        setShowHint(true)
        setHintText(progressData?.initial_clue_hint ?? null)
      }
    }
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  // ── Submit main clue answer ────────────────────────────────────────────────
  async function submitMainAnswer() {
    if (!mainAnswer.trim() || mainSubmitting) return
    setMainSubmitting(true)
    try {
      const res  = await fetch('/api/hunt/answer', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type:             'initial_clue',
          user_id:          userId,
          hunt_location_id: huntLocation.id,
          answer:           mainAnswer,
        }),
      })
      if (!res.ok) {
        const err = await res.json().catch(() => ({})) as { error?: string }
        console.error('[HuntClient] submitMainAnswer API error:', res.status, err.error)
        setMainWrong(true)
        setTimeout(() => setMainWrong(false), 600)
        return
      }
      const data = await res.json() as { correct: boolean; showHint?: boolean; hint?: string | null }
      console.log('[HuntClient] submitMainAnswer response:', data)
      if (data.correct) {
        setRevealed(true)
      } else {
        setMainAttempts(prev => prev + 1)
        setMainWrong(true)
        setTimeout(() => setMainWrong(false), 600)
        if (data.showHint) {
          setShowHint(true)
          setHintText(data.hint ?? progressData?.initial_clue_hint ?? null)
        }
      }
    } finally {
      setMainSubmitting(false)
    }
  }

  // ── Submit location question answer ───────────────────────────────────────
  async function submitLocationAnswer() {
    if (!locationInput.trim() || locationSubmitting) return
    const qs       = progressData?.questions ?? []
    const currentQ = qs[locationQIndex]
    if (!currentQ) return
    setLocationSubmitting(true)
    try {
      const res  = await fetch('/api/hunt/answer', {
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
        const err = await res.json().catch(() => ({})) as { error?: string }
        console.error('[HuntClient] submitLocationAnswer API error:', res.status, err.error)
        setLocationWrong(true)
        setTimeout(() => setLocationWrong(false), 600)
        return
      }
      const data = await res.json() as { correct: boolean }
      console.log('[HuntClient] submitLocationAnswer response:', data)
      if (data.correct) {
        const next = locationQIndex + 1
        if (next >= qs.length) {
          setLocationQComplete(true)
          setShowHint(true)
          setHintText(progressData?.initial_clue_hint ?? null)
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

  // ── POST-SCAN: full-page celebration ──────────────────────────────────────
  if (isPostScan) {
    return (
      <div style={{
        display: 'flex', flexDirection: 'column', alignItems: 'center',
        justifyContent: 'center', minHeight: '100vh',
        background: 'transparent', color: '#0B2838',
        padding: '2rem 1.5rem', textAlign: 'center',
      }}>
        <img
          src='/images/Kitea Logo Only.png'
          alt='Kitea'
          className='gold-glow'
          style={{ width: '100px', height: '100px', objectFit: 'contain', marginBottom: '2rem' }}
        />
        <p style={{ fontSize: 'clamp(3rem,16vw,5rem)', fontWeight: 700, color: '#4A7C8C', margin: '0 0 0.5rem', lineHeight: 1 }}>
          #{editionNumber}
        </p>
        <h2 style={{ fontSize: 'clamp(1.1rem,4vw,1.5rem)', fontWeight: 600, margin: '0 0 1rem', color: '#0B2838' }}>
          {huntLocation.name} #{editionNumber}
        </h2>
        <p style={{ fontStyle: 'italic', color: '#4A7C8C', fontSize: '1rem', margin: '0 0 0.5rem' }}>
          You were the {editionNumber} person to find this place
        </p>
        <p style={{ fontSize: '0.8rem', color: '#8A7A5E', margin: '0 0 2.5rem', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
          A timestamp on a moment
        </p>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', width: '100%', maxWidth: '320px' }}>
          <Link href='/library' style={{
            display: 'block', background: '#4A7C8C', color: '#FFFFFF',
            textAlign: 'center', padding: '0.8rem 1rem', borderRadius: '6px',
            fontWeight: 600, fontSize: '1rem', textDecoration: 'none',
          }}>
            View your collection
          </Link>
          <Link href='/map' style={{
            display: 'block', background: 'transparent', color: '#4A7C8C',
            textAlign: 'center', padding: '0.8rem 1rem', borderRadius: '6px',
            fontWeight: 600, fontSize: '1rem', textDecoration: 'none',
            border: '2px solid #4A7C8C',
          }}>
            Find another hunt
          </Link>
        </div>
      </div>
    )
  }

  // ── MAIN LAYOUT: two-column ───────────────────────────────────────────────
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

      <div className='hunt-layout'>

        {/* ── LEFT COLUMN ──────────────────────────────────────────────────── */}
        <div className='hunt-col-main'>

          {/* Hunt name */}
          <h1 style={{ fontSize: 'clamp(1.5rem,6vw,2.25rem)', fontWeight: 700, color: '#0B2838', margin: '0 0 1.25rem' }}>
            {huntLocation.name}
          </h1>

          {/* ── REVEAL STATE ─────────────────────────────────────────────── */}
          {revealed ? (
            <div>
              <h2 style={{ color: '#4A7C8C', fontWeight: 700, fontSize: '1.5rem', margin: '0 0 1rem' }}>
                You found it!
              </h2>
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', margin: '2rem 0 1.5rem' }}>
                <img
                  src='/images/Kitea Logo Only.png'
                  alt='Kitea'
                  className='pulse'
                  style={{ width: '100px', height: '100px', objectFit: 'contain' }}
                />
              </div>
              {progressData?.reveal_directions ? (
                <p style={{ textAlign: 'center', fontSize: '1.1rem', fontWeight: 500, color: '#0B2838', marginBottom: '0.5rem' }}>
                  {progressData.reveal_directions}
                </p>
              ) : (
                <>
                  <p style={{ textAlign: 'center', fontSize: '1.1rem', fontWeight: 500, color: '#0B2838', marginBottom: '0.5rem' }}>
                    Tap your phone to the Kitea tag when you find it
                  </p>
                  <p style={{ textAlign: 'center', fontSize: '0.8rem', color: '#8A7A5E' }}>
                    Make sure NFC is enabled on your phone
                  </p>
                </>
              )}
            </div>

          ) : (
            <div>

              {/* Clue image — always shown; placeholder if null or error */}
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

              {/* Clue text — placeholder if null/empty */}
              {clue?.text_content ? (
                <p style={{ fontSize: '1rem', lineHeight: 1.7, color: '#0B2838', marginBottom: '1rem' }}>
                  {clue.text_content}
                </p>
              ) : (
                <p className='hunt-placeholder-text'>
                  The clue for this hunt is being prepared. Check back soon.
                </p>
              )}

              {/* Code type hint pill */}
              {clue?.code_type_hint && (
                <span style={{
                  display: 'inline-block', background: '#4A7C8C', color: '#FFFFFF',
                  borderRadius: '99px', padding: '0.25rem 0.75rem',
                  fontSize: '0.75rem', fontWeight: 600, marginBottom: '1.25rem', letterSpacing: '0.04em',
                }}>
                  {clue.code_type_hint}
                </span>
              )}

              {/* Main answer input */}
              <input
                type='text'
                value={mainAnswer}
                onChange={e => setMainAnswer(e.target.value)}
                onKeyDown={e => { if (e.key === 'Enter') { void submitMainAnswer() } }}
                className={`hunt-input${mainWrong ? ' shake' : ''}`}
                placeholder='Enter your answer…'
              />

              {/* Submit */}
              <button
                onClick={submitMainAnswer}
                disabled={mainSubmitting}
                className='hunt-btn-submit'
              >
                {mainSubmitting ? 'Checking…' : 'Submit Answer'}
              </button>

              {/* Attempt count */}
              {mainAttempts > 0 && (
                <p style={{ fontSize: '0.8rem', color: '#8A7A5E', margin: '0 0 1rem', textAlign: 'right' }}>
                  {mainAttempts} {mainAttempts === 1 ? 'attempt' : 'attempts'}
                </p>
              )}

              {/* Hint box */}
              {(showHint || locationQComplete) && (
                <div className='hunt-hint-box'>
                  <p style={{ fontSize: '0.7rem', fontWeight: 700, color: '#4A7C8C', margin: '0 0 0.4rem', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
                    Hint
                  </p>
                  <p style={{ fontSize: '0.95rem', color: '#4A7C8C', fontStyle: 'italic', margin: 0, lineHeight: 1.55 }}>
                    {hintText ?? progressData?.initial_clue_hint ?? ''}
                  </p>
                </div>
              )}

              {/* Location questions — placeholder if none */}
              {questions.length > 0 ? (
                <div>
                  <button
                    onClick={() => setShowLocationQuestions(v => !v)}
                    className='hunt-questions-toggle'
                  >
                    <span>Need help? Answer location questions for a hint</span>
                    <span style={{
                      display: 'inline-block',
                      transform: showLocationQuestions ? 'rotate(180deg)' : 'rotate(0deg)',
                      transition: 'transform 0.2s',
                    }}>
                      ▾
                    </span>
                  </button>

                  {showLocationQuestions && (
                    <div className='hunt-questions-panel'>
                      <p style={{ fontSize: '0.75rem', fontWeight: 600, color: '#4A7C8C', margin: '0 0 1rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                        Answer these {questions.length} questions to receive a hint for the main clue
                      </p>

                      {locationQComplete ? (
                        <div style={{ textAlign: 'center', padding: '1rem', color: '#4A7C8C', fontWeight: 600 }}>
                          Hint unlocked! See above.
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

                          {/* Current question */}
                          <p style={{ fontSize: '1rem', fontWeight: 600, color: '#0B2838', marginBottom: '0.75rem', lineHeight: 1.4 }}>
                            {questions[locationQIndex]?.question_text}
                          </p>

                          {/* Location answer input */}
                          <input
                            type='text'
                            value={locationInput}
                            onChange={e => setLocationInput(e.target.value)}
                            onKeyDown={e => { if (e.key === 'Enter') { void submitLocationAnswer() } }}
                            className={`hunt-input-sm${locationWrong ? ' shake' : ''}`}
                            placeholder='Your answer…'
                          />

                          {/* Submit location answer */}
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
                  )}
                </div>
              ) : (
                <p className='hunt-placeholder-text'>
                  Questions for this hunt are being finalised. Return once you have found the tag.
                </p>
              )}

            </div>
          )}
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
