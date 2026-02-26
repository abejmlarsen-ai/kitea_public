'use client'
// ─── Admin Nav Dropdown ───────────────────────────────────────────────────────
// Shown in the header only for is_admin users (server component passes it
// conditionally). Clicking "Admin" opens an animated dropdown with all 6
// admin sections; each link navigates to /admin?tab=<section> so the correct
// tab opens immediately without an extra click.

import { useState, useRef, useEffect } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'

const SECTIONS = [
  { label: 'Locations', tab: 'locations' },
  { label: 'Products',  tab: 'products'  },
  { label: 'NFC Tags',  tab: 'nfc_tags'  },
  { label: 'Orders',    tab: 'orders'    },
  { label: 'Users',     tab: 'users'     },
  { label: 'Stats',     tab: 'stats'     },
]

export default function AdminDropdown() {
  const [open, setOpen] = useState(false)
  const ref             = useRef<HTMLLIElement>(null)
  const pathname        = usePathname()

  // Close whenever we navigate away
  useEffect(() => { setOpen(false) }, [pathname])

  // Close on outside click
  useEffect(() => {
    function onMouseDown(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    document.addEventListener('mousedown', onMouseDown)
    return () => document.removeEventListener('mousedown', onMouseDown)
  }, [])

  // Close on Escape key
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') setOpen(false)
    }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [])

  const isOnAdmin = pathname.startsWith('/admin')

  return (
    <li
      ref={ref}
      className={`nav-admin-dropdown${isOnAdmin ? ' nav-admin-dropdown--active' : ''}`}
    >
      <button
        onClick={() => setOpen(o => !o)}
        className="nav-admin-btn"
        aria-haspopup="true"
        aria-expanded={open}
      >
        Admin
        <span className="nav-admin-arrow" aria-hidden="true">
          {open ? '▲' : '▼'}
        </span>
      </button>

      {open && (
        <ul className="nav-admin-menu" role="menu">
          {SECTIONS.map(s => (
            <li key={s.tab} role="none">
              <Link
                href={`/admin?tab=${s.tab}`}
                role="menuitem"
                onClick={() => setOpen(false)}
              >
                {s.label}
              </Link>
            </li>
          ))}
        </ul>
      )}
    </li>
  )
}
