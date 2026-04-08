// ─── Root Page ────────────────────────────────────────────────────────────────────────────
import type { Metadata } from 'next'
import Link from 'next/link'

export const metadata: Metadata = { title: 'Kitea' }

export default function HomePage() {
  return (
    <div className="page-theme page-theme--home">
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
