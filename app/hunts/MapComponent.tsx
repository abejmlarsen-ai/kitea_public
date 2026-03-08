'use client'

import 'leaflet/dist/leaflet.css'
import L from 'leaflet'
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet'

const kiteaIcon = L.icon({
  iconUrl:      '/icons/map-marker.png',
  iconSize:     [32, 32],
  iconAnchor:   [16, 32],
  popupAnchor:  [0, -32],
  shadowUrl:    undefined,
  className:    'kitea-marker',
})

interface Location {
  id:        string
  name:      string
  latitude:  number
  longitude: number
}

interface Props {
  locations:     Location[]
  onMarkerClick: (id: string) => void
}

export default function MapComponent({ locations }: Props) {
  const centre: [number, number] = locations.length > 0
    ? [Number(locations[0].latitude), Number(locations[0].longitude)]
    : [-36.8485, 174.7633]

  return (
    <MapContainer
      center={centre}
      zoom={13}
      style={{ height: '300px', width: '100%' }}
    >
      <TileLayer
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        attribution="&copy; OpenStreetMap contributors"
      />
      {locations.map((loc) => (
        <Marker
          key={loc.id}
          position={[Number(loc.latitude), Number(loc.longitude)]}
          icon={kiteaIcon}
        >
          <Popup>
            <div style={{ textAlign: 'center', minWidth: '140px' }}>
              <strong style={{ display: 'block', marginBottom: '8px' }}>{loc.name}</strong>
              <a
                href={`/hunts/${loc.id}`}
                style={{
                  display:        'inline-block',
                  padding:        '6px 16px',
                  background:     '#2a9d8f',
                  color:          'white',
                  borderRadius:   '4px',
                  textDecoration: 'none',
                  fontSize:       '14px',
                }}
              >
                Open Hunt →
              </a>
            </div>
          </Popup>
        </Marker>
      ))}
    </MapContainer>
  )
}
