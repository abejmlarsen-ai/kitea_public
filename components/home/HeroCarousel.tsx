'use client'

import { useState, useEffect, useRef } from 'react'

/* ═══════════════════════════════════════════════════════════════════════════════
 *  HERO MEDIA — edit this array to add, remove, or reorder hero slides.
 *
 *  Each entry:
 *    src        — path relative to /public (e.g. '/videos/my-clip.mp4')
 *    type       — 'video' | 'image'
 *    brandColor — a hex from the Kitea Ao brand palettes (listed below).
 *                 Pick the colour that best matches the mood of the media.
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

interface HeroMediaItem {
  src: string
  type: 'video' | 'image'
  brandColor: string
}

const HERO_MEDIA: HeroMediaItem[] = [
  { src: '/videos/kurnell-1.mp4', type: 'video', brandColor: '#1B4965' },
  { src: '/videos/eloeura.mp4',   type: 'video', brandColor: '#3D8B7A' },
  { src: '/videos/opera-1.mp4',   type: 'video', brandColor: '#D4A55A' },
]

const CYCLE_MS      = 60_000
const TRANSITION_MS = 800

/* ═══════════════════════════════════════════════════════════════════════════════ */

function relativeLuminance(hex: string): number {
  const r = parseInt(hex.slice(1, 3), 16) / 255
  const g = parseInt(hex.slice(3, 5), 16) / 255
  const b = parseInt(hex.slice(5, 7), 16) / 255
  const lin = (c: number) =>
    c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4
  return 0.2126 * lin(r) + 0.7152 * lin(g) + 0.0722 * lin(b)
}

function contrastingLogoColor(brandColor: string): string {
  return relativeLuminance(brandColor) < 0.25 ? '#F2EDE3' : '#0B2838'
}

export default function HeroCarousel() {
  const [activeIndex, setActiveIndex] = useState(0)
  const videoRefs = useRef<(HTMLVideoElement | null)[]>([])

  const { brandColor } = HERO_MEDIA[activeIndex]
  const logoColor = contrastingLogoColor(brandColor)

  useEffect(() => {
    if (HERO_MEDIA.length <= 1) return
    const id = setInterval(() => {
      setActiveIndex((i) => (i + 1) % HERO_MEDIA.length)
    }, CYCLE_MS)
    return () => clearInterval(id)
  }, [])

  useEffect(() => {
    videoRefs.current.forEach((v, i) => {
      if (!v) return
      if (i === activeIndex) {
        v.currentTime = 0
        v.play().catch(() => {})
      } else {
        v.pause()
      }
    })
  }, [activeIndex])

  const t = `${TRANSITION_MS}ms ease-in-out`

  return (
    <div
      style={{
        position: 'relative',
        width: '100%',
        height: '100vh',
        overflow: 'hidden',
        background: '#0B2838',
      }}
    >
      {/* ── Media layers ──────────────────────────────────────────── */}
      {HERO_MEDIA.map((item, i) => (
        <div
          key={item.src}
          style={{
            position: 'absolute',
            inset: 0,
            opacity: i === activeIndex ? 1 : 0,
            transition: `opacity ${t}`,
            zIndex: 1,
          }}
        >
          {item.type === 'video' ? (
            <video
              ref={(el) => { videoRefs.current[i] = el }}
              src={item.src}
              muted
              loop
              playsInline
              preload={i <= 1 ? 'auto' : 'metadata'}
              style={{ width: '100%', height: '100%', objectFit: 'cover' }}
            />
          ) : (
            <img
              src={item.src}
              alt=""
              draggable={false}
              style={{ width: '100%', height: '100%', objectFit: 'cover' }}
            />
          )}
        </div>
      ))}

      {/* ── Vignette / glow overlay ───────────────────────────────── */}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          zIndex: 2,
          pointerEvents: 'none',
          boxShadow: `inset 0 0 180px 80px ${brandColor}`,
          transition: `box-shadow ${t}`,
        }}
      />

      {/* ── Centred logo + brand name + tagline ───────────────────── */}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          zIndex: 3,
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
            backgroundColor: logoColor,
            transition: `background-color ${t}`,
          }}
        />

        {/* Brand name */}
        <h1
          style={{
            color: logoColor,
            fontFamily: 'var(--font-heading)',
            fontSize: 'clamp(2rem, 6vw, 4rem)',
            fontWeight: 700,
            letterSpacing: '0.15em',
            margin: 0,
            textShadow: `0 2px 20px ${brandColor}`,
            transition: `color ${t}, text-shadow ${t}`,
          }}
        >
          KITEA
        </h1>

        {/* Tagline */}
        <p
          style={{
            color: logoColor,
            fontFamily: 'var(--font-heading)',
            fontSize: 'clamp(0.85rem, 2vw, 1.1rem)',
            letterSpacing: '0.05em',
            textAlign: 'center',
            padding: '0 1rem',
            margin: 0,
            opacity: 0.85,
            textShadow: `0 1px 10px ${brandColor}`,
            transition: `color ${t}, text-shadow ${t}`,
          }}
        >
          Inspire adventure and connection through stories and shared journeys.
        </p>
      </div>
    </div>
  )
}
