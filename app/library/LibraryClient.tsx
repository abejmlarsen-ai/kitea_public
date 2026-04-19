'use client'

// ─── Library Client — NFT collection display ────────────────────────────
// Wrapped in Suspense so useSearchParams() works with static rendering.

import { useState, useEffect, Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import Image from 'next/image'
import type { MintedNFT } from './page'

type Props = {
  nfts: MintedNFT[]
  userId?: string | null
  walletAddress?: string | null
}

// ─── NFT Modal ───────────────────────────────────────────────────────────

type ModalProps = {
  nft: MintedNFT
  onClose: () => void
}

function NFTModal({ nft, onClose }: ModalProps) {
  const isFounder = nft.hunt_location_id === null
  const name = isFounder
    ? `Kitea Founder #${nft.edition_number}`
    : `Kitea — ${nft.hunt_locations?.name ?? 'Unknown'} #${nft.edition_number}`

  const locationLabel = isFounder
    ? 'Origin Collection'
    : (nft.hunt_locations?.name ?? 'Unknown')

  const dateEarned = nft.minted_at
    ? new Date(nft.minted_at).toLocaleDateString('en-AU', {
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
      className="nft-modal-overlay"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
    >
      <div className="nft-modal" onClick={(e) => e.stopPropagation()}>
        <button
          className="nft-modal-close"
          onClick={onClose}
          aria-label="Close"
        >
          ✕
        </button>

        {/* Fixed-height container — objectFit:contain preserves natural aspect ratio */}
        <div className="nft-modal-image" style={{ position: 'relative', height: '220px', width: '100%' }}>
          <Image
            src={nft.nft_signed_image_url ?? '/images/Kitea Logo Only.png'}
            alt={name}
            fill
            style={{ objectFit: 'contain' }}
            sizes="(max-width: 600px) 90vw, 440px"
          />
        </div>

        <div className="nft-modal-body">
          <span
            className={`nft-badge ${
              isFounder ? 'nft-badge--founder' : 'nft-badge--location'
            }`}
          >
            {isFounder ? 'Founder' : 'Location'}
          </span>

          <h2 className="nft-modal-name">{name}</h2>

          <div className="nft-modal-details">
            <div className="nft-modal-detail-row">
              <span className="nft-modal-detail-label">Location</span>
              <span className="nft-modal-detail-value">{locationLabel}</span>
            </div>
            <div className="nft-modal-detail-row">
              <span className="nft-modal-detail-label">Date Earned</span>
              <span className="nft-modal-detail-value">{dateEarned}</span>
            </div>
          </div>

          {nft.transaction_hash && (
            <a
              href={`https://sepolia.basescan.org/tx/${nft.transaction_hash}`}
              target="_blank"
              rel="noopener noreferrer"
              className="nft-modal-basescan"
            >
              View on BaseScan ↗
            </a>
          )}
        </div>
      </div>
    </div>
  )
}

// ─── NFT Card ──────────────────────────────────────────────────────────────

type CardProps = {
  nft: MintedNFT
  onClick: () => void
}

function NFTCard({ nft, onClick }: CardProps) {
  const isFounder = nft.hunt_location_id === null
  const name = isFounder
    ? `Kitea Founder #${nft.edition_number}`
    : `Kitea — ${nft.hunt_locations?.name ?? 'Unknown'} #${nft.edition_number}`

  const imageSrc = nft.nft_signed_image_url ?? '/images/Kitea Logo Only.png'

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
          #{nft.edition_number}
        </span>
      </div>

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

function LibraryClientInner({ nfts, userId, walletAddress }: Props) {
  const searchParams    = useSearchParams()
  const [selectedNFT, setSelectedNFT] = useState<MintedNFT | null>(null)
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
  const huntNFTs   = nfts.filter((n) => n.hunt_location_id !== null)
  // Founder / origin collectibles second (hunt_location_id IS NULL)
  const founderNFTs = nfts.filter((n) => n.hunt_location_id === null)

  // ── Empty state: only when truly no NFTs ───────────────────────────────
  if (nfts.length === 0) {
    return (
      <div className="library-paper">
        <div className="library-paper-header">
          <h2>My Collection</h2>
          <p className="library-paper-subtitle">Adventure Log</p>
        </div>
        <div className="nft-empty">
          <Image
            src="/images/Kitea Logo Only.png"
            alt="Kitea star"
            width={64}
            height={64}
            className="nft-empty__logo"
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
        {huntNFTs.length > 0 && (
          <div style={{ marginBottom: founderNFTs.length > 0 ? '2.5rem' : 0 }}>
            <SectionHeading>Discoveries</SectionHeading>
            <div className="library-hunts-grid">
              {huntNFTs.map((nft) => (
                <NFTCard
                  key={nft.id}
                  nft={nft}
                  onClick={() => setSelectedNFT(nft)}
                />
              ))}
            </div>
          </div>
        )}

        {/* ── ORIGIN — founder collectibles below ────────────────────────── */}
        {founderNFTs.length > 0 && (
          <div>
            <SectionHeading>Origin</SectionHeading>
            <div className="library-hunts-grid">
              {founderNFTs.map((nft) => (
                <NFTCard
                  key={nft.id}
                  nft={nft}
                  onClick={() => setSelectedNFT(nft)}
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

      {/* NFT isolation modal */}
      {selectedNFT && (
        <NFTModal nft={selectedNFT} onClose={() => setSelectedNFT(null)} />
      )}
    </>
  )
}

// ─── Default export — wraps inner in Suspense for useSearchParams ─────────────

export default function LibraryClient({
  nfts,
  userId,
  walletAddress,
}: Props) {
  return (
    <Suspense fallback={null}>
      <LibraryClientInner
        nfts={nfts}
        userId={userId}
        walletAddress={walletAddress}
      />
    </Suspense>
  )
}
