// ─── Site Footer ────────────────────────────────────────────────────────────────────────────────────
// Per-page theming is handled in globals.css via body:has(.page-theme--X)

export default function Footer() {
  return (
    <footer className="site-footer" style={{ background: '#FFFFFF', color: '#0B2838' }}>
      <div className="footer-inner">
        <div className="footer-social">
          <a
            href="https://www.instagram.com/kitea_ao/"
            target="_blank"
            rel="noopener noreferrer"
            className="footer-social-link"
            aria-label="Kitea on Instagram"
            style={{ color: '#0B2838', opacity: 1 }}
          >
            {/* Instagram SVG icon */}
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" style={{ color: '#0B2838' }}>
              <rect x="2" y="2" width="20" height="20" rx="5" ry="5"/>
              <circle cx="12" cy="12" r="4"/>
              <circle cx="17.5" cy="6.5" r="1" fill="currentColor" stroke="none"/>
            </svg>
            <span>Instagram</span>
          </a>
        </div>

        <p className="footer-copy" style={{ color: '#0B2838', opacity: 1 }}>© 2026 Kitea Ao. All rights reserved.</p>

        <nav className="footer-nav" aria-label="Footer navigation">
          <a href="/about" style={{ color: '#0B2838', opacity: 1 }}>About</a>
          <a href="/our-story" style={{ color: '#0B2838', opacity: 1 }}>Our Story</a>
          <a href="mailto:kiteaao@gmail.com" style={{ color: '#0B2838', opacity: 1 }}>Contact</a>
        </nav>
      </div>
    </footer>
  )
}
