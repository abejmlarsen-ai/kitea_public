'use client'

import { MapContainer, TileLayer } from 'react-leaflet'

interface Props {
  lat: number
  lng: number
}

export default function HuntAreaMap({ lat, lng }: Props) {
  const centre: [number, number] = [Number(lat), Number(lng)]

  return (
    <MapContainer
      center={centre}
      zoom={16}
      style={{ height: '250px', width: '100%' }}
      zoomControl={false}
      attributionControl={false}
    >
      <TileLayer
        url='https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}'
        attribution='Tiles &copy; Esri'
      />
    </MapContainer>
  )
}
