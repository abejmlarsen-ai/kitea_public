import type { Metadata } from 'next'
import FaqSection from '@/components/faq/FaqSection'

export const metadata: Metadata = { title: 'FAQ' }

export default function FaqPage() {
  return (
    <div className="page-theme page-theme--faq">
      <FaqSection />
    </div>
  )
}
