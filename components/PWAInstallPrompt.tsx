'use client'
// ─── PWA Install Prompt ───────────────────────────────────────────────────────
// The beforeinstallprompt event can fire before React hydrates.
// Capture it at module load time (runs synchronously when the JS bundle
// evaluates) so we never miss it.

import { useEffect, useState, useRef } from 'react'

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>
}

// Module-level capture — executes as soon as this bundle is evaluated,
// before any useEffect can run.
let _capturedPrompt: BeforeInstallPromptEvent | null = null
if (typeof window !== 'undefined') {
  window.addEventListener('beforeinstallprompt', (e) => {
    e.preventDefault()
    _capturedPrompt = e as BeforeInstallPromptEvent
  })
}

export default function PWAInstallPrompt() {
  const [show, setShow]   = useState(false)
  const [isIOS, setIsIOS] = useState(false)
  // useRef avoids stale closure when calling prompt() asynchronously
  const promptRef = useRef<BeforeInstallPromptEvent | null>(null)

  useEffect(() => {
    // Already installed in standalone mode — never show
    if (window.matchMedia('(display-mode: standalone)').matches) return

    // Dismissed this session — skip
    if (sessionStorage.getItem('kitea-install-dismissed') === 'true') return

    const ua  = navigator.userAgent
    // iOS Safari: beforeinstallprompt never fires; detect Safari specifically
    // (Chrome/Firefox on iOS also contain "iphone/ipad" so exclude them)
    const ios = /iphone|ipad|ipod/i.test(ua) &&
                /safari/i.test(ua) &&
                !/chrome|crios|fxios|opios/i.test(ua)

    setIsIOS(ios)

    if (ios) {
      // Show iOS manual-install instructions immediately
      setShow(true)
      return
    }

    // Chrome / Edge / Android WebAPK — try module-level capture first
    if (_capturedPrompt) {
      promptRef.current = _capturedPrompt
      setShow(true)
      return
    }

    // Fallback: event hasn't fired yet — listen for it
    const handler = (e: Event) => {
      e.preventDefault()
      _capturedPrompt       = e as BeforeInstallPromptEvent
      promptRef.current     = e as BeforeInstallPromptEvent
      setShow(true)
    }
    window.addEventListener('beforeinstallprompt', handler)
    return () => window.removeEventListener('beforeinstallprompt', handler)
  }, [])

  function dismiss() {
    sessionStorage.setItem('kitea-install-dismissed', 'true')
    setShow(false)
  }

  async function install() {
    const prompt = promptRef.current
    if (!prompt) return

    // Trigger the native browser install UI
    prompt.prompt()

    // Wait for the user's response — hide banner regardless of outcome
    const { outcome } = await prompt.userChoice
    console.log('[PWA] install prompt outcome:', outcome)

    sessionStorage.setItem('kitea-install-dismissed', 'true')
    promptRef.current = null
    _capturedPrompt   = null
    setShow(false)
  }

  if (!show) return null

  return (
    <div className="pwa-banner" role="status" aria-live="polite">
      <button
        className="pwa-banner-dismiss"
        onClick={dismiss}
        aria-label="Dismiss install prompt"
      >
        &#x2715;
      </button>

      <p className="pwa-banner-msg">
        {isIOS
          ? 'To install: tap the Share button then \u201cAdd to Home Screen\u201d'
          : 'Install Kitea on your home screen for the best experience'}
      </p>

      {!isIOS && (
        <div className="pwa-banner-actions">
          <button className="pwa-banner-install" onClick={install}>
            Install
          </button>
        </div>
      )}
    </div>
  )
}
