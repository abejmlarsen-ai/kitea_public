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
}

export default function HuntsClient({ locations }: Props) {
  return (
    <div className="page-theme page-theme--map" style={{ padding: '2rem' }}>
      <MapComponent locations={locations} />
    </div>
  )
}
