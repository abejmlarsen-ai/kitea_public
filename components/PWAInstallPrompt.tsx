'use client'
// ─── PWA Install Prompt ───────────────────────────────────────────────────────

import { useEffect, useState } from 'react'

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>
}

export default function PWAInstallPrompt() {
  const [show, setShow]                   = useState(false)
  const [isIOS, setIsIOS]                 = useState(false)
  const [deferredPrompt, setDeferredPrompt] =
    useState<BeforeInstallPromptEvent | null>(null)

  useEffect(() => {
    // Already installed in standalone mode — skip
    if (window.matchMedia('(display-mode: standalone)').matches) return
    // Already dismissed this session — skip
    if (sessionStorage.getItem('pwa-prompt-dismissed')) return

    const ios = /iphone|ipad|ipod/i.test(navigator.userAgent)
    setIsIOS(ios)

    if (ios) {
      // iOS: show after 30 s (no beforeinstallprompt support)
      const timer = setTimeout(() => setShow(true), 30_000)
      return () => clearTimeout(timer)
    }

    // Android/Chrome: wait for beforeinstallprompt, then show after 30 s
    let timer: ReturnType<typeof setTimeout> | null = null

    const handler = (e: Event) => {
      e.preventDefault()
      setDeferredPrompt(e as BeforeInstallPromptEvent)
      timer = setTimeout(() => setShow(true), 30_000)
    }

    window.addEventListener('beforeinstallprompt', handler)
    return () => {
      window.removeEventListener('beforeinstallprompt', handler)
      if (timer) clearTimeout(timer)
    }
  }, [])

  function dismiss() {
    sessionStorage.setItem('pwa-prompt-dismissed', '1')
    setShow(false)
  }

  async function install() {
    if (!deferredPrompt) return
    await deferredPrompt.prompt()
    const { outcome } = await deferredPrompt.userChoice
    if (outcome === 'accepted') setShow(false)
    setDeferredPrompt(null)
  }

  if (!show) return null

  return (
    <div className="pwa-banner" role="status" aria-live="polite">
      <p className="pwa-banner-msg">
        {isIOS
          ? 'Tap the share button then \u201cAdd to Home Screen\u201d to install Kitea'
          : 'Install Kitea on your home screen for the best experience'}
      </p>
      <div className="pwa-banner-actions">
        {!isIOS && (
          <button className="pwa-banner-install" onClick={install}>
            Install
          </button>
        )}
        <button className="pwa-banner-dismiss" onClick={dismiss} aria-label="Dismiss install prompt">
          \u2715
        </button>
      </div>
    </div>
  )
}
