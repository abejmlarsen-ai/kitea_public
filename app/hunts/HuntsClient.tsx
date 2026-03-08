'use client'

import dynamic from 'next/dynamic'
import Link from 'next/link'

const MapComponent = dynamic(() => import('./MapComponent'), { ssr: false })

// ── Types ─────────────────────────────────────────────────────────────────────
interface Props {
  locations: {
    id:          string
    name:        string
    description: string
    latitude:    number
    longitude:   number
    total_scans: number
    region:      string
    city:        string
  }[]
  userId: string | null
  progressList: {
    hunt_location_id:       string
    current_question_index: number
    location_revealed:      boolean
    completed_at:           string | null
  }[]
}

export default function HuntsClient({ locations, userId, progressList }: Props) {
  return (
    <div style={{ background: '#f1faee', minHeight: '100vh', color: '#1d3557' }}>

      {/* Map — full width, markers link to /hunts/[id] via Popup */}
      <MapComponent
        locations={locations}
        onMarkerClick={(id) =>
          document.getElementById(`hunt-${id}`)?.scrollIntoView({ behavior: 'smooth' })
        }
      />

      {/* ── Hunt cards ──────────────────────────────────────────────────── */}
      <div style={{ padding: '2rem 1rem', maxWidth: '800px', margin: '0 auto' }}>

        <h2 style={{ fontSize: '1.5rem', fontWeight: 700, color: '#1d3557', margin: '0 0 0.4rem' }}>
          Available Hunts
        </h2>
        <p style={{ color: '#457b9d', fontSize: '0.95rem', margin: '0 0 1.5rem' }}>
          Tap a marker on the map to begin your hunt
        </p>

        {locations.map(loc => {
          const progress    = progressList.find(p => p.hunt_location_id === loc.id)
          const isCompleted  = !!progress?.completed_at
          const isInProgress = !isCompleted && (progress?.current_question_index ?? 0) > 0

          const badgeLabel = isCompleted ? 'Completed' : isInProgress ? 'In Progress' : 'Not Started'

          const badgeStyle: React.CSSProperties = isCompleted
            ? { background: '#2a9d8f', color: 'white' }
            : isInProgress
            ? { background: '#e9c46a', color: '#1d3557' }
            : { background: '#e0e0e0', color: '#888' }

          return (
            <div
              key={loc.id}
              id={`hunt-${loc.id}`}
              style={{
                background:   'white',
                borderLeft:   '4px solid #2a9d8f',
                borderRadius: '8px',
                boxShadow:    '0 2px 8px rgba(0,0,0,0.08)',
                padding:      '1rem 1.25rem',
                marginBottom: '1rem',
              }}
            >
              <h3 style={{ margin: '0 0 0.2rem', fontSize: '1.1rem', fontWeight: 600, color: '#1d3557' }}>
                {loc.name}
              </h3>

              <p style={{ margin: '0 0 0.65rem', fontSize: '0.82rem', color: '#888' }}>
                {loc.total_scans} explorers
              </p>

              <span style={{
                display:      'inline-block',
                padding:      '0.2rem 0.65rem',
                borderRadius: '99px',
                fontSize:     '0.75rem',
                fontWeight:   600,
                marginBottom: '0.75rem',
                ...badgeStyle,
              }}>
                {badgeLabel}
              </span>

              <div>
                {userId !== null ? (
                  <Link
                    href={`/hunts/${loc.id}`}
                    style={{
                      display:        'inline-block',
                      background:     '#2a9d8f',
                      color:          'white',
                      padding:        '0.5rem 1.25rem',
                      borderRadius:   '6px',
                      textDecoration: 'none',
                      fontSize:       '0.9rem',
                      fontWeight:     600,
                    }}
                  >
                    Begin Hunt
                  </Link>
                ) : (
                  <p style={{ margin: 0, fontSize: '0.85rem', color: '#888' }}>
                    <Link href='/login' style={{ color: '#2a9d8f' }}>Sign in to begin</Link>
                  </p>
                )}
              </div>
            </div>
          )
        })}

      </div>
    </div>
  )
}
