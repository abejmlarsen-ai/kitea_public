// Plain server component — HuntClient and HuntBackButton are each already
// 'use client' where they need to be; this wrapper doesn't touch any
// browser API itself, so it doesn't need to be one too. Previously this
// wrapped HuntClient in `dynamic(..., { ssr: false })`, which skipped
// server rendering entirely for the whole coded-clue page (blank until JS
// hydrated) — that was never actually required (unlike MapComponent's
// Leaflet-driven ssr:false, which is a real constraint).
import HuntClient from './HuntClient'
import HuntBackButton from '@/components/layout/HuntBackButton'

interface HuntLocation {
  id: string; name: string; description: string | null; total_scans: number | null; latitude: number | null; longitude: number | null
}
interface ClueData {
  text_content: string | null; answer: string | null; image_url: string | null; hint_text: string | null
}

interface Props {
  huntLocation:    HuntLocation
  userId:          string
  clue:            ClueData | null
  clueImageUrl:    string | null
  hasScanned:      boolean
  hasRevealData:   boolean
  initialRevealed: boolean
  clueIsReal:      boolean
}

export default function HuntPageClient(props: Props) {
  return (
    <div className="page-theme page-theme--hunt">
      <HuntBackButton />
      <HuntClient {...props} />
    </div>
  )
}
