// ─── Root Page ────────────────────────────────────────────────────────────────────────────
import type { Metadata } from 'next'
import Image from 'next/image'
import Link from 'next/link'

export const metadata: Metadata = { title: 'Kitea' }

export default function HomePage() {
  return (
    <div className="page-theme page-theme--home">

      {/* Brand Logo */}
      <section className="logo-hero logo-hero--home">
        <Image
          src="/images/Kitea Logo Only.png"
          alt="Kitea logo"
          width={400}
          height={400}
          priority
          style={{ objectFit: 'contain', width: 'auto' }}
        />
      </section>

      {/* Hero tagline */}
      <section className="section_1 section_1--home">
        <div className="container">
          <h2 style={{ color: '#0D1B2A' }}>Find it. Earn it. Own it.</h2>
          <p style={{ color: '#0D1B2A', maxWidth: '560px', margin: '0 auto' }}>
            Kitea hides NFC tags in the real world. Scan one, earn a
            unique on-chain collectible — permanent proof you were there.
          </p>
        </div>
      </section>

      {/* CTA */}
      <section className="cta">
        <div className="container">
          <h3 style={{ color: '#C9A84C' }}>Your adventure starts here.</h3>
          <p>Discover hidden Kitea tags near you and start building your collection.</p>
          <Link href="/map" className="btn-secondary">Explore the Map</Link>
        </div>
      </section>

    </div>
  )
}
