'use client'

// ─── Library Client — Collectible collection display ────────────────────
// Wrapped in Suspense so useSearchParams() works with static rendering.

import { useState, useEffect, Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import Image from 'next/image'
import type { MintedCollectible } from './page'
import { isPlaceholderArtworkHunt, PLACEHOLDER_CAPTION_STYLE } from '@/lib/hunts/placeholderArtwork'

type Props = {
  collectibles: MintedCollectible[]
  userId?: string | null
  walletAddress?: string | null
}

// ─── Collectible Modal ───────────────────────────────────────────────────

type ModalProps = {
  collectible: MintedCollectible
  onClose: () => void
}

function CollectibleModal({ collectible, onClose }: ModalProps) {
  const isFounder     = collectible.hunt_location_id === null
  const isPlaceholder = isPlaceholderArtworkHunt(collectible.hunt_location_id)
  const imageSrc       = isPlaceholder ? '/images/Kitea Logo Only.png' : (collectible.art_signed_image_url ?? '/images/Kitea Logo Only.png')
  const name = isFounder
    ? `Kitea Founder #${collectible.edition_number}`
    : `Kitea — ${collectible.hunt_locations?.name ?? 'Unknown'} #${collectible.edition_number}`

  const locationLabel = isFounder
    ? 'Origin Collection'
    : (collectible.hunt_locations?.name ?? 'Unknown')

  const dateEarned = collectible.minted_at
    ? new Date(collectible.minted_at).toLocaleDateString('en-AU', {
        day: 'numeric',
        month: 'long',
        year: 'numeric',
      })
    : 'Unknown'

  // ESC key closes the modal
  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [onClose])

  return (
    <div
      className="collectible-modal-overlay"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
    >
      <div className="collectible-modal" onClick={(e) => e.stopPropagation()}>
        <button
          className="collectible-modal-close"
          onClick={onClose}
          aria-label="Close"
        >
          ✕
        </button>

        {/* Fixed-height container — objectFit:contain preserves natural aspect ratio */}
        <div className="collectible-modal-image" style={{ position: 'relative', height: '220px', width: '100%' }}>
          <Image
            src={imageSrc}
            alt={name}
            fill
            style={{ objectFit: 'contain' }}
            sizes="(max-width: 600px) 90vw, 440px"
          />
        </div>
        {isPlaceholder && (
          <div style={{
            ...PLACEHOLDER_CAPTION_STYLE,
            textAlign: 'center', fontSize: '0.8rem', fontWeight: 700,
            padding: '0.4rem', borderRadius: '6px', margin: '0.75rem 0 0',
          }}>
            Placeholder design
          </div>
        )}

        <div className="collectible-modal-body">
          <span
            className={`collectible-badge ${
              isFounder ? 'collectible-badge--founder' : 'collectible-badge--location'
            }`}
          >
            {isFounder ? 'Founder' : 'Location'}
          </span>

          <h2 className="collectible-modal-name">{name}</h2>

          <div className="collectible-modal-details">
            <div className="collectible-modal-detail-row">
              <span className="collectible-modal-detail-label">Location</span>
              <span className="collectible-modal-detail-value">{locationLabel}</span>
            </div>
            <div className="collectible-modal-detail-row">
              <span className="collectible-modal-detail-label">Date Earned</span>
              <span className="collectible-modal-detail-value">{dateEarned}</span>
            </div>
          </div>

          {collectible.transaction_hash && (
            <a
              href={`https://sepolia.basescan.org/tx/${collectible.transaction_hash}`}
              target="_blank"
              rel="noopener noreferrer"
              className="collectible-modal-basescan"
            >
              View on BaseScan ↗
            </a>
          )}
        </div>
      </div>
    </div>
  )
}

// ─── Collectible Card ──────────────────────────────────────────────────────

type CardProps = {
  collectible: MintedCollectible
  onClick: () => void
}

function CollectibleCard({ collectible, onClick }: CardProps) {
  const isFounder     = collectible.hunt_location_id === null
  const isPlaceholder = isPlaceholderArtworkHunt(collectible.hunt_location_id)
  const name = isFounder
    ? `Kitea Founder #${collectible.edition_number}`
    : `Kitea — ${collectible.hunt_locations?.name ?? 'Unknown'} #${collectible.edition_number}`

  const imageSrc = isPlaceholder ? '/images/Kitea Logo Only.png' : (collectible.art_signed_image_url ?? '/images/Kitea Logo Only.png')

  return (
    <article
      onClick={onClick}
      style={{
        background:    '#FFFFFF',
        border:        '1px solid #000000',
        borderRadius:  '12px',
        padding:       '16px',
        cursor:        'pointer',
        display:       'flex',
        flexDirection: 'column',
        gap:           '12px',
        transition:    'transform 0.2s ease, box-shadow 0.2s ease',
      }}
      onMouseEnter={e => {
        (e.currentTarget as HTMLElement).style.transform  = 'translateY(-3px)'
        ;(e.currentTarget as HTMLElement).style.boxShadow = '0 6px 20px rgba(0,0,0,0.12)'
      }}
      onMouseLeave={e => {
        (e.currentTarget as HTMLElement).style.transform  = ''
        ;(e.currentTarget as HTMLElement).style.boxShadow = ''
      }}
    >
      {/* Fixed-height image container — contain, never stretch or crop */}
      <div style={{
        position:        'relative',
        height:          '200px',
        width:           '100%',
        background:      '#F8F8F8',
        borderRadius:    '8px',
        overflow:        'hidden',
        display:         'flex',
        alignItems:      'center',
        justifyContent:  'center',
      }}>
        <Image
          src={imageSrc}
          alt={name}
          fill
          style={{ objectFit: 'contain' }}
          sizes="(max-width: 640px) 90vw, (max-width: 1024px) 45vw, 280px"
        />
        {/* Edition badge */}
        <span style={{
          position:      'absolute',
          top:           '8px',
          right:         '8px',
          background:    '#000000',
          color:         '#FFFFFF',
          borderRadius:  '99px',
          padding:       '2px 10px',
          fontSize:      '0.72rem',
          fontWeight:    700,
          letterSpacing: '0.04em',
          lineHeight:    1.6,
        }}>
          #{collectible.edition_number}
        </span>
      </div>

      {isPlaceholder && (
        <div style={{
          ...PLACEHOLDER_CAPTION_STYLE,
          textAlign: 'center', fontSize: '0.72rem', fontWeight: 700,
          padding: '0.3rem', borderRadius: '6px',
        }}>
          Placeholder design
        </div>
      )}

      {/* Card name */}
      <p style={{
        margin:     0,
        fontSize:   '0.85rem',
        fontWeight: 700,
        color:      '#000000',
        textAlign:  'center',
        lineHeight: 1.35,
      }}>
        {name}
      </p>
    </article>
  )
}

// ─── Section heading ──────────────────────────────────────────────────────────

function SectionHeading({ children }: { children: React.ReactNode }) {
  return (
    <h3 style={{
      fontSize:      '0.7rem',
      fontWeight:    700,
      color:         '#8A7A5E',
      textTransform: 'uppercase',
      letterSpacing: '0.1em',
      margin:        '0 0 1rem',
    }}>
      {children}
    </h3>
  )
}

// ─── Inner component (uses useSearchParams + modal state) ────────────────────

function LibraryClientInner({ collectibles, userId, walletAddress }: Props) {
  const searchParams    = useSearchParams()
  // Deep link from the map's "View in Library" overlay: /library?hunt={hunt_location_id}
  // opens that hunt's collectible directly instead of landing on the grid.
  const huntParam = searchParams.get('hunt')
  const [selectedCollectible, setSelectedCollectible] = useState<MintedCollectible | null>(
    () => (huntParam ? collectibles.find((c) => c.hunt_location_id === huntParam) ?? null : null)
  )
  const [bannerDismissed, setBannerDismissed] = useState(false)

  const scanParam     = searchParams.get('scan')
  const locationParam = searchParams.get('location')
  const editionParam  = searchParams.get('edition')

  const showBanner =
    scanParam === 'success' &&
    !!locationParam &&
    !!editionParam &&
    !bannerDismissed

  // Auto-dismiss banner after 8 s
  useEffect(() => {
    if (!showBanner) return
    const t = setTimeout(() => setBannerDismissed(true), 8000)
    return () => clearTimeout(t)
  }, [showBanner])

  // Hunt collectibles first (hunt_location_id NOT NULL), ordered by minted_at desc
  // (server already returns minted_at desc, so filter preserves that order)
  const huntCollectibles   = collectibles.filter((c) => c.hunt_location_id !== null)
  // Founder / origin collectibles second (hunt_location_id IS NULL)
  const founderCollectibles = collectibles.filter((c) => c.hunt_location_id === null)

  // ── Empty state: only when truly no collectibles ───────────────────────
  if (collectibles.length === 0) {
    return (
      <div className="library-paper">
        <div className="library-paper-header">
          <h2>My Collection</h2>
          <p className="library-paper-subtitle">Adventure Log</p>
        </div>
        <div className="collectible-empty">
          <Image
            src="/images/Kitea Logo Only.png"
            alt="Kitea star"
            width={64}
            height={64}
            className="collectible-empty__logo"
          />
          <p>
            Your collection is empty. Find a Kitea tag and scan it to earn
            your first collectible.
          </p>
        </div>
        <div className="library-paper-footer">
          <p>Kitea Adventure Log &middot; Proof of your journey</p>
        </div>
      </div>
    )
  }

  // ── Full collection view ─────────────────────────────────────────────────
  return (
    <>
      {/* Scan-success congratulations banner */}
      {showBanner && locationParam && editionParam && (
        <div className="scan-banner">
          <span className="scan-banner-icon">✦</span>
          <span className="scan-banner-text">
            <strong>Congratulations!</strong>{' '}
            You earned Kitea — {decodeURIComponent(locationParam)} #{editionParam}
          </span>
          <button
            className="scan-banner-dismiss"
            onClick={() => setBannerDismissed(true)}
            aria-label="Dismiss notification"
          >
            ✕
          </button>
        </div>
      )}

      <div className="library-paper">
        {/* Paper header */}
        <div className="library-paper-header">
          <h2>My Collection</h2>
          <p className="library-paper-subtitle">Adventure Log</p>
        </div>

        {/* ── DISCOVERIES — hunt collectibles first ──────────────────────── */}
        {huntCollectibles.length > 0 && (
          <div style={{ marginBottom: founderCollectibles.length > 0 ? '2.5rem' : 0 }}>
            <SectionHeading>Discoveries</SectionHeading>
            <div className="library-hunts-grid">
              {huntCollectibles.map((collectible) => (
                <CollectibleCard
                  key={collectible.id}
                  collectible={collectible}
                  onClick={() => setSelectedCollectible(collectible)}
                />
              ))}
            </div>
          </div>
        )}

        {/* ── ORIGIN — founder collectibles below ────────────────────────── */}
        {founderCollectibles.length > 0 && (
          <div>
            <SectionHeading>Origin</SectionHeading>
            <div className="library-hunts-grid">
              {founderCollectibles.map((collectible) => (
                <CollectibleCard
                  key={collectible.id}
                  collectible={collectible}
                  onClick={() => setSelectedCollectible(collectible)}
                />
              ))}
            </div>
          </div>
        )}

        {/* Paper footer */}
        <div className="library-paper-footer">
          <p>Kitea Adventure Log &middot; Proof of your journey</p>
        </div>
      </div>

      {/* Collectible isolation modal */}
      {selectedCollectible && (
        <CollectibleModal collectible={selectedCollectible} onClose={() => setSelectedCollectible(null)} />
      )}
    </>
  )
}

// ─── Default export — wraps inner in Suspense for useSearchParams ─────────────

export default function LibraryClient({
  collectibles,
  userId,
  walletAddress,
}: Props) {
  return (
    <Suspense fallback={null}>
      <LibraryClientInner
        collectibles={collectibles}
        userId={userId}
        walletAddress={walletAddress}
      />
    </Suspense>
  )
}
