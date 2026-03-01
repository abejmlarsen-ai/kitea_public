// ─── Site Footer ────────────────────────────────────────────────────────────────────────────────────
// Per-page theming is handled in globals.css via body:has(.page-theme--X)

export default function Footer() {
  return (
    <footer className="site-footer">
      <div className="footer-inner">
        <div className="footer-social">
          <a
            href="https://www.instagram.com/kitea_ao/"
            target="_blank"
            rel="noopener noreferrer"
            className="footer-social-link"
            aria-label="Kitea on Instagram"
          >
            {/* Instagram SVG icon */}
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <rect x="2" y="2" width="20" height="20" rx="5" ry="5"/>
              <circle cx="12" cy="12" r="4"/>
              <circle cx="17.5" cy="6.5" r="1" fill="currentColor" stroke="none"/>
            </svg>
            <span>Instagram</span>
          </a>
        </div>

        <p className="footer-copy">© 2026 Kitea. All rights reserved.</p>

        <nav className="footer-nav" aria-label="Footer navigation">
          <a href="/contact">Contact</a>
        </nav>
      </div>
    </footer>
  )
}
