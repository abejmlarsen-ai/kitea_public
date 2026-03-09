'use client'

import dynamic from 'next/dynamic'

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

interface Props {
  locations: Location[]
  userId: string | null
  progressList: {
    hunt_location_id: string
    current_question_index: number
    location_revealed: boolean
    completed_at: string | null
  }[]
}

export default function HuntsClient({ locations }: Props) {
  return (
    <div style={{ background: '#f1faee', minHeight: '100vh' }}>
      <MapComponent locations={locations} />
    </div>
  )
}
