// ─── Map Page (Protected) ────────────────────────────────────────────────────
// MapWrapper is a Client Component that loads Leaflet dynamically with ssr:false.

import type { Metadata } from 'next'
import Image from 'next/image'
import MapWrapper from '@/components/map/MapWrapper'

export const metadata: Metadata = { title: 'Map' }

export default function MapPage() {
  return (
    <>
      <section className="logo-hero logo-hero--map">
        <Image
          src="/images/Kitea Logo Only.png"
          alt="Kitea logo"
          width={300}
          height={300}
          priority
          style={{ objectFit: 'contain', maxHeight: '40vh', width: 'auto' }}
        />
      </section>

      <section className="section_1 section_1--map">
        <div className="container">
          <h2>Map</h2>
          <p>Explore the world</p>
        </div>
      </section>

      <MapWrapper />
    </>
  )
}
