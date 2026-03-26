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
        </div>
      </section>

      {/* 3 Buckets */}
      <section className="about-buckets">
        <div className="container">
          <div className="bucket-grid">
            <div className="bucket">
              <h3>Why Kitea</h3>
              <p> Kitea comes from the NZ native language of Te Reo Maori and is the passive form of the verb kite, which means to see, perceive, or find. So kitea is usually translated as seen, found or discovered. Kitea can also mean; to have something revealed, to be found after being hidden, to become known or perceived.</p>
              <p> He tangata kite nui, he tangata whakaaro nui."  ~ A person who sees much is a person of great understanding.</p>
            </div>
            <div className="bucket">
              <h3>What Does this mean to me?</h3>
              <p> To me this represents not only finding the answer but the idea of finding a purpose, finding a connection and finding the inspiration to dream. To find something means it has to be lost in the first place. KITEA represents a means to helping people find something they are missing. Be that energy, connection or a break from routine.</p>
            </div>
            <div className="bucket">
              <h3> Kitea Ao</h3>
              <p> Kitea Ao takes the meaning one step further adding the Te Reo Maori word Ao, meaning world. This not only speaks to the aim to share this vision with the whole world but also links to the idea of exploring the big wide world and the limitless stories within it.</p>
            </div>
          </div>
        </div>
      </section>

      {/* Vision */}
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
