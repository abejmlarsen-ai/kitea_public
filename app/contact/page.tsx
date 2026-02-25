import type { Metadata } from 'next'
import Image from 'next/image'

export const metadata: Metadata = { title: 'Contact' }

export default function ContactPage() {
  return (
    <>
      <section className="logo-hero logo-hero--home">
        <Image
          src="/images/Kitea Logo Only.png"
          alt="Kitea logo"
          width={300}
          height={300}
          priority
          style={{ objectFit: 'contain', maxHeight: '60vh', width: 'auto' }}
        />
      </section>

      <section className="section_1 section_1--home">
        <div className="container">
          <h2>Get in Touch</h2>
          <p>Contact information coming soon.</p>
        </div>
      </section>
    </>
  )
}
