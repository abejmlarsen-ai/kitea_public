'use client'
// ─── Interactive Map (Client Component, Leaflet) ─────────────────────────────

import { useEffect, useRef, useState } from 'react'

interface Location {
  name: string
  lat: number
  lng: number
  zoom: number
  page?: string
}

// City/region locations shown in sidebar
const CITY_LOCATIONS = {
  australia: [
    { name: 'Sydney', lat: -33.8688, lng: 151.2093, zoom: 12 },
  ],
  newZealand: [
    { name: 'Auckland', lat: -36.8509, lng: 174.7645, zoom: 12 },
  ],
}

// Hunt locations — shown as markers on map only (not in sidebar)
const HUNT_LOCATIONS: Location[] = [
  { name: 'Hunt 1', lat: -34.0352, lng: 151.2222, zoom: 15, page: '/location/hunt-1' },
]

export default function MapClient() {
  const mapRef     = useRef<HTMLDivElement>(null)
  const leafletRef = useRef<any>(null)
  const popupRef   = useRef<HTMLDivElement>(null)

  // Accordion state: which country section is expanded
  const [expandedCountry, setExpandedCountry] = useState<string | null>(null)

  function toggleCountry(key: string) {
    setExpandedCountry((prev) => (prev === key ? null : key))
  }

  useEffect(() => {
    async function initMap() {
      if (!mapRef.current || leafletRef.current) return

      const L = (await import('leaflet')).default

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
            'Tiles &copy; Esri &mdash; Esri, i-cubed, USDA, USGS, AEX, GeoEye, Getmapping, Aerogrid, IGN, IGP, UPR-EGP, and the GIS User Community',
          maxZoom: 19,
        }
      ).addTo(map)

      // Auckland also gets a marker (city location, not a hunt)
      const aucklandIcon = L.divIcon({
        className: '',
        html: '<span class="map-x-marker">✕</span>',
        iconSize: [28, 28],
        iconAnchor: [14, 14],
      })
      L.marker([-36.8509, 174.7645], { icon: aucklandIcon }).addTo(map)

      // Hunt markers with radius circles
      HUNT_LOCATIONS.forEach((loc) => {
        const xIcon = L.divIcon({
          className: '',
          html: '<span class="map-x-marker map-x-marker--hunt">✕</span>',
          iconSize: [28, 28],
          iconAnchor: [14, 14],
        })

        const marker = L.marker([loc.lat, loc.lng], { icon: xIcon }).addTo(map)

        // Radius circle around hunt marker
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
        {/* Accordion Sidebar */}
        <div className="map-sidebar">
          <h3>Locations</h3>

          {/* Australia */}
          <div className="sidebar-country">
            <button
              className={`sidebar-country-btn${expandedCountry === 'au' ? ' sidebar-country-btn--open' : ''}`}
              onClick={() => toggleCountry('au')}
              aria-expanded={expandedCountry === 'au'}
            >
              <span>Australia</span>
              <span className="sidebar-arrow">{expandedCountry === 'au' ? '▾' : '▸'}</span>
            </button>
            {expandedCountry === 'au' && (
              <div className="sidebar-country-items">
                {CITY_LOCATIONS.australia.map((loc) => (
                  <button
                    key={loc.name}
                    className="location-btn"
                    onClick={() => flyTo(loc.lat, loc.lng, loc.zoom)}
                  >
                    {loc.name}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* New Zealand */}
          <div className="sidebar-country">
            <button
              className={`sidebar-country-btn${expandedCountry === 'nz' ? ' sidebar-country-btn--open' : ''}`}
              onClick={() => toggleCountry('nz')}
              aria-expanded={expandedCountry === 'nz'}
            >
              <span>New Zealand</span>
              <span className="sidebar-arrow">{expandedCountry === 'nz' ? '▾' : '▸'}</span>
            </button>
            {expandedCountry === 'nz' && (
              <div className="sidebar-country-items">
                {CITY_LOCATIONS.newZealand.map((loc) => (
                  <button
                    key={loc.name}
                    className="location-btn"
                    onClick={() => flyTo(loc.lat, loc.lng, loc.zoom)}
                  >
                    {loc.name}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Map canvas */}
        <div id="map-wrapper">
          <div ref={mapRef} id="map" style={{ width: '100%', height: '100%' }} />
        </div>
      </div>

      {/* Location popup */}
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
