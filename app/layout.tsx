import type { Metadata, Viewport } from 'next'
import Script from 'next/script'
import './globals.css'
import Header from '@/components/layout/Header'
import Footer from '@/components/layout/Footer'
import ThirdwebAppProvider from '@/components/providers/ThirdwebProvider'
import PWAInstallPrompt from '@/components/PWAInstallPrompt'
import LogoWatermark    from '@/components/ui/LogoWatermark'

export const metadata: Metadata = {
  title: {
    template: '%s | Kitea',
    default:  'Kitea',
  },
  description:
    'Kitea — a physical NFC tag scavenger hunt where scanning tags unlocks NFTs and exclusive merchandise.',
  manifest: '/manifest.json',
  icons: {
    apple: [{ url: '/icons/apple-touch-icon.png', sizes: '180x180', type: 'image/png' }],
  },
  appleWebApp: {
    capable:        true,
    statusBarStyle: 'black-translucent',
    title:          'Kitea',
  },
}

export const viewport: Viewport = {
  width:        'device-width',
  initialScale: 1,
  themeColor:   '#0a0a0a',
  viewportFit:  'cover',
}

const SW_SCRIPT = [
  "if ('serviceWorker' in navigator) {",
  "  window.addEventListener('load', function () {",
  "    navigator.serviceWorker.register('/sw.js')",
  "      .then(function (reg) { console.log('[SW] registered:', reg.scope); })",
  "      .catch(function (err) { console.error('[SW] registration failed:', err); });",
  "  });",
  "}",
].join('\n')

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className="theme-dark">
        <ThirdwebAppProvider>
          <div style={{ position: 'relative' }}>
            <Header />
            {children}
            <Footer />
            <PWAInstallPrompt />
          </div>
          <LogoWatermark />
        </ThirdwebAppProvider>

        {/* Register service worker */}
        <Script
          id="register-sw"
          strategy="afterInteractive"
          dangerouslySetInnerHTML={{ __html: SW_SCRIPT }}
        />
      </body>
    </html>
  )
}
