'use client'

import dynamic from 'next/dynamic'

const HuntClient = dynamic(() => import('./HuntClient'), { ssr: false })

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
}

export default function HuntPageClient(props: Props) {
  return (
    <div className="page-theme page-theme--hunt">
      <HuntClient {...props} />
    </div>
  )
}
