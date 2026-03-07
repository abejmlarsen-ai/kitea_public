'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'

interface HuntLocation {
  id: string
  name: string
  description: string
  total_scans: number
}

interface Question {
  id: string
  question_text: string
  order_index: number
  hint_after_attempts: number
}

interface ProgressData {
  clue: { image_url: string | null; text_content: string | null; code_type_hint: string | null } | null
  questions: Question[]
  progress: { current_question_index: number; location_revealed: boolean; completed_at: string | null } | null
  attempts: { question_id: string; attempt_count: number; solved: boolean }[]
  reveal: { reveal_image_url: string | null; reveal_directions: string } | null
}

interface Props {
  huntLocation: HuntLocation
  userId: string
  progressData: ProgressData | null
}

export default function HuntClient({ huntLocation, userId, progressData }: Props) {
  const [viewState,            setViewState]            = useState<'clue' | 'questions' | 'reveal' | 'postScan'>('clue')
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState<number>(0)
  const [inputValue,           setInputValue]           = useState<string>('')
  const [isSubmitting,         setIsSubmitting]         = useState<boolean>(false)
  const [isWrong,              setIsWrong]              = useState<boolean>(false)
  const [showHint,             setShowHint]             = useState<boolean>(false)
  const [hintText,             setHintText]             = useState<string | null>(null)
  const [editionNumber,        setEditionNumber]        = useState<string>('')
  const [hintExpanded,         setHintExpanded]         = useState<boolean>(false)

  useEffect(() => {
    const params = new URLSearchParams(window.location.search)

    if (params.get('scanned') === 'true') {
      setViewState('postScan')
      setEditionNumber(params.get('edition') ?? '')
    } else {
      if (progressData?.progress?.location_revealed) {
        setViewState('reveal')
      } else if ((progressData?.progress?.current_question_index ?? 0) > 0) {
        setViewState('questions')
        setCurrentQuestionIndex(progressData!.progress!.current_question_index)
      }
      // else leave as 'clue'
    }
  }, [])

  async function submitAnswer() {
    setIsSubmitting(true)
    try {
      const currentQuestion = progressData?.questions[currentQuestionIndex]
      if (!currentQuestion) return

      const res = await fetch('/api/hunt/answer', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ user_id: userId, question_id: currentQuestion.id, answer: inputValue }),
      })
      const data = await res.json()

      if (data.correct) {
        setInputValue('')
        if (data.huntComplete) {
          setViewState('reveal')
        } else {
          setCurrentQuestionIndex(data.nextQuestionIndex)
        }
      } else {
        setIsWrong(true)
        setTimeout(() => setIsWrong(false), 600)
        if (data.showHint) {
          setShowHint(true)
          setHintText(data.hint)
        }
      }
    } finally {
      setIsSubmitting(false)
    }
  }

  const clue = progressData?.clue
  const hasClueData = !!(clue?.image_url || clue?.text_content || clue?.code_type_hint)

  return (
    <div style={{ background: '#0a0a0a', minHeight: '100vh', color: 'white' }}>

      {/* ── Clue view ─────────────────────────────────────────────── */}
      {viewState === 'clue' && (
        <div style={{ padding: '1.5rem 1rem' }}>

          {/* Back link */}
          <Link
            href="/hunts"
            style={{ color: '#C9A84C', textDecoration: 'none', fontSize: '1.25rem' }}
          >
            ←
          </Link>

          {/* Location name */}
          <h1 style={{ margin: '1rem 0', fontSize: 'clamp(1.5rem, 6vw, 2.25rem)', fontWeight: 700 }}>
            {huntLocation.name}
          </h1>

          {/* Clue image */}
          {clue?.image_url && (
            <img
              src={clue.image_url}
              alt="Hunt clue"
              style={{ width: '100%', maxHeight: '300px', objectFit: 'cover', borderRadius: '0.5rem', marginBottom: '1rem' }}
            />
          )}

          {/* Clue text */}
          {clue?.text_content && (
            <p style={{ fontSize: '1rem', lineHeight: 1.6, color: '#d0d0d0', marginBottom: '1rem' }}>
              {clue.text_content}
            </p>
          )}

          {/* Code type hint pill */}
          {clue?.code_type_hint && (
            <span style={{
              display: 'inline-block',
              border: '1px solid #C9A84C',
              borderRadius: '99px',
              padding: '0.2rem 0.65rem',
              fontSize: '0.75rem',
              color: '#C9A84C',
              marginBottom: '1.25rem',
            }}>
              {clue.code_type_hint}
            </span>
          )}

          {/* No clue configured */}
          {!hasClueData && (
            <p style={{ color: '#888' }}>This hunt is not yet configured.</p>
          )}

          {/* Begin button */}
          <div style={{ marginTop: '1.5rem' }}>
            <button
              onClick={() => setViewState('questions')}
              style={{
                background: '#C9A84C',
                color: '#000',
                border: 'none',
                borderRadius: '0.5rem',
                padding: '0.75rem 2rem',
                fontSize: '1rem',
                fontWeight: 600,
                cursor: 'pointer',
              }}
            >
              Begin the Hunt
            </button>
          </div>

        </div>
      )}

      {/* ── Questions view ────────────────────────────────────────── */}
      {viewState === 'questions' && (
        <div style={{ padding: '1.5rem 1rem' }}>

          {/* Back link */}
          <Link
            href="/hunts"
            style={{ color: '#C9A84C', textDecoration: 'none', fontSize: '1.25rem' }}
          >
            ←
          </Link>

          {/* Progress dots */}
          <div style={{ display: 'flex', gap: '0.5rem', margin: '1.25rem 0', alignItems: 'center' }}>
            {progressData?.questions.map((_, i) => (
              <span
                key={i}
                style={{
                  display:      'inline-block',
                  width:        i === currentQuestionIndex ? '14px' : '10px',
                  height:       i === currentQuestionIndex ? '14px' : '10px',
                  borderRadius: '50%',
                  background:   i < currentQuestionIndex  ? '#C9A84C' : i === currentQuestionIndex ? '#C9A84C' : 'transparent',
                  border:       i > currentQuestionIndex  ? '1.5px solid #555' : 'none',
                  flexShrink:   0,
                  transition:   'all 0.2s',
                }}
              />
            ))}
          </div>

          {/* Current question */}
          <h2 style={{ fontSize: 'clamp(1.2rem, 5vw, 1.75rem)', fontWeight: 600, margin: '0 0 1.5rem', lineHeight: 1.35 }}>
            {progressData?.questions[currentQuestionIndex]?.question_text}
          </h2>

          {/* Answer input */}
          <input
            type="text"
            value={inputValue}
            onChange={e => setInputValue(e.target.value)}
            className={isWrong ? 'shake' : ''}
            placeholder="Your answer..."
            style={{
              width:        '100%',
              padding:      '0.75rem 1rem',
              fontSize:     '1rem',
              background:   '#1a1a1a',
              border:       '1px solid #333',
              borderRadius: '0.5rem',
              color:        'white',
              boxSizing:    'border-box',
              marginBottom: '0.75rem',
              outline:      'none',
            }}
          />

          {/* Submit button */}
          <button
            onClick={submitAnswer}
            disabled={isSubmitting}
            style={{
              width:        '100%',
              background:   isSubmitting ? '#555' : '#C9A84C',
              color:        '#000',
              border:       'none',
              borderRadius: '0.5rem',
              padding:      '0.75rem',
              fontSize:     '1rem',
              fontWeight:   600,
              cursor:       isSubmitting ? 'not-allowed' : 'pointer',
            }}
          >
            {isSubmitting ? 'Checking...' : 'Submit'}
          </button>

          {/* Hint section */}
          {showHint && (
            <div style={{ marginTop: '1.25rem' }}>
              <button
                onClick={() => setHintExpanded(!hintExpanded)}
                style={{
                  background:   'transparent',
                  border:       '1px solid #444',
                  borderRadius: '0.375rem',
                  color:        '#888',
                  padding:      '0.4rem 0.75rem',
                  fontSize:     '0.875rem',
                  cursor:       'pointer',
                }}
              >
                Need a hint?
              </button>
              {hintExpanded && hintText && (
                <p style={{ marginTop: '0.75rem', color: '#d0d0d0', fontSize: '0.95rem', lineHeight: 1.5 }}>
                  {hintText}
                </p>
              )}
            </div>
          )}

        </div>
      )}

      {/* ── Placeholders ──────────────────────────────────────────── */}
      {/* ── Reveal view ───────────────────────────────────────────── */}
      {viewState === 'reveal' && (
        <div style={{ padding: '1.5rem 1rem' }}>

          {/* Back link */}
          <Link
            href="/hunts"
            style={{ color: '#C9A84C', textDecoration: 'none', fontSize: '1.25rem' }}
          >
            ←
          </Link>

          {/* Heading */}
          <h1 style={{ margin: '1rem 0', fontSize: 'clamp(1.5rem, 6vw, 2.25rem)', fontWeight: 700 }}>
            You found it
          </h1>

          {/* Reveal image */}
          {progressData?.reveal?.reveal_image_url && (
            <img
              src={progressData.reveal.reveal_image_url}
              alt="Location reveal"
              style={{ width: '100%', maxHeight: '300px', objectFit: 'cover', borderRadius: '0.5rem', marginBottom: '1rem' }}
            />
          )}

          {/* Directions */}
          {progressData?.reveal?.reveal_directions && (
            <p style={{ fontSize: '1rem', lineHeight: 1.6, color: '#d0d0d0', marginBottom: '1.5rem' }}>
              {progressData.reveal.reveal_directions}
            </p>
          )}

          {/* Pulsing logo */}
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', margin: '2rem 0 1.5rem' }}>
            <img
              src="/images/Kitea Logo Only.png"
              alt="Kitea logo"
              className="pulse"
              style={{ width: '120px', height: '120px', objectFit: 'contain' }}
            />
          </div>

          {/* NFC prompt */}
          <p style={{ textAlign: 'center', fontSize: '1.1rem', fontWeight: 500, marginBottom: '0.5rem' }}>
            Tap your phone to the Kitea tag when you find it
          </p>

          {/* NFC note */}
          <p style={{ textAlign: 'center', fontSize: '0.8rem', color: '#888', margin: 0 }}>
            Make sure NFC is enabled on your phone
          </p>

        </div>
      )}

      {/* ── Post-scan view ────────────────────────────────────────── */}
      {viewState === 'postScan' && (
        <div style={{
          display:        'flex',
          flexDirection:  'column',
          alignItems:     'center',
          justifyContent: 'center',
          minHeight:      '100vh',
          padding:        '2rem 1.5rem',
          textAlign:      'center',
        }}>

          {/* Pulsing gold logo */}
          <img
            src="/images/Kitea Logo Only.png"
            alt="Kitea logo"
            className="gold-glow"
            style={{ width: '100px', height: '100px', objectFit: 'contain', marginBottom: '2rem' }}
          />

          {/* Edition number — large gold heading */}
          <p style={{
            fontSize:    'clamp(3rem, 16vw, 5rem)',
            fontWeight:  700,
            color:       '#C9A84C',
            margin:      '0 0 0.5rem',
            lineHeight:  1,
          }}>
            #{editionNumber}
          </p>

          {/* Location + edition */}
          <h2 style={{ fontSize: 'clamp(1.1rem, 4vw, 1.5rem)', fontWeight: 600, margin: '0 0 1rem', color: '#f0f0f0' }}>
            {huntLocation.name} #{editionNumber}
          </h2>

          {/* Ordinal sentence */}
          <p style={{ fontStyle: 'italic', color: '#aaa', fontSize: '1rem', margin: '0 0 0.5rem' }}>
            You were the {editionNumber} person to find this place
          </p>

          {/* Subtext */}
          <p style={{ fontSize: '0.8rem', color: '#555', margin: '0 0 2.5rem', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
            A timestamp on a moment
          </p>

          {/* CTA buttons */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', width: '100%', maxWidth: '320px' }}>
            <Link
              href="/library"
              style={{
                display:      'block',
                background:   '#C9A84C',
                color:        '#000',
                textAlign:    'center',
                padding:      '0.8rem 1rem',
                borderRadius: '0.5rem',
                fontWeight:   600,
                fontSize:     '1rem',
                textDecoration: 'none',
              }}
            >
              View your collection
            </Link>
            <Link
              href="/hunts"
              style={{
                display:        'block',
                background:     'transparent',
                color:          '#C9A84C',
                textAlign:      'center',
                padding:        '0.8rem 1rem',
                borderRadius:   '0.5rem',
                fontWeight:     600,
                fontSize:       '1rem',
                textDecoration: 'none',
                border:         '1px solid #C9A84C',
              }}
            >
              Find another hunt
            </Link>
          </div>

        </div>
      )}

    </div>
  )
}
