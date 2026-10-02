import type { Metadata } from 'next'
import HowItWorksFlow from '@/components/how-it-works/HowItWorksFlow'

export const metadata: Metadata = { title: 'How It Works' }

export default function HowItWorksPage() {
  return (
    <div className="page-theme page-theme--hiw">
      <section className="hiw-section">
        <div className="container">
          <h2>How It Works</h2>
        </div>

        <HowItWorksFlow />
      </section>
    </div>
  )
}
