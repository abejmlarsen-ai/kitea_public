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
    <div style={{
      background: '#f1faee',
      minHeight: '100vh',
      padding: '2rem 2rem 2rem 2rem',
    }}>
      <h1 style={{
        fontFamily:    'var(--font-heading, inherit)',
        fontSize:      '1.6rem',
        fontWeight:    700,
        color:         '#1d3557',
        marginBottom:  '1rem',
        letterSpacing: '0.04em',
      }}>
        Regions
      </h1>
      <MapComponent locations={locations} />
    </div>
  )
}
