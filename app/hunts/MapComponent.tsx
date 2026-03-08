'use client'

import 'leaflet/dist/leaflet.css'
import L from 'leaflet'
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet'

// Fix default leaflet marker icons
delete (L.Icon.Default.prototype as any)._getIconUrl
L.Icon.Default.mergeOptions({
  iconRetinaUrl: '/icons/map-marker.svg',
  iconUrl: '/icons/map-marker.svg',
  shadowUrl: '',
})

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
  const centre: [number, number] = locations.length > 0
    ? [Number(locations[0].latitude), Number(locations[0].longitude)]
    : [-33.8688, 151.2093]

  return (
    <MapContainer
      center={centre}
      zoom={13}
      style={{ height: '60vh', width: '100%' }}
      scrollWheelZoom={true}
    >
      <TileLayer
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        attribution="&copy; OpenStreetMap contributors"
      />
      {locations.map((loc) => (
        <Marker
          key={loc.id}
          position={[Number(loc.latitude), Number(loc.longitude)]}
        >
          <Popup>
            <div style={{ textAlign: 'center', minWidth: '160px', padding: '4px' }}>
              <strong style={{ display: 'block', marginBottom: '4px', fontSize: '15px' }}>
                {loc.name}
              </strong>
              <span style={{ display: 'block', color: '#666', fontSize: '13px', marginBottom: '10px' }}>
                {loc.total_scans} explorers
              </span>
              <a
                href={`/hunts/${loc.id}`}
                style={{
                  display: 'inline-block',
                  padding: '7px 18px',
                  background: '#2a9d8f',
                  color: 'white',
                  borderRadius: '5px',
                  textDecoration: 'none',
                  fontSize: '14px',
                  fontWeight: 600,
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
