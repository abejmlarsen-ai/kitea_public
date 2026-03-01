// ─── Root Page ────────────────────────────────────────────────────────────────
import type { Metadata } from 'next'
import Image from 'next/image'
import Link from 'next/link'
import UnderConstruction from '@/components/ui/UnderConstruction'

export const metadata: Metadata = { title: 'Kitea' }

const isUnderConstruction = process.env.NEXT_PUBLIC_UNDER_CONSTRUCTION === 'true'

export default function HomePage() {
  if (isUnderConstruction) {
    return <UnderConstruction />
  }

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

      {/* Purpose */}
      <section className="section_1 section_1--home">
        <div className="container">
          <h2>Kitea</h2>
          <p>Inspire adventure and connection through stories and shared journeys.</p>
        </div>
      </section>

      {/* CTA */}
      <section className="cta">
        <div className="container">
          <h3>Ready to be part of the story?</h3>
          <p>We partner with brands, creators, and businesses who believe in the power of adventure and authentic connection.</p>
          <Link href="/contact" className="btn-secondary">Join the Adventure</Link>
        </div>
      </section>
    </div>
  )
}
