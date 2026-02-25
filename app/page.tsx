// ─── Root Page ────────────────────────────────────────────────────────────────
// Shows an "Under Construction" screen on the main/production branch when the
// NEXT_PUBLIC_UNDER_CONSTRUCTION env var is set to "true".
// On the develop branch (or when the flag is absent) the full home page renders.

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

      {/* Hero */}
      <section className="section_1 section_1--home">
        <div className="container">
          <h2>Purpose</h2>
          <p>To inspire adventure and connection through stories and shared journeys.</p>
        </div>
      </section>

      {/* Vision */}
      <section className="section_2">
        <div className="container">
          <h2>Vision Statement</h2>
          <div className="vision-text">
            <p>A world where clothing empowers people to step into stories bigger than themselves.</p>
            <p>Where every journey deepens our connection to each other, the planet, and the stories that shaped us.</p>
            <p>We exist because curiosity and connection move us forward.</p>
            <p>By transforming branding and technology into a platform for storytelling,</p>
            <p>We break patterns and open pathways to exploration, creativity, and impact beyond the everyday.</p>
          </div>
        </div>
      </section>

      {/* Values */}
      <section className="section_3">
        <div className="container">
          <div className="values-wrapper">
            <div className="center-word">VALUES</div>
            {[
              { title: 'Nurture',    body: 'Nurture the growth of people to enhance the quality of life and the environment.' },
              { title: 'Freedom',    body: 'Inspire people to seize the freedom they have and create the freedom they want.' },
              { title: 'Connection', body: 'Facilitate connection with people to each other and their environment.' },
              { title: 'Dreamers',   body: 'Kick start dreams and open doors for dreamers.' },
              { title: 'Challenge',  body: 'Challenge norms and challenge people to step outside their comfort zone.' },
            ].map((v, i) => (
              <div key={v.title} className={`value value-${i + 1}`}>
                <div className="value-content">
                  <h4>{v.title}</h4>
                  <p>{v.body}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="cta">
        <div className="container">
          <h3>Want to Work Together?</h3>
          <p>Invite the visitor to do one clear thing.</p>
          <Link href="/contact" className="btn-secondary">Get in Touch</Link>
        </div>
      </section>
    </>
  )
}
