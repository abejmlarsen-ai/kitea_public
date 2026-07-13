'use client'

import dynamic from 'next/dynamic'

const MapComponent = dynamic(() => import('./MapComponent'), { ssr: false })

interface Location {
  id: string
  name: string
  description: string | null
  latitude: number | null
  longitude: number | null
  total_scans: number | null
  region: string | null
  city: string | null
}

interface Props {
  locations: Location[]
  scannedLocationIds: string[]
}

export default function HuntsClient({ locations, scannedLocationIds }: Props) {
  return (
    <div className="page-theme page-theme--map" style={{ padding: '2rem', paddingTop: '6.5rem' }}>
      <MapComponent locations={locations} scannedLocationIds={scannedLocationIds} />
    </div>
  )
}
