import type { Metadata } from 'next'
import Image from 'next/image'

export const metadata: Metadata = { title: 'How It Works' }

export default function HowItWorksPage() {
  return (
    <>
      <section className="logo-hero logo-hero--hiw">
        <Image
          src="/images/Kitea Logo Only.png"
          alt="Kitea logo"
          width={300}
          height={300}
          priority
          style={{ objectFit: 'contain', maxHeight: '60vh', width: 'auto' }}
        />
      </section>

      <section className="section_1 section_1--hiw">
        <div className="container">
          <h2>How It Works</h2>
          <p>Content coming soon.</p>
        </div>
      </section>
    </>
  )
}
