'use client'

// ─── Library Client — Collectible collection display ────────────────────
// Wrapped in Suspense so useSearchParams() works with static rendering.
// Single continuous grid, newest-first — no section split between hunt and
// founder collectibles, no headings above the grid.

import { useState, useEffect, Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import Image from 'next/image'
import type { MintedCollectible } from './page'
import { isPlaceholderArtwork, PLACEHOLDER_CAPTION_STYLE } from '@/lib/hunts/placeholderArtwork'

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
  // Founders have no hunt_locations row at all — they show the logo like
  // any other missing-art case, but never the "Placeholder design" caption,
  // since a founder edition isn't "art not ready yet", it just has no art field.
  const isPlaceholder = !isFounder && isPlaceholderArtwork(collectible.hunt_locations?.art_image_url ?? null)
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

// ─── Collectible Tile — square, edge-to-edge grid item ────────────────────

type TileProps = {
  collectible: MintedCollectible
  onClick: () => void
}

function CollectibleTile({ collectible, onClick }: TileProps) {
  const isFounder     = collectible.hunt_location_id === null
  const isPlaceholder = !isFounder && isPlaceholderArtwork(collectible.hunt_locations?.art_image_url ?? null)
  const name = isFounder
    ? `Kitea Founder #${collectible.edition_number}`
    : `Kitea — ${collectible.hunt_locations?.name ?? 'Unknown'} #${collectible.edition_number}`
  // "Hunt name" for the text box — founders have no hunt_locations row.
  const huntLabel = isFounder ? 'Founder' : (collectible.hunt_locations?.name ?? 'Unknown')

  const imageSrc = isPlaceholder ? '/images/Kitea Logo Only.png' : (collectible.art_signed_image_url ?? '/images/Kitea Logo Only.png')

  return (
    <button
      onClick={onClick}
      aria-label={name}
      style={{
        position:      'relative',
        display:       'flex',
        flexDirection: 'column',
        width:         '100%',
        boxSizing:     'border-box',
        border:        '10px solid #C9A84C',
        background:    '#FFFFFF',
        padding:       0,
        margin:        0,
        cursor:        'pointer',
        overflow:      'hidden',
        transition:    'opacity 0.15s ease',
      }}
      onMouseEnter={e => { (e.currentTarget as HTMLElement).style.opacity = '0.85' }}
      onMouseLeave={e => { (e.currentTarget as HTMLElement).style.opacity = '1' }}
    >
      {/* Artwork — stays square regardless of the text box beneath it */}
      <div style={{ position: 'relative', width: '100%', aspectRatio: '1 / 1', background: '#F8F8F8', flexShrink: 0 }}>
        <Image
          src={imageSrc}
          alt={name}
          fill
          style={{ objectFit: 'contain' }}
          sizes="(max-width: 600px) 33vw, (max-width: 900px) 25vw, (max-width: 1200px) 20vw, 16vw"
        />

        <span style={{
          position:      'absolute',
          top:           '6px',
          right:         '6px',
          background:    'rgba(0,0,0,0.75)',
          color:         '#FFFFFF',
          borderRadius:  '99px',
          padding:       '2px 8px',
          fontSize:      '0.65rem',
          fontWeight:    700,
          letterSpacing: '0.02em',
          lineHeight:    1.6,
        }}>
          #{collectible.edition_number}
        </span>

        {isPlaceholder && (
          <span style={{
            ...PLACEHOLDER_CAPTION_STYLE,
            position:  'absolute',
            left:      0,
            right:     0,
            bottom:    0,
            textAlign: 'center',
            fontSize:  '0.62rem',
            fontWeight: 700,
            padding:   '3px 4px',
          }}>
            Placeholder design
          </span>
        )}
      </div>

      {/* Text box — directly beneath the artwork, still inside the gold frame */}
      <div style={{ background: '#FFFFFF', padding: '6px 8px 8px', textAlign: 'center' }}>
        <p style={{
          margin:        0,
          fontSize:      '0.72rem',
          fontWeight:    700,
          color:         '#0B2838',
          lineHeight:    1.3,
          whiteSpace:    'nowrap',
          overflow:      'hidden',
          textOverflow:  'ellipsis',
        }}>
          {huntLabel}
        </p>
        <p style={{
          margin:     '2px 0 0',
          fontSize:   '0.62rem',
          fontWeight: 500,
          color:      '#0B2838',
          opacity:    0.7,
          lineHeight: 1.2,
        }}>
          #{collectible.edition_number}
        </p>
      </div>
    </button>
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

  // ── Empty state: only when truly no collectibles ───────────────────────
  if (collectibles.length === 0) {
    return (
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
    )
  }

  // ── Full collection view — one continuous grid, newest first ──────────────
  // collectibles already arrives ordered by minted_at desc from the server query.
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

      <div className="library-grid">
        {collectibles.map((collectible) => (
          <CollectibleTile
            key={collectible.id}
            collectible={collectible}
            onClick={() => setSelectedCollectible(collectible)}
          />
        ))}
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
