'use client'

import Image from 'next/image'
import type { MintedNFT } from './page'

type Props = {
  nfts: MintedNFT[]
}

export default function LibraryClient({ nfts }: Props) {
  if (nfts.length === 0) {
    return (
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
    )
  }

  return (
    <section className="nft-grid">
      {nfts.map((nft) => {
        const isFounder = nft.hunt_location_id === null
        const name = isFounder
          ? `Kitea Founder #${nft.edition_number}`
          : `Kitea — ${nft.hunt_locations?.name ?? 'Unknown'} #${nft.edition_number}`

        return (
          <article
            key={nft.id}
            className={`nft-card${isFounder ? ' nft-card--founder' : ' nft-card--location'}`}
          >
            <span className={`nft-badge${isFounder ? ' nft-badge--founder' : ' nft-badge--location'}`}>
              {isFounder ? 'Founder' : 'Location'}
            </span>

            <div className="nft-card-image-wrapper">
              <Image
                src="/images/Kitea Logo Only.png"
                alt="Kitea star"
                width={120}
                height={120}
                className="nft-card-image"
              />
            </div>

            <h3 className="nft-card-name">{name}</h3>

            <a
              href={`https://sepolia.basescan.org/tx/${nft.transaction_hash}`}
              target="_blank"
              rel="noopener noreferrer"
              className="nft-card-link"
            >
              View on BaseScan ↗
            </a>
          </article>
        )
      })}
    </section>
  )
}
