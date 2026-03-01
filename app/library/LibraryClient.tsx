'use client'

// ─── Library Client — NFT collection display ─────────────────────────────────
// Wrapped in Suspense so useSearchParams() works with static rendering.

import { useState, useEffect, Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import Image from 'next/image'
import type { MintedNFT } from './page'

type Props = {
  nfts: MintedNFT[]
}

// ─── NFT Modal ────────────────────────────────────────────────────────────────

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

        <div className="nft-modal-image">
          <Image
            src="/images/Kitea Logo Only.png"
            alt={name}
            width={180}
            height={180}
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

// ─── NFT Card ─────────────────────────────────────────────────────────────────

type CardProps = {
  nft: MintedNFT
  onClick: () => void
}

function NFTCard({ nft, onClick }: CardProps) {
  const isFounder = nft.hunt_location_id === null
  const name = isFounder
    ? `Kitea Founder #${nft.edition_number}`
    : `Kitea — ${nft.hunt_locations?.name ?? 'Unknown'} #${nft.edition_number}`

  return (
    <article
      className={`nft-card ${isFounder ? 'nft-card--founder' : 'nft-card--location'}`}
      onClick={onClick}
    >
      <div className="nft-card-image-wrapper">
        <Image
          src="/images/Kitea Logo Only.png"
          alt={name}
          width={isFounder ? 120 : 80}
          height={isFounder ? 120 : 80}
          className="nft-card-img"
        />
        {/* Hover overlay with View prompt */}
        <div className="nft-card-overlay" aria-hidden="true">
          <span className="nft-card-view-btn">View</span>
        </div>
        {/* Edition badge — top-right corner */}
        <span
          className={`nft-badge nft-card-badge ${
            isFounder ? 'nft-badge--founder' : 'nft-badge--location'
          }`}
        >
          #{nft.edition_number}
        </span>
      </div>

      <div className="nft-card-info">
        <p className="nft-card-name">{name}</p>
      </div>
    </article>
  )
}

// ─── Inner component (uses useSearchParams + modal state) ─────────────────────

function LibraryClientInner({ nfts }: Props) {
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

  const founderNFT = nfts.find((n) => n.hunt_location_id === null)
  const huntNFTs   = nfts.filter((n) => n.hunt_location_id !== null)

  // ── Empty state: only when truly no NFTs ──────────────────────────────────
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
            your first NFT.
          </p>
        </div>
        <div className="library-paper-footer">
          <p>Kitea Adventure Log &middot; On-chain proof of your journey</p>
        </div>
      </div>
    )
  }

  // ── Full collection view ───────────────────────────────────────────────────
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

        {/* Founder NFT — centred as the origin piece.
            Renders whenever the user has a founder NFT; the hunt-only
            section always shows regardless. */}
        {founderNFT && (
          <div className="library-founder-section">
            <div className="library-founder-label">Origin</div>
            <NFTCard
              nft={founderNFT}
              onClick={() => setSelectedNFT(founderNFT)}
            />
          </div>
        )}

        {/* Hunt NFTs */}
        <div className="library-hunts-section">
          <div className="library-hunts-divider">
            <span>Adventures Completed</span>
          </div>

          {huntNFTs.length === 0 ? (
            <p className="library-no-hunts">
              Complete a hunt to add it here.
            </p>
          ) : (
            <div className="library-hunts-grid">
              {huntNFTs.map((nft) => (
                <NFTCard
                  key={nft.id}
                  nft={nft}
                  onClick={() => setSelectedNFT(nft)}
                />
              ))}
            </div>
          )}
        </div>

        {/* Paper footer */}
        <div className="library-paper-footer">
          <p>Kitea Adventure Log &middot; On-chain proof of your journey</p>
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

export default function LibraryClient({ nfts }: Props) {
  return (
    <Suspense fallback={null}>
      <LibraryClientInner nfts={nfts} />
    </Suspense>
  )
}
