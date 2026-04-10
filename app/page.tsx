// ─── Root Page ────────────────────────────────────────────────────────────────────────────
import type { Metadata } from 'next'
import Link from 'next/link'

export const metadata: Metadata = { title: 'Kitea' }

export default function HomePage() {
  return (
    <div className="page-theme page-theme--home">
      <section
        className="section_1 section_1--home"
        style={{
          minHeight:      '100vh',
          display:        'flex',
          alignItems:     'center',
          justifyContent: 'center',
        }}
      >
        <div
          className="container"
          style={{
            display:        'flex',
            flexDirection:  'column',
            alignItems:     'center',
            justifyContent: 'center',
            textAlign:      'center',
            gap:            '0.25rem',
          }}
        >
          <h2>Kitea</h2>
          <p style={{ margin: 0 }}>Inspire adventure and connection through stories and shared journeys.</p>
        </div>
      </section>
    </div>
  )
}
