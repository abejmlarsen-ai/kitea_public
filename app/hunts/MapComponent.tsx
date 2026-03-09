'use client'

import 'leaflet/dist/leaflet.css'
import L from 'leaflet'
import React, { useEffect, useState } from 'react'
import { MapContainer, TileLayer, CircleMarker, Tooltip, Marker, useMap } from 'react-leaflet'

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
  useEffect(() => {
    if (trigger > 0) map.flyTo(centre, zoom, { duration: 1.2 })
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [trigger])
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
  const [openRegion, setOpenRegion] = useState<string | null>(null)

  function flyTo(centre: [number, number], zoom: number) {
    setFlyTarget(prev => ({
      centre,
      zoom,
      trigger: (prev?.trigger ?? 0) + 1,
    }))
  }

  return (
    <div style={{
      display:             'grid',
      gridTemplateColumns: '190px 1fr 190px',
      gap:                 '1rem',
      width:               '100%',
      height:              '70vh',
      marginTop:           '1.5rem',
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
        {REGIONS.map(region => (
          <div key={region.label}>
            <button
              onClick={() => {
                flyTo(region.centre, region.zoom)
                setOpenRegion(openRegion === region.label ? null : region.label)
              }}
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

            {openRegion === region.label && (
              <div style={{ paddingLeft: '0.5rem', marginTop: '0.25rem', display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                {region.cities.map(city => (
                  <button
                    key={city.label}
                    onClick={() => flyTo(city.centre, city.zoom)}
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
                <Tooltip direction="top" offset={[0, -36]} permanent={false} opacity={0.95}>
                  <div style={{ textAlign: 'center', minWidth: 130 }}>
                    <strong style={{ display: 'block', fontSize: 14 }}>{loc.name}</strong>
                    <span style={{ fontSize: 12, color: '#555' }}>
                      {loc.total_scans} {loc.total_scans === 1 ? 'explorer' : 'explorers'}
                    </span>
                  </div>
                </Tooltip>
              </Marker>
            </React.Fragment>
          ))}
        </MapContainer>
      </div>

      {/* ── Right sidebar: hunt list ─────────────────────────────────── */}
      <div style={{
        overflowY:    'auto',
        background:   '#f1faee',
        borderRadius: 8,
        padding:      '0.75rem',
        display:      'flex',
        flexDirection:'column',
        gap:          '0.5rem',
      }}>
        <p style={{ fontSize: '0.75rem', fontWeight: 700, color: '#2a9d8f', margin: '0 0 0.25rem', letterSpacing: '0.05em', textTransform: 'uppercase' }}>
          Hunts
        </p>
        {mappable.map(loc => (
          <a
            key={loc.id}
            href={`/hunts/${loc.id}`}
            style={{
              display:        'block',
              padding:        '0.5rem 0.6rem',
              background:     'white',
              border:         '1px solid #cde8e4',
              borderRadius:   6,
              textDecoration: 'none',
              color:          '#1d3557',
              fontSize:       '0.8rem',
              fontWeight:     600,
              lineHeight:     1.3,
            }}
          >
            {loc.name}
            <span style={{ display: 'block', fontWeight: 400, color: '#888', fontSize: '0.72rem' }}>
              {loc.city}
            </span>
          </a>
        ))}
        {mappable.length === 0 && (
          <p style={{ color: '#999', fontSize: '0.8rem' }}>No locations yet.</p>
        )}
      </div>

    </div>
  )
}
