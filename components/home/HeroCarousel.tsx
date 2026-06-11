'use client'

import { useRef, useEffect } from 'react'

/* ═══════════════════════════════════════════════════════════════════════════════
 *  HERO VIDEO — change the src to swap the background video.
 *  To restore the multi-slide carousel, convert HERO_VIDEO back into an array
 *  and re-add the crossfade / timer logic (see git history).
 *
 *  Frame colour uses Coastal palette teal — change FRAME_COLOR below to any
 *  brand hex from the palette reference.
 *
 *  ┌─────────────────────────────────────────────────────────────────────────┐
 *  │  Dune to Deep:         #FFFFFF #F2EDE3 #C4B08E #8A7A5E #4A7C8C        │
 *  │                        #1B4965 #0B2838                                 │
 *  │  Organic Coastal:      #FAF3E0 #D4C5A0 #8BA888 #3D8B7A #1A6B5A       │
 *  │                        #0F3D35                                         │
 *  │  Golden Burnt Horizon: #FFF4E0 #D4A55A #B86B3A #8A3A2A #6B1D3A       │
 *  │                        #1A0A12                                         │
 *  └─────────────────────────────────────────────────────────────────────────┘
 * ═══════════════════════════════════════════════════════════════════════════════ */

const HERO_VIDEO   = '/videos/kurnell-1.mp4'
const FRAME_COLOR  = '#3D8B7A'
const FRAME_SIZE   = 'clamp(12px, 2.5vw, 32px)'
const LOGO_COLOR   = '#F2EDE3'

/* ═══════════════════════════════════════════════════════════════════════════════ */

export default function HeroCarousel() {
  const videoRef = useRef<HTMLVideoElement>(null)

  useEffect(() => {
    const v = videoRef.current
    if (!v) return
    v.play().catch(() => {})
  }, [])

  return (
    <div
      style={{
        position: 'relative',
        zIndex: 2,
        width: '100%',
        height: '100vh',
        overflow: 'hidden',
        background: FRAME_COLOR,
        padding: FRAME_SIZE,
      }}
    >
      {/* ── Video ─────────────────────────────────────────────────── */}
      <video
        ref={videoRef}
        src={HERO_VIDEO}
        muted
        loop
        playsInline
        preload="auto"
        style={{
          display: 'block',
          width: '100%',
          height: '100%',
          objectFit: 'cover',
          borderRadius: '2px',
        }}
      />

      {/* ── Centred logo + brand name + tagline ───────────────────── */}
      <div
        style={{
          position: 'absolute',
          inset: FRAME_SIZE,
          zIndex: 2,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          pointerEvents: 'none',
          gap: '0.75rem',
        }}
      >
        {/* Compass icon — CSS mask on transparent PNG */}
        <div
          aria-hidden="true"
          style={{
            width: 'min(140px, 25vw)',
            aspectRatio: '527 / 495',
            WebkitMaskImage: "url('/images/Kitea Logo Only.png')",
            maskImage: "url('/images/Kitea Logo Only.png')",
            WebkitMaskSize: 'contain',
            maskSize: 'contain' as string,
            WebkitMaskRepeat: 'no-repeat',
            maskRepeat: 'no-repeat' as string,
            WebkitMaskPosition: 'center',
            maskPosition: 'center' as string,
            backgroundColor: LOGO_COLOR,
          }}
        />

        {/* Brand name */}
        <h1
          style={{
            color: '#FFFFFF',
            backgroundColor: FRAME_COLOR,
            padding: '0.2em 0.6em',
            borderRadius: '4px',
            fontFamily: 'var(--font-heading)',
            fontSize: 'clamp(2rem, 6vw, 4rem)',
            fontWeight: 700,
            letterSpacing: '0.15em',
            margin: 0,
            textShadow: `0 2px 16px ${FRAME_COLOR}99`,
            transition: 'background-color 800ms ease',
          }}
        >
          KITEA
        </h1>

        {/* Tagline */}
        <p
          style={{
            color: '#FFFFFF',
            backgroundColor: FRAME_COLOR,
            padding: '0.15em 0.5em',
            borderRadius: '4px',
            fontFamily: 'var(--font-heading)',
            fontSize: 'clamp(0.85rem, 2vw, 1.1rem)',
            letterSpacing: '0.05em',
            textAlign: 'center',
            margin: 0,
            opacity: 1,
            textShadow: `0 2px 16px ${FRAME_COLOR}99`,
            transition: 'background-color 800ms ease',
          }}
        >
          Inspire adventure and connection through stories and shared journeys.
        </p>
      </div>
    </div>
  )
}
