'use client'
// ─── Mobile Header Menu ───────────────────────────────────────────────────────
// Shown in place of the desktop nav at ≤ 768px (see .mobile-menu in globals.css).
// Header (server component) passes the auth/admin state it already resolved, so
// this component adds no auth logic of its own.

import { useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import LogoutButton from '@/components/auth/LogoutButton'

interface Props {
  isLoggedIn: boolean
  isAdmin: boolean
}

const MENU_ID = 'mobile-menu-panel'

export default function MobileMenu({ isLoggedIn, isAdmin }: Props) {
  const [open, setOpen] = useState(false)
  const rootRef         = useRef<HTMLDivElement>(null)
  const buttonRef       = useRef<HTMLButtonElement>(null)
  const panelRef        = useRef<HTMLDivElement>(null)
  const pathname        = usePathname()

  // Close on route change
  useEffect(() => { setOpen(false) }, [pathname])

  useEffect(() => {
    if (!open) return

    // Move focus into the menu
    panelRef.current?.querySelector<HTMLElement>('a, button')?.focus()

    function onPointerDown(e: PointerEvent) {
      if (rootRef.current && !rootRef.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') {
        setOpen(false)
        buttonRef.current?.focus()
      }
    }
    document.addEventListener('pointerdown', onPointerDown)
    document.addEventListener('keydown', onKey)
    return () => {
      document.removeEventListener('pointerdown', onPointerDown)
      document.removeEventListener('keydown', onKey)
    }
  }, [open])

  const close = () => setOpen(false)

  const isActive = (href: string) =>
    pathname === href || pathname.startsWith(`${href}/`)

  const item = (href: string, label: string) => (
    <li>
      <Link
        href={href}
        onClick={close}
        className={`mobile-menu__link${isActive(href) ? ' mobile-menu__link--active' : ''}`}
        aria-current={isActive(href) ? 'page' : undefined}
      >
        {label}
      </Link>
    </li>
  )

  return (
    <div className="mobile-menu" ref={rootRef}>
      <button
        ref={buttonRef}
        type="button"
        className="mobile-menu__toggle"
        aria-expanded={open}
        aria-controls={MENU_ID}
        onClick={() => setOpen(o => !o)}
      >
        Menu
        <svg className="mobile-menu__caret" width="12" height="12" viewBox="0 0 12 12" fill="none"
          stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
          aria-hidden="true">
          <path d="M2.5 4.5L6 8l3.5-3.5" />
        </svg>
      </button>

      <div id={MENU_ID} ref={panelRef} className="mobile-menu__panel" hidden={!open}>
        <nav aria-label="Main">
          <ul>
            {item('/how-it-works', 'How It Works')}
            {item('/map', 'Map')}
            {isLoggedIn && item('/library', 'Library')}
            {isLoggedIn && item('/shop', 'Shop')}
          </ul>

          <hr className="mobile-menu__divider" />

          <ul>
            {isLoggedIn ? (
              <>
                {isAdmin && item('/admin', 'Admin')}
                {item('/account', 'Settings')}
                <li>
                  <LogoutButton className="mobile-menu__link mobile-menu__logout" label="Log out" />
                </li>
              </>
            ) : (
              item('/login', 'Log in')
            )}
          </ul>
        </nav>
      </div>
    </div>
  )
}
