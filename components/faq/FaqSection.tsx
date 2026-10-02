// ─── FAQ Section ───────────────────────────────────────────────────────────────
// Rendered on /faq. Styles live in globals.css (.faq-section).

export default function FaqSection() {
  return (
    <section className="faq-section">
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
  )
}
