'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'

// Shown in the global header only while inside the hunt/scan flow — a
// "Return to map" control makes no sense on the homepage, shop, account, etc.
export default function ReturnToMapButton() {
  const pathname = usePathname()
  const inHuntFlow = pathname.startsWith('/hunts') || pathname === '/scan'

  if (!inHuntFlow) return null

  return (
    <Link href="/map" className="nav-return-map-btn">
      ← Return to map
    </Link>
  )
}
