'use client'
// ─── Map Wrapper (Client Component) ──────────────────────────────────────────
// dynamic() with ssr:false must live inside a Client Component.
// The Server Component (app/map/page.tsx) renders this wrapper instead.

import dynamic from 'next/dynamic'

const MapClient = dynamic(() => import('./MapClient'), {
  ssr: false,
  loading: () => (
    <div
      className="map-section"
      style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '60vh' }}
    >
      <p>Loading map…</p>
    </div>
  ),
})

export default function MapWrapper() {
  return <MapClient />
}
