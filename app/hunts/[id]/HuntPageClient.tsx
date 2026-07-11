'use client'

import dynamic from 'next/dynamic'

const HuntClient = dynamic(() => import('./HuntClient'), { ssr: false })

interface HuntLocation {
  id: string; name: string; description: string | null; total_scans: number | null; latitude: number | null; longitude: number | null
}
interface ClueData {
  text_content: string | null; answer: string | null; image_url: string | null
}
interface HintsData {
  hint_1_text: string | null; hint_1_answer: string | null
  hint_2_text: string | null; hint_2_answer: string | null
  hint_3_text: string | null; hint_3_answer: string | null
}
interface RevealsData {
  reveal_directions: string | null; reveal_image_url: string | null
}

interface Props {
  huntLocation:  HuntLocation
  userId:        string
  clue:          ClueData | null
  hints:         HintsData | null
  reveals:       RevealsData | null
  clueImageUrl:  string | null
  revealImageUrl: string | null
  hasScanned:    boolean
}

export default function HuntPageClient(props: Props) {
  return (
    <div className="page-theme page-theme--hunt">
      <HuntClient {...props} />
    </div>
  )
}
