'use client'

import 'leaflet/dist/leaflet.css'
import { MapContainer, TileLayer, CircleMarker, Popup } from 'react-leaflet'

interface Location {
  id: string
  name: string
  latitude: number
  longitude: number
}

interface Props {
  locations: Location[]
  onMarkerClick: (id: string) => void
}

export default function MapComponent({ locations, onMarkerClick }: Props) {
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
        <CircleMarker
          key={loc.id}
          center={[Number(loc.latitude), Number(loc.longitude)]}
          radius={10}
          pathOptions={{ color: '#C9A84C', fillColor: '#C9A84C', fillOpacity: 0.8 }}
          eventHandlers={{ click: () => onMarkerClick(loc.id) }}
        >
          <Popup>{loc.name}</Popup>
        </CircleMarker>
      ))}
    </MapContainer>
  )
}
