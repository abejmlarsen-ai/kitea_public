'use client'

import Image from 'next/image'
import type { MintedNFT } from './page'

type Props = {
  nfts: MintedNFT[]
}

export default function LibraryClient({ nfts }: Props) {
  const founderNFT = nfts.find((n) => n.hunt_location_id === null)
  const huntNFTs   = nfts.filter((n) => n.hunt_location_id !== null)

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
            className="nft-empty-logo"
          />
          <p className="nft-empty-text">
            Your collection is empty. Find a Kitea tag and scan it to earn your first NFT.
          </p>
        </div>
        <div className="library-paper-footer">
          <p>Kitea Adventure Log &middot; On-chain proof of your journey</p>
        </div>
      </div>
    )
  }

  return (
    <div className="library-paper">
      {/* Paper header */}
      <div className="library-paper-header">
        <h2>My Collection</h2>
        <p className="library-paper-subtitle">Adventure Log</p>
      </div>

      {/* Founder NFT — centred as the origin piece */}
      {founderNFT && (
        <div className="library-founder-section">
          <div className="library-founder-label">Origin</div>
          <article className="library-founder-card">
            <span className="nft-badge nft-badge--founder">Founder</span>
            <div className="library-founder-image">
              <Image
                src="/images/Kitea Logo Only.png"
                alt="Kitea Founder NFT"
                width={120}
                height={120}
              />
            </div>
            <h3>Kitea Founder #{founderNFT.edition_number}</h3>
            <a
              href={`https://sepolia.basescan.org/tx/${founderNFT.transaction_hash}`}
              target="_blank"
              rel="noopener noreferrer"
              className="nft-card-link"
            >
              View on BaseScan ↗
            </a>
          </article>
        </div>
      )}

      {/* Hunt NFTs — added as adventures are completed */}
      <div className="library-hunts-section">
        <div className="library-hunts-divider">
          <span>Adventures Completed</span>
        </div>

        {huntNFTs.length === 0 ? (
          <p className="library-no-hunts">Complete a hunt to add it here.</p>
        ) : (
          <div className="library-hunts-grid">
            {huntNFTs.map((nft) => (
              <article key={nft.id} className="library-hunt-card">
                <span className="nft-badge nft-badge--location">Location</span>
                <div className="library-hunt-image">
                  <Image
                    src="/images/Kitea Logo Only.png"
                    alt="Kitea NFT"
                    width={72}
                    height={72}
                  />
                </div>
                <h4>Kitea — {nft.hunt_locations?.name ?? 'Unknown'}</h4>
                <p className="library-hunt-edition">#{nft.edition_number}</p>
                <a
                  href={`https://sepolia.basescan.org/tx/${nft.transaction_hash}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="nft-card-link"
                >
                  View ↗
                </a>
              </article>
            ))}
          </div>
        )}
      </div>

      {/* Paper footer */}
      <div className="library-paper-footer">
        <p>Kitea Adventure Log &middot; On-chain proof of your journey</p>
      </div>
    </div>
  )
}
