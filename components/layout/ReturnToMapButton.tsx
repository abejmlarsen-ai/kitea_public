'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'

// "Return to map" only makes sense inside the hunt/scan flow — not on the
// homepage, shop, account, etc. The bare hunt entry route (/hunts/{id})
// renders its own "Return to map" link inline on the page, so showing one in
// the header too would duplicate it. Shared with the collapsed HeaderMenu.
export function isInHuntFlow(pathname: string) {
  const isHuntEntryPage = /^\/hunts\/[^/]+\/?$/.test(pathname)
  return (pathname.startsWith('/hunts') && !isHuntEntryPage) || pathname === '/scan'
}

// Shown in the global header only while inside the hunt/scan flow.
export default function ReturnToMapButton() {
  const pathname = usePathname()

  if (!isInHuntFlow(pathname)) return null

  return (
    <Link href="/map" className="nav-return-map-btn">
      ← Return to map
    </Link>
  )
}
