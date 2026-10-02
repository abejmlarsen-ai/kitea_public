import type { Metadata } from 'next'
import OpportunitiesSection from '@/components/opportunities/OpportunitiesSection'

export const metadata: Metadata = { title: 'Opportunities' }

export default function OpportunitiesPage() {
  return (
    <div className="page-theme page-theme--opportunities">
      <OpportunitiesSection />
    </div>
  )
}
