'use client'
// ─── Collapsed Header Menu ────────────────────────────────────────────────────
// A "Menu" dropdown that replaces the centred nav and the right-hand cluster
// whenever they would overlap the logo or each other — at any window width,
// not just on phones. It measures the header and toggles .site-header--compact
// (styles in globals.css). At ≤ 768px CSS collapses the header regardless, so
// phones never flash the full nav before this script runs.
//
// Header (server component) passes the auth/admin state it already resolved, so
// this component adds no auth logic of its own.

import { useEffect, useLayoutEffect, useRef, useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import LogoutButton from '@/components/auth/LogoutButton'
import { ADMIN_SECTIONS } from './AdminDropdown'
import { isInHuntFlow } from './ReturnToMapButton'

interface Props {
  isLoggedIn: boolean
  isAdmin: boolean
}

const MENU_ID = 'header-menu-panel'
// Minimum breathing room between the logo, the centred nav and the right cluster
const MIN_GAP = 24

export default function HeaderMenu({ isLoggedIn, isAdmin }: Props) {
  const [open, setOpen] = useState(false)
  const rootRef         = useRef<HTMLDivElement>(null)
  const buttonRef       = useRef<HTMLButtonElement>(null)
  const panelRef        = useRef<HTMLDivElement>(null)
  const pathname        = usePathname()

  // ── Collapse the header whenever its parts would overlap ──
  // The nav and right cluster keep their size while hidden (visibility only),
  // so the measurement is the same in both states and can't flip-flop.
  useLayoutEffect(() => {
    const header = rootRef.current?.closest<HTMLElement>('.site-header')
    const inner  = header?.querySelector<HTMLElement>('.header-inner')
    const logo   = header?.querySelector<HTMLElement>('.logo')
    const nav    = header?.querySelector<HTMLElement>('.main-nav')
    const right  = header?.querySelector<HTMLElement>('.header-row1-right')
    if (!header || !inner || !logo || !nav || !right) return

    function measure() {
      const box      = inner!.getBoundingClientRect()
      const padRight = parseFloat(getComputedStyle(inner!).paddingRight) || 0
      const logoEnd  = logo!.getBoundingClientRect().right - box.left
      const navWidth = nav!.getBoundingClientRect().width
      const navStart = box.width / 2 - navWidth / 2
      const navEnd   = box.width / 2 + navWidth / 2
      const rightStart = box.width - padRight - right!.getBoundingClientRect().width

      const overlaps = navStart < logoEnd + MIN_GAP || navEnd > rightStart - MIN_GAP
      header!.classList.toggle('site-header--compact', overlaps)
      if (!overlaps) setOpen(false)
    }

    measure()
    const observer = new ResizeObserver(measure)
    ;[inner, logo, nav, right].forEach(el => observer.observe(el))
    return () => observer.disconnect()
  }, [])

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

  const item = (href: string, label: string, extraClass = '') => (
    <li key={href}>
      <Link
        href={href}
        onClick={close}
        className={`header-menu__link${extraClass}${isActive(href) ? ' header-menu__link--active' : ''}`}
        aria-current={isActive(href) ? 'page' : undefined}
      >
        {label}
      </Link>
    </li>
  )

  return (
    <div className="header-menu" ref={rootRef}>
      <button
        ref={buttonRef}
        type="button"
        className="header-menu__toggle"
        aria-expanded={open}
        aria-controls={MENU_ID}
        onClick={() => setOpen(o => !o)}
      >
        Menu
        <svg className="header-menu__caret" width="12" height="12" viewBox="0 0 12 12" fill="none"
          stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
          aria-hidden="true">
          <path d="M2.5 4.5L6 8l3.5-3.5" />
        </svg>
      </button>

      <div id={MENU_ID} ref={panelRef} className="header-menu__panel" hidden={!open}>
        <nav aria-label="Main">
          {isInHuntFlow(pathname) && (
            <ul>
              <li>
                <Link href="/map" onClick={close} className="header-menu__link header-menu__link--return">
                  ← Return to map
                </Link>
              </li>
            </ul>
          )}

          <ul>
            {item('/how-it-works', 'How It Works')}
            {item('/map', 'Map')}
            {isLoggedIn && item('/library', 'Library')}
            {isLoggedIn && item('/shop', 'Shop')}
          </ul>

          <hr className="header-menu__divider" />

          {isLoggedIn && isAdmin && (
            <>
              <p className="header-menu__group" id="header-menu-admin">Admin</p>
              <ul aria-labelledby="header-menu-admin">
                {ADMIN_SECTIONS.map(s =>
                  item(`/admin?tab=${s.tab}`, s.label, ' header-menu__link--sub')
                )}
              </ul>
              <hr className="header-menu__divider" />
            </>
          )}

          <ul>
            {isLoggedIn ? (
              <>
                {item('/account', 'Settings')}
                <li>
                  <LogoutButton className="header-menu__link header-menu__logout" label="Log out" />
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
