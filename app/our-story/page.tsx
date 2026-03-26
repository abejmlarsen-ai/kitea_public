import type { Metadata } from 'next'
import Image from 'next/image'

export const metadata: Metadata = { title: 'Our Story' }

export default function OurStoryPage() {
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
          <h2>Our Story</h2>
        </div>
      </section>

      <section className="about-narrative">
        <div className="container">
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
    </div>
  )
}
