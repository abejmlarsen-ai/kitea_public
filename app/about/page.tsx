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
          <h2>Our Story</h2>
          <div className="narrative-text">
            <p>This brand started from a feeling. A feeling of being lost, uninspired by the monotony of daily routine. An internal search for purpose and a community to feel at home in was not so easily located in a world that is so overconnected it is disconnected. We are all living in the same world, yet oblivious to one another, oblivious to our environment, oblivious to our history, and losing our culture.</p>
            <p>A brand cannot reconnect communities and inspire people all on its own, but it can provide a platform that challenges people to break routines — to go somewhere they would not normally go, to learn something new, or to plant the seed of a dream. It can facilitate a conversation and connect people across borders and barriers. That platform is our business model: clothing and design as a gateway into stories, experiences, and community.And it lives through our values: </p>
            <p>We nurture growth by building experiences that enrich both people and place. Our products unlock journeys that deepen connection to culture, history, and environment — planting seeds of curiosity that grow into knowledge and action. Through the creation of opportunities for ongoing sustainable choices, we nurture the planet as well.</p>
            <p>Unlock your freedom. Every moment is an invitation to step beyond the ordinary. By tying KITEA to discovery, we remind people to recognise the freedom they already have — to move, to explore, to create. And with each challenge comes new freedoms: of thought, of imagination, of possibility.</p>
            <p> In a world that can sometimes be isolating, KITEA and the experience behind it breaks down walls to connection. Sharing discoveries brings people together — with each other, with their communities, and with the environments they pass through. In a disconnected world, we turn experiences into threads of reconnection.</p>
            <p> KITEA exists to kickstart dreams. By embedding hidden stories in everyday moments we spark imaginations and open doors to adventure. KITEA facilitates that one small step, plants that on little seed of a dream. The seed may be small but once planted it can take you anywhere. </p>
            <p> KITEA is built to challenge — to challenge the routine that numbs us to the beauty of the world around us, the habits that null curiosity and the fear of change. Each moment is an opportunity and KITEA aims to nudge people outside their comfort zone, where growth and transformation live.</p>
            <p> This brand is more than clothing. It is a catalyst — a way to nurture growth, inspire freedom, foster connection, ignite dreams, and challenge the ordinary. Through our business model, every garment becomes a gateway: not to more consumption, but to more life. </p>
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
