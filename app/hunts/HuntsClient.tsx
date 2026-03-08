'use client'

import dynamic from 'next/dynamic'
import Link from 'next/link'

const MapComponent = dynamic(() => import('./MapComponent'), { ssr: false })

interface Location {
  id: string
  name: string
  description: string
  latitude: number
  longitude: number
  total_scans: number
  region: string
  city: string
}

interface Progress {
  hunt_location_id: string
  current_question_index: number
  location_revealed: boolean
  completed_at: string | null
}

interface Props {
  locations: Location[]
  userId: string | null
  progressList: Progress[]
}

export default function HuntsClient({ locations, userId, progressList }: Props) {
  return (
    <div style={{ background: '#f1faee', minHeight: '100vh', color: '#1d3557' }}>

      <MapComponent locations={locations} />

      <div style={{ padding: '2rem 1rem', maxWidth: '860px', margin: '0 auto' }}>

        <p style={{
          textAlign: 'center',
          color: '#457b9d',
          fontSize: '15px',
          marginBottom: '1.5rem',
          letterSpacing: '0.02em',
        }}>
          Tap a marker on the map to begin your hunt
        </p>

        {locations.length === 0 && (
          <p style={{ textAlign: 'center', color: '#888' }}>
            No hunts available yet. Check back soon.
          </p>
        )}

        {locations.map((loc) => {
          const prog = progressList.find((p) => p.hunt_location_id === loc.id)
          const isCompleted = !!prog?.completed_at
          const isInProgress = !isCompleted && (prog?.current_question_index ?? 0) > 0

          const badgeLabel = isCompleted
            ? 'Completed'
            : isInProgress
            ? 'In Progress'
            : 'Not Started'

          const badgeBg = isCompleted
            ? '#2a9d8f'
            : isInProgress
            ? '#e9c46a'
            : '#e0e0e0'

          const badgeColor = isCompleted
            ? 'white'
            : isInProgress
            ? '#1d3557'
            : '#888'

          return (
            <div
              key={loc.id}
              id={`hunt-${loc.id}`}
              style={{
                background: 'white',
                borderLeft: '4px solid #2a9d8f',
                borderRadius: '8px',
                boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
                padding: '1rem 1.25rem',
                marginBottom: '1rem',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                flexWrap: 'wrap',
                gap: '0.75rem',
              }}
            >
              <div>
                <h3 style={{ margin: 0, fontSize: '18px', color: '#1d3557' }}>
                  {loc.name}
                </h3>
                <p style={{ margin: '4px 0 0', fontSize: '13px', color: '#888' }}>
                  {loc.total_scans} explorers · {loc.city}, {loc.region}
                </p>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                <span style={{
                  background: badgeBg,
                  color: badgeColor,
                  borderRadius: '20px',
                  padding: '3px 12px',
                  fontSize: '12px',
                  fontWeight: 600,
                }}>
                  {badgeLabel}
                </span>

                {userId !== null ? (
                  <Link
                    href={`/hunts/${loc.id}`}
                    style={{
                      display: 'inline-block',
                      padding: '7px 18px',
                      background: '#2a9d8f',
                      color: 'white',
                      borderRadius: '5px',
                      textDecoration: 'none',
                      fontSize: '14px',
                      fontWeight: 600,
                    }}
                  >
                    Begin Hunt
                  </Link>
                ) : (
                  <Link
                    href="/login"
                    style={{
                      display: 'inline-block',
                      padding: '7px 18px',
                      background: '#457b9d',
                      color: 'white',
                      borderRadius: '5px',
                      textDecoration: 'none',
                      fontSize: '14px',
                    }}
                  >
                    Sign in to begin
                  </Link>
                )}
              </div>
            </div>
          )
        })}

      </div>
    </div>
  )
}
