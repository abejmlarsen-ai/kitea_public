'use client'

import { useEffect, useRef, useState } from 'react'
import dynamic from 'next/dynamic'
import Link from 'next/link'

interface Props {
  locations: { id: string; name: string; description: string; latitude: number; longitude: number; total_scans: number }[]
  userId: string | null
  progressList: { hunt_location_id: string; current_question_index: number; location_revealed: boolean; completed_at: string | null }[]
}

interface MapInnerProps {
  locations: Props['locations']
  center: [number, number]
}

const HuntsMap = dynamic<MapInnerProps>(
  async () => {
    const { MapContainer, TileLayer, CircleMarker, Popup } = await import('react-leaflet')
    const L = (await import('leaflet')).default
    // @ts-ignore – plain CSS import handled by bundler, no type declaration needed
    await import('leaflet/dist/leaflet.css')

    return function HuntsMapInner({ locations, center }: MapInnerProps) {
      return (
        <MapContainer
          center={center}
          zoom={13}
          style={{ height: '300px', width: '100%' }}
        >
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
          {locations.map(loc => (
            <CircleMarker
              key={loc.id}
              center={[loc.latitude, loc.longitude]}
              radius={10}
              pathOptions={{ color: '#C9A84C', fillColor: '#C9A84C', fillOpacity: 0.8 }}
              eventHandlers={{
                click: () => {
                  document.getElementById(`hunt-${loc.id}`)?.scrollIntoView({ behavior: 'smooth' })
                },
              }}
            >
              <Popup>{loc.name}</Popup>
            </CircleMarker>
          ))}
        </MapContainer>
      )
    }
  },
  { ssr: false }
)

export default function HuntsClient({ locations, userId, progressList }: Props) {
  const center: [number, number] =
    locations.length > 0
      ? [locations[0].latitude, locations[0].longitude]
      : [-36.8485, 174.7633]

  return (
    <div style={{ background: '#111', minHeight: '100vh' }}>
      <HuntsMap locations={locations} center={center} />

      <div className="hunts-section">
        <h2 className="hunts-section-heading">Available Hunts</h2>

        {locations.map(loc => {
          const progress = progressList.find(p => p.hunt_location_id === loc.id)
          const isCompleted  = !!progress?.completed_at
          const isInProgress = !isCompleted && (progress?.current_question_index ?? 0) > 0

          const badgeLabel = isCompleted ? 'Completed' : isInProgress ? 'In Progress' : 'Not Started'
          const badgeMod   = isCompleted ? 'completed'  : isInProgress ? 'in-progress'  : 'not-started'

          return (
            <div key={loc.id} id={`hunt-${loc.id}`} className="hunts-card">
              <h3 className="hunts-card-name">{loc.name}</h3>
              <p className="hunts-card-meta">{loc.total_scans} explorers</p>
              <span className={`hunts-card-badge hunts-card-badge--${badgeMod}`}>
                {badgeLabel}
              </span>

              <div className="hunts-card-action">
                {userId !== null ? (
                  <Link href={`/hunts/${loc.id}`} className="hunt-btn-link">
                    Begin Hunt
                  </Link>
                ) : (
                  <p className="hunts-card-signin">
                    <Link href="/login">Sign in to begin</Link>
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
