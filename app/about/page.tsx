import type { Metadata } from 'next'
import Image from 'next/image'

export const metadata: Metadata = { title: 'About' }

export default function AboutPage() {
  return (
    <div className="page-theme page-theme--about">
      <section className="logo-hero logo-hero--about">
        <Image
          src="/images/Kitea Logo Only.png"
          alt="Kitea logo"
          width={400}
          height={400}
          priority
          style={{ objectFit: 'contain', width: 'auto' }}
        />
      </section>

      <section className="section_1 section_1--about">
        <div className="container">
          <h2>What is Kitea</h2>
          <p>Adventure clothing that unlocks stories.</p>
        </div>
      </section>

      {/* 3 Buckets */}
      <section className="about-buckets">
        <div className="container">
          <div className="bucket-grid">
            <div className="bucket">
              <h3>Who</h3>
              <p>Kitea is for the curious — the explorers, the dreamers, the people who believe that every journey holds a story worth telling. We&apos;re built for those who move through the world with intention and wonder.</p>
            </div>
            <div className="bucket">
              <h3>What</h3>
              <p>We create adventure clothing embedded with NFC technology. Each piece connects to a real-world experience — scan a tag, earn a digital collectible, unlock exclusive items, and become part of something bigger.</p>
            </div>
            <div className="bucket">
              <h3>Why</h3>
              <p>Because clothing should be more than fabric. We believe in the power of shared journeys to build connection — between people, places, and the stories that shape us. Kitea is a platform for that connection.</p>
            </div>
          </div>
        </div>
      </section>

      {/* Vision — moved from home */}
      <section className="section_2 about-vision">
        <div className="container">
          <h2>Vision</h2>
          <div className="vision-text">
            <p>A world where clothing empowers people to step into stories bigger than themselves.</p>
            <p>Where every journey deepens our connection to each other, the planet, and the stories that shaped us.</p>
            <p>We exist because curiosity and connection move us forward.</p>
            <p>By transforming branding and technology into a platform for storytelling,</p>
            <p>We break patterns and open pathways to exploration, creativity, and impact beyond the everyday.</p>
          </div>
        </div>
      </section>

      {/* Narrative */}
      <section className="about-narrative">
        <div className="container">
          <h2>Our Narrative</h2>
          <div className="narrative-text">
            <p>It started with a simple idea: what if your clothing could take you somewhere?</p>
            <p>Not just in style, but in experience — adventures that begin the moment you put on a Kitea piece and step out the door.</p>
            <p>We built Kitea at the intersection of fashion, technology, and storytelling. Every garment is a gateway. Every scan is a step forward. Every collection tells a chapter of a larger story that&apos;s still being written — by you.</p>
            <p>We&apos;re not just making clothes. We&apos;re building a community of people who believe that life is better when it&apos;s lived as an adventure.</p>
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
    </div>
  )
}
