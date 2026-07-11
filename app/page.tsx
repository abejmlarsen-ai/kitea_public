// ─── Root Page ────────────────────────────────────────────────────────────────────────────
import type { Metadata } from 'next'
import HeroCarousel from '@/components/home/HeroCarousel'

export const metadata: Metadata = { title: 'Kitea' }

export default function HomePage() {
  return (
    <div className="page-theme page-theme--home">
      <HeroCarousel />
    </div>
  )
}
