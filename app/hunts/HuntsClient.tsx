'use client'

import { useEffect, useRef, useState } from 'react'
import dynamic from 'next/dynamic'
import Link from 'next/link'

const MapComponent = dynamic(() => import('./MapComponent'), { ssr: false })

interface Props {
  locations: { id: string; name: string; description: string; latitude: number; longitude: number; total_scans: number }[]
  userId: string | null
  progressList: { hunt_location_id: string; current_question_index: number; location_revealed: boolean; completed_at: string | null }[]
}

export default function HuntsClient({ locations, userId, progressList }: Props) {
  return (
    <div style={{ background: '#111', minHeight: '100vh' }}>
      <MapComponent
        locations={locations}
        onMarkerClick={(id) => document.getElementById(`hunt-${id}`)?.scrollIntoView({ behavior: 'smooth' })}
      />

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
