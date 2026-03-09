'use client'

import 'leaflet/dist/leaflet.css'
import L from 'leaflet'
import React, { useEffect, useState } from 'react'
import { MapContainer, TileLayer, Marker, Popup, Circle, useMap } from 'react-leaflet'

const kiteaIcon = L.icon({
  iconUrl: '/images/Kitea Logo Only.png',
  iconSize: [36, 36],
  iconAnchor: [18, 18],
  popupAnchor: [0, -20],
})

const REGIONS = [
  {
    label: 'Australia',
    centre: [-25.2744, 133.7751] as [number, number],
    zoom: 4,
    cities: [
      { label: 'Sydney',    centre: [-33.8688, 151.2093] as [number, number], zoom: 13 },
      { label: 'Melbourne', centre: [-37.8136, 144.9631] as [number, number], zoom: 13 },
      { label: 'Brisbane',  centre: [-27.4698, 153.0251] as [number, number], zoom: 13 },
    ],
  },
  {
    label: 'New Zealand',
    centre: [-40.9006, 172.8860] as [number, number],
    zoom: 5,
    cities: [
      { label: 'Auckland',   centre: [-36.8485, 174.7633] as [number, number], zoom: 13 },
      { label: 'Wellington', centre: [-41.2865, 174.7762] as [number, number], zoom: 13 },
    ],
  },
]

interface FlyProps {
  centre: [number, number]
  zoom: number
  trigger: number
}

function FlyTo({ centre, zoom, trigger }: FlyProps) {
  const map = useMap()
  useEffect(() => {
    if (trigger > 0) map.flyTo(centre, zoom, { duration: 1.2 })
  }, [trigger]) // eslint-disable-line react-hooks/exhaustive-deps
  return null
}

interface Location {
  id: string
  name: string
  latitude: number
  longitude: number
  total_scans: number
}

interface Props {
  locations: Location[]
}

export default function MapComponent({ locations }: Props) {
  const [flyTarget, setFlyTarget] = useState<{ centre: [number, number]; zoom: number; trigger: number } | null>(null)
  const [expandedRegion, setExpandedRegion] = useState<string | null>(null)

  const handleRegion = (region: typeof REGIONS[0]) => {
    const isOpen = expandedRegion === region.label
    setExpandedRegion(isOpen ? null : region.label)
    setFlyTarget((prev) => ({
      centre: region.centre,
      zoom: region.zoom,
      trigger: (prev?.trigger ?? 0) + 1,
    }))
  }

  const handleCity = (city: typeof REGIONS[0]['cities'][0]) => {
    setFlyTarget((prev) => ({
      centre: city.centre,
      zoom: city.zoom,
      trigger: (prev?.trigger ?? 0) + 1,
    }))
  }

  return (
    <div style={{
      display: 'grid',
      gridTemplateColumns: '200px 1fr 200px',
      gap: '0',
      width: '100%',
      height: '72vh',
      alignItems: 'start',
    }}>

      {/* Left sidebar — regions */}
      <div style={{
        paddingTop: '0',
        paddingRight: '1rem',
      }}>
        <p style={{
          fontSize: '11px',
          fontWeight: 700,
          letterSpacing: '0.08em',
          color: '#457b9d',
          marginBottom: '0.75rem',
          textTransform: 'uppercase',
        }}>
          Regions
        </p>

        {REGIONS.map((region) => (
          <div key={region.label} style={{ marginBottom: '0.5rem' }}>
            <button
              onClick={() => handleRegion(region)}
              style={{
                width: '100%',
                textAlign: 'left',
                padding: '0.5rem 1rem',
                background: expandedRegion === region.label ? '#2a9d8f' : '#e8f4f1',
                color: expandedRegion === region.label ? 'white' : '#1d3557',
                border: 'none',
                borderRadius: '20px',
                cursor: 'pointer',
                fontSize: '14px',
                fontWeight: 600,
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                transition: 'background 0.2s',
              }}
            >
              {region.label}
              <span style={{ fontSize: '10px', opacity: 0.7 }}>
                {expandedRegion === region.label ? '▼' : '►'}
              </span>
            </button>

            {expandedRegion === region.label && (
              <div style={{ paddingLeft: '0.5rem', marginTop: '0.25rem' }}>
                {region.cities.map((city) => (
                  <button
                    key={city.label}
                    onClick={() => handleCity(city)}
                    style={{
                      width: '100%',
                      textAlign: 'left',
                      padding: '0.4rem 1rem',
                      background: '#f1faee',
                      color: '#457b9d',
                      border: 'none',
                      borderRadius: '20px',
                      cursor: 'pointer',
                      fontSize: '13px',
                      marginBottom: '0.2rem',
                      transition: 'background 0.2s',
                    }}
                  >
                    · {city.label}
                  </button>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Centre — map */}
      <div style={{
        height: '72vh',
        borderRadius: '12px',
        overflow: 'hidden',
        boxShadow: '0 4px 20px rgba(0,0,0,0.1)',
      }}>
        <MapContainer
          center={[-33.8688, 151.2093]}
          zoom={11}
          style={{ height: '100%', width: '100%' }}
          scrollWheelZoom={true}
        >
          <TileLayer
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            attribution="&copy; OpenStreetMap contributors"
          />

          {flyTarget && (
            <FlyTo
              centre={flyTarget.centre}
              zoom={flyTarget.zoom}
              trigger={flyTarget.trigger}
            />
          )}

          {locations.map((loc) => (
            <React.Fragment key={loc.id}>
              <Circle
                center={[Number(loc.latitude), Number(loc.longitude)]}
                radius={250}
                pathOptions={{
                  color: '#2a9d8f',
                  fillColor: 'transparent',
                  fillOpacity: 0,
                  weight: 2,
                  dashArray: '4 4',
                }}
              />
              <Marker
                position={[Number(loc.latitude), Number(loc.longitude)]}
                icon={kiteaIcon}
              >
                <Popup>
                  <div style={{
                    textAlign: 'center',
                    minWidth: '160px',
                    padding: '8px 4px',
                    fontFamily: 'Arial, sans-serif',
                  }}>
                    <strong style={{
                      display: 'block',
                      fontSize: '16px',
                      color: '#1d3557',
                      marginBottom: '4px',
                    }}>
                      {loc.name}
                    </strong>
                    <span style={{
                      display: 'block',
                      fontSize: '12px',
                      color: '#888',
                      marginBottom: '12px',
                    }}>
                      {loc.total_scans} explorers
                    </span>
                    <a
                      href={`/hunts/${loc.id}`}
                      style={{
                        display: 'inline-block',
                        padding: '8px 20px',
                        background: '#2a9d8f',
                        color: 'white',
                        borderRadius: '5px',
                        textDecoration: 'none',
                        fontSize: '14px',
                        fontWeight: 600,
                      }}
                    >
                      Begin Hunt →
                    </a>
                  </div>
                </Popup>
              </Marker>
            </React.Fragment>
          ))}
        </MapContainer>
      </div>

      {/* Right — empty balance column */}
      <div />

    </div>
  )
}
