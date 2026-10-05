// ─── Opportunities Section ─────────────────────────────────────────────────────
// Rendered on /opportunities. Styles live in globals.css (.opportunities-section).

export default function OpportunitiesSection() {
  return (
    <section className="opportunities-section">
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
  )
}
