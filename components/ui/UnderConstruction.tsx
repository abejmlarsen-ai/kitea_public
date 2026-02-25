// ─── Under Construction Banner ───────────────────────────────────────────────
// Rendered on the root page when NEXT_PUBLIC_UNDER_CONSTRUCTION=true.

import Image from 'next/image'

export default function UnderConstruction() {
  return (
    <>
      {/* Brand Logo */}
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

      {/* Under Construction */}
      <section className="section_1 section_1--construction">
        <div className="container">
          <h2>🚧 Under Construction 🚧</h2>
          <p>Something exciting is coming soon. Check back later!</p>
        </div>
      </section>
    </>
  )
}
