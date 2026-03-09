'use client'

import 'leaflet/dist/leaflet.css'
import L from 'leaflet'
import React, { useEffect, useRef, useState } from 'react'
import { MapContainer, TileLayer, CircleMarker, Popup, Marker, useMap } from 'react-leaflet'

// ── Leaflet default-icon fix ───────────────────────────────────────────────
delete (L.Icon.Default.prototype as any)._getIconUrl
L.Icon.Default.mergeOptions({ iconUrl: '', shadowUrl: '' })

// ── Types ─────────────────────────────────────────────────────────────────

interface Location {
  id:           string
  name:         string
  description:  string
  latitude:     number
  longitude:    number
  total_scans:  number
  region:       string
  city:         string
}

interface Props {
  locations: Location[]
}

interface FlyProps {
  centre:  [number, number]
  zoom:    number
  trigger: number
}

// ── Regions ───────────────────────────────────────────────────────────────

const REGIONS = [
  {
    label: 'Australia',
    centre: [-25.2744, 133.7751] as [number, number],
    zoom: 4,
    cities: [
      { label: 'Sydney',    centre: [-33.8688, 151.2093] as [number, number], zoom: 12 },
      { label: 'Melbourne', centre: [-37.8136, 144.9631] as [number, number], zoom: 12 },
      { label: 'Brisbane',  centre: [-27.4698, 153.0251] as [number, number], zoom: 12 },
      { label: 'Perth',     centre: [-31.9505, 115.8605] as [number, number], zoom: 12 },
    ],
  },
  {
    label: 'New Zealand',
    centre: [-40.9006, 174.8860] as [number, number],
    zoom: 5,
    cities: [
      { label: 'Auckland',      centre: [-36.8485, 174.7633] as [number, number], zoom: 12 },
      { label: 'Wellington',    centre: [-41.2865, 174.7762] as [number, number], zoom: 12 },
      { label: 'Christchurch',  centre: [-43.5321, 172.6362] as [number, number], zoom: 12 },
    ],
  },
]

// ── FlyTo ─────────────────────────────────────────────────────────────────

function FlyTo({ centre, zoom, trigger }: FlyProps) {
  const map = useMap()
  const prevTrigger = useRef(0)
  useEffect(() => {
    if (trigger !== prevTrigger.current) {
      prevTrigger.current = trigger
      map.flyTo(centre, zoom, { duration: 1.2 })
    }
  }, [trigger, centre, zoom, map])
  return null
}

// ── Kitea logo icon ───────────────────────────────────────────────────────

const kiteaIcon = L.icon({
  iconUrl:    '/images/Kitea Logo Only.png',
  iconSize:   [32, 32],
  iconAnchor: [16, 32],
  popupAnchor:[0, -34],
})

// ── Component ─────────────────────────────────────────────────────────────

export default function MapComponent({ locations }: Props) {
  const mappable = locations.filter(l => l.latitude != null && l.longitude != null)

  const defaultCentre: [number, number] =
    mappable.length > 0
      ? [mappable[0].latitude, mappable[0].longitude]
      : [-33.8688, 151.2093]

  const [flyTarget, setFlyTarget] = useState<FlyProps | null>(null)
  const [expandedRegion, setExpandedRegion] = useState<string | null>(null)

  const handleRegion = (region: typeof REGIONS[0]) => {
    setExpandedRegion((prev) => {
      if (prev === region.label) {
        return null
      }
      return region.label
    })
    setFlyTarget((prev) => ({
      centre: region.centre,
      zoom: region.zoom,
      trigger: (prev?.trigger ?? 0) + 1,
    }))
  }

  return (
    <div style={{
      display:             'grid',
      gridTemplateColumns: '190px 1fr',
      gap:                 '1rem',
      width:               '100%',
      height:              '70vh',
      marginTop:           '1rem',
    }}>

      {/* ── Left sidebar: region / city nav ─────────────────────────── */}
      <div style={{
        overflowY:    'auto',
        background:   '#f1faee',
        borderRadius: 8,
        padding:      '0.75rem',
        display:      'flex',
        flexDirection:'column',
        gap:          '0.5rem',
      }}>
        <div style={{ marginBottom: '1.25rem' }}>
          <h2 style={{
            fontSize:   '16px',
            fontWeight: 700,
            color:      '#1d3557',
            margin:     '0 0 0.25rem 0',
          }}>
            Regions
          </h2>
          <p style={{
            fontSize: '12px',
            color:    '#457b9d',
            margin:   0,
          }}>
            Select an area to explore
          </p>
        </div>
        {REGIONS.map(region => (
          <div key={region.label}>
            <button
              onClick={() => handleRegion(region)}
              style={{
                width:        '100%',
                textAlign:    'left',
                padding:      '0.45rem 0.6rem',
                background:   '#2a9d8f',
                color:        'white',
                border:       'none',
                borderRadius: 6,
                fontWeight:   700,
                fontSize:     '0.82rem',
                cursor:       'pointer',
                letterSpacing:'0.03em',
              }}
            >
              {region.label}
            </button>

            {expandedRegion === region.label && (
              <div style={{ paddingLeft: '0.5rem', marginTop: '0.25rem', display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                {region.cities.map(city => (
                  <button
                    key={city.label}
                    onClick={() => setFlyTarget((prev) => ({
                      centre: city.centre,
                      zoom: city.zoom,
                      trigger: (prev?.trigger ?? 0) + 1,
                    }))}
                    style={{
                      textAlign:    'left',
                      padding:      '0.35rem 0.5rem',
                      background:   'transparent',
                      color:        '#1d3557',
                      border:       '1px solid #cde8e4',
                      borderRadius: 5,
                      fontSize:     '0.78rem',
                      cursor:       'pointer',
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

      {/* ── Map ─────────────────────────────────────────────────────── */}
      <div style={{ border: '2px solid black', borderRadius: 8, overflow: 'hidden' }}>
        <MapContainer
          center={defaultCentre}
          zoom={12}
          style={{ width: '100%', height: '100%' }}
          scrollWheelZoom={true}
        >
          <TileLayer
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          />

          {flyTarget && (
            <FlyTo
              centre={flyTarget.centre}
              zoom={flyTarget.zoom}
              trigger={flyTarget.trigger}
            />
          )}

          {mappable.map(loc => (
            <React.Fragment key={loc.id}>
              <CircleMarker
                center={[loc.latitude, loc.longitude]}
                radius={16}
                pathOptions={{
                  color:       '#2a9d8f',
                  fillColor:   'transparent',
                  fillOpacity: 0,
                  weight:      2,
                  dashArray:   '5 5',
                }}
              />
              <Marker
                position={[loc.latitude, loc.longitude]}
                icon={kiteaIcon}
              >
                <Popup
                  closeButton={true}
                  closeOnClick={false}
                  autoClose={false}
                >
                  <div style={{
                    textAlign:  'center',
                    minWidth:   '160px',
                    padding:    '8px 4px',
                    fontFamily: 'Arial, sans-serif',
                    position:   'relative',
                  }}>
                    <strong style={{
                      display:      'block',
                      fontSize:     '16px',
                      color:        '#1d3557',
                      marginBottom: '4px',
                    }}>
                      {loc.name}
                    </strong>
                    <span style={{
                      display:      'block',
                      fontSize:     '12px',
                      color:        '#888',
                      marginBottom: '12px',
                    }}>
                      {loc.total_scans} explorers
                    </span>
                    <a
                      href={`/hunts/${loc.id}`}
                      style={{
                        display:        'inline-block',
                        padding:        '8px 20px',
                        background:     '#2a9d8f',
                        color:          'white',
                        borderRadius:   '5px',
                        textDecoration: 'none',
                        fontSize:       '14px',
                        fontWeight:     600,
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
