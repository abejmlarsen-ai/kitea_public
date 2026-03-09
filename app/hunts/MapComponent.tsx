'use client'

import 'leaflet/dist/leaflet.css'
import React, { useEffect, useState } from 'react'
import L from 'leaflet'
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
    zoom: 5,
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

interface Location {
  id: string
  name: string
  latitude: number
  longitude: number
  total_scans: number
}

interface FlyProps {
  centre: [number, number]
  zoom: number
}

function FlyTo({ centre, zoom }: FlyProps) {
  const map = useMap()
  useEffect(() => {
    map.flyTo(centre, zoom, { duration: 1.2 })
  }, [centre, zoom, map])
  return null
}

interface Props {
  locations: Location[]
}

export default function MapComponent({ locations }: Props) {
  const [flyTarget, setFlyTarget] = useState<FlyProps | null>(null)
  const [expandedRegion, setExpandedRegion] = useState<string | null>(null)

  const handleRegion = (region: typeof REGIONS[0]) => {
    setExpandedRegion(expandedRegion === region.label ? null : region.label)
    setFlyTarget({ centre: region.centre, zoom: region.zoom })
  }

  const handleCity = (city: typeof REGIONS[0]['cities'][0]) => {
    setFlyTarget({ centre: city.centre, zoom: city.zoom })
  }

  return (
    <div style={{ display: 'flex', height: '75vh', width: '100%' }}>

      {/* Left sidebar */}
      <div style={{
        width: '180px',
        minWidth: '180px',
        background: '#f1faee',
        borderRight: '1px solid #d0e8e4',
        overflowY: 'auto',
        padding: '1rem 0',
      }}>
        <p style={{
          fontSize: '11px',
          fontWeight: 700,
          letterSpacing: '0.08em',
          color: '#457b9d',
          padding: '0 1rem',
          marginBottom: '0.5rem',
          textTransform: 'uppercase',
        }}>
          Regions
        </p>

        {REGIONS.map((region) => (
          <div key={region.label}>
            <button
              onClick={() => handleRegion(region)}
              style={{
                width: '100%',
                textAlign: 'left',
                padding: '0.6rem 1rem',
                background: expandedRegion === region.label ? '#2a9d8f' : 'transparent',
                color: expandedRegion === region.label ? 'white' : '#1d3557',
                border: 'none',
                cursor: 'pointer',
                fontSize: '14px',
                fontWeight: 600,
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
              }}
            >
              {region.label}
              <span style={{ fontSize: '10px' }}>
                {expandedRegion === region.label ? '▼' : '►'}
              </span>
            </button>

            {expandedRegion === region.label && (
              <div>
                {region.cities.map((city) => (
                  <button
                    key={city.label}
                    onClick={() => handleCity(city)}
                    style={{
                      width: '100%',
                      textAlign: 'left',
                      padding: '0.5rem 1rem 0.5rem 1.75rem',
                      background: 'transparent',
                      color: '#457b9d',
                      border: 'none',
                      cursor: 'pointer',
                      fontSize: '13px',
                    }}
                  >
                    {city.label}
                  </button>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Map */}
      <div style={{ flex: 1, position: 'relative' }}>
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

          {flyTarget && <FlyTo centre={flyTarget.centre} zoom={flyTarget.zoom} />}

          {locations.map((loc) => (
            <React.Fragment key={loc.id}>
              <Circle
                center={[Number(loc.latitude), Number(loc.longitude)]}
                radius={250}
                pathOptions={{
                  color: '#2a9d8f',
                  fillColor: '#2a9d8f',
                  fillOpacity: 0.08,
                  weight: 2,
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

    </div>
  )
}
