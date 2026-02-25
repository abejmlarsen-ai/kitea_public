import type { Metadata } from 'next'
import Image from 'next/image'

export const metadata: Metadata = { title: 'About' }

export default function AboutPage() {
  return (
    <>
      <section className="logo-hero logo-hero--about">
        <Image
          src="/images/Kitea Logo Only.png"
          alt="Kitea logo"
          width={300}
          height={300}
          priority
          style={{ objectFit: 'contain', maxHeight: '60vh', width: 'auto' }}
        />
      </section>

      <section className="section_1 section_1--about">
        <div className="container">
          <h2>What is Kitea</h2>
          <p>To be updated to speak about Kitea — why, what, and who.</p>
        </div>
      </section>
    </>
  )
}
