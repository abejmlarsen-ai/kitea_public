'use client'

import dynamic from 'next/dynamic'

const HuntClient = dynamic(() => import('./HuntClient'), { ssr: false })

interface Props {
  huntLocation: { id: string; name: string; description: string; total_scans: number }
  userId: string
  progressData: any
}

export default function HuntPageClient({ huntLocation, userId, progressData }: Props) {
  return (
    <HuntClient
      huntLocation={huntLocation}
      userId={userId}
      progressData={progressData}
    />
  )
}
