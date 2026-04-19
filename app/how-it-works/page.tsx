import type { Metadata } from 'next'

export const metadata: Metadata = { title: 'How It Works' }

export default function HowItWorksPage() {
  return (
    <div className="page-theme page-theme--hiw">
      <section className="section_1 section_1--hiw">
        <div className="container">
          <h2>How It Works</h2>
          <p>Six simple steps to unlock your adventure.</p>
        </div>
      </section>

      {/* Flow Diagram */}
      <section className="hiw-flow">
        <div className="container">
          <div className="hiw-step-flow">
            <div className="hiw-step-box">
              <div className="hiw-step-num">01</div>
              <div className="hiw-step-text">Login to your Kitea Account</div>
            </div>
            <div className="hiw-step-arrow" aria-hidden="true">→</div>
            <div className="hiw-step-box">
              <div className="hiw-step-num">02</div>
              <div className="hiw-step-text">Select a Hunt</div>
            </div>
            <div className="hiw-step-arrow" aria-hidden="true">→</div>
            <div className="hiw-step-box">
              <div className="hiw-step-num">03</div>
              <div className="hiw-step-text">Solve the clue to find and scan the Kitea tag</div>
            </div>
            <div className="hiw-step-arrow" aria-hidden="true">→</div>
            <div className="hiw-step-box">
              <div className="hiw-step-num">04</div>
              <div className="hiw-step-text">Check your Library for your hunt collectible and view your collection</div>
            </div>
            <div className="hiw-step-arrow" aria-hidden="true">→</div>
            <div className="hiw-step-box">
              <div className="hiw-step-num">05</div>
              <div className="hiw-step-text">Unlock the ability to purchase the hunt related merch in your personalised shop</div>
            </div>
            <div className="hiw-step-arrow" aria-hidden="true">→</div>
            <div className="hiw-step-box">
              <div className="hiw-step-num">06</div>
              <div className="hiw-step-text">Repeat</div>
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
                <li>Collect unique collectibles tied to real locations</li>
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
                <li>Drive foot traffic to physical locations with tag hunts</li>
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
              <p>NFC (Near Field Communication) tags are tiny chips embedded in our garments. When you tap your smartphone near one, it triggers an action — in Kitea&apos;s case, it records your visit and earns you a collectible.</p>
            </details>
            <details className="faq-item">
              <summary>Do I need an account to collect?</summary>
              <p>No special setup needed. Kitea automatically manages your collection when you sign up. Your collectibles are stored securely in your account.</p>
            </details>
            <details className="faq-item">
              <summary>What is a Kitea collectible?</summary>
              <p>A Kitea collectible is a unique digital certificate that proves you completed a real-world adventure. Each one is permanently recorded and yours forever.</p>
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
