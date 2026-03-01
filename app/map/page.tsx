import type { Metadata } from 'next'
import Image from 'next/image'
import MapWrapper from '@/components/map/MapWrapper'

export const metadata: Metadata = { title: 'Map' }

export default function MapPage() {
  return (
    <div className="page-theme page-theme--map">
      <section className="logo-hero logo-hero--map">
        <Image
          src="/images/Kitea Logo Only.png"
          alt="Kitea logo"
          width={400}
          height={400}
          priority
          style={{ objectFit: 'contain', width: 'auto' }}
        />
      </section>

      <section className="section_1 section_1--map">
        <div className="container">
          <h2>Hunt Locations</h2>
          <p>Find a Kitea tag near you.</p>
        </div>
      </section>

      <MapWrapper />
    </div>
  )
}
