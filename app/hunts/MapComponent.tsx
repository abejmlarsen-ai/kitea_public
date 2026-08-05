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
  description:  string | null
  latitude:     number | null
  longitude:    number | null
  total_scans:  number | null
  region:       string | null
  city:         string | null
}

interface Props {
  locations: Location[]
  scannedLocationIds: string[]
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

// ── Scanned-state marker colours ────────────────────────────────────────────
// Single source of truth for both the logo glow and the dashed circle, so
// the two can't drift apart. Green marks a hunt the current user has scanned
// at least once, independent of hunt_progress (clue-solved / reveal state).

const MARKER_COLOR_DEFAULT = '#CC2200'
const MARKER_COLOR_SCANNED = '#22C55E'

// ── Kitea logo icon ───────────────────────────────────────────────────────
// Two variants sharing the same shape — only the glow colour differs.

function buildKiteaIcon(glowColor: string) {
  return L.divIcon({
    html: `<img
      src="/images/Kitea Logo Only.png"
      width="32" height="32"
      style="
        filter: brightness(0) invert(1)
                drop-shadow(0 0 2px ${glowColor})
                drop-shadow(0 0 2px ${glowColor})
                drop-shadow(0 0 1px ${glowColor});
        display:block;
      "
    />`,
    iconSize:    [32, 32],
    iconAnchor:  [16, 32],
    popupAnchor: [0, -34],
    className:   '',
  })
}

const kiteaIcon        = buildKiteaIcon(MARKER_COLOR_DEFAULT)
const kiteaIconScanned = buildKiteaIcon(MARKER_COLOR_SCANNED)

// ── Component ─────────────────────────────────────────────────────────────

export default function MapComponent({ locations, scannedLocationIds }: Props) {
  console.log('[MapComponent] locations received:', locations.length,
    '| first:', locations[0] ? JSON.stringify({ id: locations[0].id, name: locations[0].name }) : 'none')

  const scannedSet = new Set(scannedLocationIds)

  const mappable = locations.filter(
    (l): l is Location & { latitude: number; longitude: number } =>
      !!l.id && l.latitude != null && l.longitude != null
  )

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
      height:              'calc(100vh - 8.5rem)',
    }}>

      {/* ── Left sidebar: region / city nav ─────────────────────────── */}
      <div style={{
        overflowY:    'auto',
        background:   '#F2EDE3',
        borderRadius: 8,
        padding:      '0.75rem',
        display:      'flex',
        flexDirection:'column',
        gap:          '0.5rem',
      }}>
        {/* Primary region label — moved from above the map grid */}
        <div>
          <h2 style={{
            fontFamily:    'var(--font-heading, inherit)',
            fontSize:      '1rem',
            fontWeight:    700,
            color:         '#0b2838',
            margin:        '0 0 0.2rem 0',
            letterSpacing: '0.04em',
          }}>
            Regions
          </h2>
          <p style={{
            fontSize:     '12px',
            color:        '#4a7c8c',
            margin:       '0 0 0.5rem 0',
          }}>
            Select an area to explore
          </p>
          {/* Australia sits directly below the subheading */}
          {REGIONS.filter(r => r.label === 'Australia').map(region => (
            <div key={region.label}>
              <button
                onClick={() => handleRegion(region)}
                className="map-region-btn"
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
                      className="map-city-btn"
                    >
                      {city.label}
                    </button>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Remaining regions */}
        {REGIONS.filter(r => r.label !== 'Australia').map(region => (
          <div key={region.label}>
            <button
              onClick={() => handleRegion(region)}
              className="map-region-btn"
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
                    className="map-city-btn"
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
            url="https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}"
            attribution='&copy; <a href="https://www.esri.com">Esri</a> &mdash; Esri, i-cubed, USDA, USGS, AEX, GeoEye, Getmapping, Aerogrid, IGN, IGP, UPR-EGP, and the GIS User Community'
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
                  color:       scannedSet.has(loc.id) ? MARKER_COLOR_SCANNED : MARKER_COLOR_DEFAULT,
                  fillColor:   'transparent',
                  fillOpacity: 0,
                  weight:      2,
                  dashArray:   '5 5',
                }}
              />
              <Marker
                position={[loc.latitude, loc.longitude]}
                icon={scannedSet.has(loc.id) ? kiteaIconScanned : kiteaIcon}
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

                    {scannedSet.has(loc.id) ? (
                      <>
                        <span style={{
                          display:      'block',
                          fontSize:     '12px',
                          color:        '#2ECC71',
                          fontWeight:   700,
                          marginBottom: '10px',
                        }}>
                          Hunt completed
                        </span>
                        <a
                          href={`/library?hunt=${loc.id}`}
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
                          View in Library
                        </a>
                        <a
                          href={`/hunts/${loc.id}`}
                          style={{
                            display:        'block',
                            marginTop:      '8px',
                            fontSize:       '11px',
                            color:          '#888',
                            textDecoration: 'underline',
                          }}
                        >
                          Continue to hunt
                        </a>
                      </>
                    ) : (
                      <>
                        <span style={{
                          display:      'block',
                          fontSize:     '12px',
                          color:        '#888',
                          marginBottom: '12px',
                        }}>
                          {loc.total_scans ?? 0} explorers
                        </span>
                        <a
                          href={loc.id ? `/hunts/${loc.id}` : '#'}
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
                      </>
                    )}
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
