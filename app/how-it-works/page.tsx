import type { Metadata } from 'next'
import Image from 'next/image'

export const metadata: Metadata = { title: 'How It Works' }

export default function HowItWorksPage() {
  return (
    <div className="page-theme page-theme--hiw">
      <section className="logo-hero logo-hero--hiw">
        <Image
          src="/images/Kitea Logo Only.png"
          alt="Kitea logo"
          width={400}
          height={400}
          priority
          style={{ objectFit: 'contain', width: 'auto' }}
        />
      </section>

      <section className="section_1 section_1--hiw">
        <div className="container">
          <h2>How It Works</h2>
          <p>Five simple steps to unlock your adventure.</p>
        </div>
      </section>

      {/* Flow Diagram */}
      <section className="hiw-flow">
        <div className="container">
          <div className="flow-steps">
            <div className="flow-step">
              <div className="flow-step-number">01</div>
              <div className="flow-step-icon">👕</div>
              <h3>Get Your Kitea</h3>
              <p>Purchase a Kitea garment. Each piece is embedded with a unique NFC tag linked to your adventure.</p>
            </div>
            <div className="flow-connector">→</div>
            <div className="flow-step">
              <div className="flow-step-number">02</div>
              <div className="flow-step-icon">📱</div>
              <h3>Scan the Tag</h3>
              <p>Visit a Kitea hunt location and tap your phone to the NFC tag hidden at the site.</p>
            </div>
            <div className="flow-connector">→</div>
            <div className="flow-step">
              <div className="flow-step-number">03</div>
              <div className="flow-step-icon">✨</div>
              <h3>Earn an NFT</h3>
              <p>A unique digital collectible is minted to your Kitea wallet — proof of your adventure.</p>
            </div>
            <div className="flow-connector">→</div>
            <div className="flow-step">
              <div className="flow-step-number">04</div>
              <div className="flow-step-icon">🔓</div>
              <h3>Unlock Items</h3>
              <p>Completing hunts unlocks exclusive merchandise and experiences in the Kitea shop.</p>
            </div>
            <div className="flow-connector">→</div>
            <div className="flow-step">
              <div className="flow-step-number">05</div>
              <div className="flow-step-icon">🌍</div>
              <h3>Join the Community</h3>
              <p>Become part of a growing community of adventurers sharing stories from around the world.</p>
            </div>
          </div>
        </div>
      </section>

      {/* Opportunities */}
      <section className="hiw-opportunities">
        <div className="container">
          <h2>Opportunities</h2>
          <div className="opportunity-grid">
            <div className="opportunity-card opportunity-card--people">
              <h3>For Adventurers</h3>
              <ul>
                <li>Collect unique NFTs tied to real locations</li>
                <li>Unlock exclusive merchandise by completing hunts</li>
                <li>Build a digital record of your adventures</li>
                <li>Connect with a community of like-minded explorers</li>
                <li>Discover hidden locations across cities and beyond</li>
              </ul>
            </div>
            <div className="opportunity-card opportunity-card--business">
              <h3>For Businesses</h3>
              <ul>
                <li>Create branded adventure experiences for your audience</li>
                <li>Drive foot traffic to physical locations with NFC hunts</li>
                <li>Build customer loyalty through collectible rewards</li>
                <li>Partner on limited-edition Kitea collections</li>
                <li>Access analytics on engagement and adventure completions</li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* FAQs */}
      <section className="hiw-faqs">
        <div className="container">
          <h2>Frequently Asked Questions</h2>
          <div className="faq-list">
            <details className="faq-item">
              <summary>What is an NFC tag?</summary>
              <p>NFC (Near Field Communication) tags are tiny chips embedded in our garments. When you tap your smartphone near one, it triggers an action — in Kitea&apos;s case, it records your visit and mints your NFT.</p>
            </details>
            <details className="faq-item">
              <summary>Do I need a crypto wallet?</summary>
              <p>No. Kitea automatically creates and manages a digital wallet for you when you sign up. Your NFTs are stored securely without you needing any crypto knowledge.</p>
            </details>
            <details className="faq-item">
              <summary>What is an NFT?</summary>
              <p>An NFT (Non-Fungible Token) is a unique digital certificate stored on the blockchain. Your Kitea NFTs prove you completed a real-world adventure and are yours forever.</p>
            </details>
            <details className="faq-item">
              <summary>How do I scan the tag?</summary>
              <p>Most modern smartphones support NFC scanning natively. Simply open your camera app or NFC scanning feature, hold your phone near the Kitea tag, and follow the link.</p>
            </details>
            <details className="faq-item">
              <summary>Where are the hunt locations?</summary>
              <p>Check the Map page to see all active Kitea hunt locations. We&apos;re expanding to new cities and countries regularly — sign up to stay updated.</p>
            </details>
            <details className="faq-item">
              <summary>Can businesses get involved?</summary>
              <p>Absolutely. We work with brands and businesses to create custom adventure experiences. Get in touch through our contact page to explore partnership opportunities.</p>
            </details>
          </div>
        </div>
      </section>
    </div>
  )
}
