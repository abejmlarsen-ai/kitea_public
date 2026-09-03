'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'

// Shown in the global header only while inside the hunt/scan flow — a
// "Return to map" control makes no sense on the homepage, shop, account, etc.
export default function ReturnToMapButton() {
  const pathname = usePathname()
  // The bare hunt entry route (/hunts/{id}) renders its own "Return to map"
  // link inline on the page — showing this one too would duplicate it.
  const isHuntEntryPage = /^\/hunts\/[^/]+\/?$/.test(pathname)
  const inHuntFlow = (pathname.startsWith('/hunts') && !isHuntEntryPage) || pathname === '/scan'

  if (!inHuntFlow) return null

  return (
    <Link href="/map" className="nav-return-map-btn">
      ← Return to map
    </Link>
  )
}
