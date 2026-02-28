'use client'
// ─── Interactive Map (Client Component, Leaflet) ─────────────────────────────
// Loaded via dynamic() with ssr:false — Leaflet needs browser window.

import { useEffect, useRef } from 'react'

interface Location {
  name: string
  lat: number
  lng: number
  zoom: number
  page?: string
  sidebarOnly?: boolean  // zoom only — no marker placed on map
}

const LOCATIONS: Location[] = [
  { name: 'Sydney',   lat: -33.8688, lng: 151.2093, zoom: 12, sidebarOnly: true },
  { name: 'Hunt 1',  lat: -34.0352, lng: 151.2222, zoom: 15, page: '/location/hunt-1' },
  { name: 'Auckland', lat: -36.8509, lng: 174.7645, zoom: 12 },
]

export default function MapClient() {
  const mapRef     = useRef<HTMLDivElement>(null)
  const leafletRef = useRef<any>(null)
  const popupRef   = useRef<HTMLDivElement>(null)

  useEffect(() => {
    async function initMap() {
      if (!mapRef.current || leafletRef.current) return

      const L = (await import('leaflet')).default

      // Fix Leaflet's broken default icon paths in bundled apps
      // @ts-ignore
      delete L.Icon.Default.prototype._getIconUrl
      L.Icon.Default.mergeOptions({
        iconUrl:       '/images/leaflet/marker-icon.png',
        iconRetinaUrl: '/images/leaflet/marker-icon-2x.png',
        shadowUrl:     '/images/leaflet/marker-shadow.png',
      })

      const map = L.map(mapRef.current).setView([-33.8688, 151.2093], 5)
      leafletRef.current = map

      // ESRI World Imagery — aerial/satellite tiles
      L.tileLayer(
        'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
        {
          attribution:
            'Tiles &copy; Esri &mdash; Source: Esri, i-cubed, USDA, USGS, AEX, GeoEye, Getmapping, Aerogrid, IGN, IGP, UPR-EGP, and the GIS User Community',
          maxZoom: 19,
        }
      ).addTo(map)

      // Place markers only for non-sidebarOnly locations
      LOCATIONS.filter((loc) => !loc.sidebarOnly).forEach((loc) => {
        const xIcon = L.divIcon({
          className: '',
          html: '<span class="map-x-marker">✕</span>',
          iconSize: [28, 28],
          iconAnchor: [14, 14],
        })

        const marker = L.marker([loc.lat, loc.lng], { icon: xIcon }).addTo(map)

        // Radius circle around each hunt marker
        L.circle([loc.lat, loc.lng], {
          color: '#e30000',
          fillColor: '#e30000',
          fillOpacity: 0.08,
          weight: 1.5,
          radius: 300,
        }).addTo(map)

        marker.on('click', (e: any) => {
          if (!popupRef.current) return
          const popup  = popupRef.current
          const nameEl = document.getElementById('popup-name')
          const linkEl = document.getElementById('popup-link') as HTMLAnchorElement | null

          if (nameEl) nameEl.textContent = loc.name
          if (linkEl) {
            linkEl.href = loc.page ?? '#'
            linkEl.style.display = loc.page ? 'block' : 'none'
          }

          const container = map.getContainer().getBoundingClientRect()
          const point     = map.latLngToContainerPoint(e.latlng)
          popup.style.left = `${container.left + point.x + 16}px`
          popup.style.top  = `${container.top  + point.y - 40}px`
          popup.classList.remove('hidden')
        })
      })

      map.on('click', () => {
        if (popupRef.current) popupRef.current.classList.add('hidden')
      })
    }

    initMap()
    return () => {
      if (leafletRef.current) {
        leafletRef.current.remove()
        leafletRef.current = null
      }
    }
  }, [])

  function flyTo(lat: number, lng: number, zoom: number) {
    if (leafletRef.current) {
      leafletRef.current.flyTo([lat, lng], zoom, { animate: true, duration: 1.2 })
    }
  }

  return (
    <div className="map-section">
      <div className="map-container">
        <div className="map-sidebar">
          <h3>Locations</h3>
          <div className="sidebar-group">
            <h4>Australia</h4>
            <button className="location-btn" onClick={() => flyTo(-33.8688, 151.2093, 12)}>
              Sydney
            </button>
            <button className="location-btn" onClick={() => flyTo(-34.0352, 151.2222, 15)}>
              Hunt 1
            </button>
          </div>
          <div className="sidebar-group">
            <h4>New Zealand</h4>
            <button className="location-btn" onClick={() => flyTo(-36.8509, 174.7645, 12)}>
              Auckland
            </button>
          </div>
        </div>

        <div id="map-wrapper">
          <div ref={mapRef} id="map" style={{ width: '100%', height: '100%' }} />
        </div>
      </div>

      <div ref={popupRef} id="location-popup" className="location-popup hidden">
        <div className="popup-header">
          <h3 className="popup-name" id="popup-name">Location</h3>
          <button
            className="popup-close"
            aria-label="Close"
            onClick={() => popupRef.current?.classList.add('hidden')}
          >
            ✕
          </button>
        </div>
        <a href="#" id="popup-link" className="popup-visit-btn">Visit Page</a>
      </div>
    </div>
  )
}
