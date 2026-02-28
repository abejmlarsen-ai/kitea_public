import type { Metadata, Viewport } from 'next'
import './globals.css'
import Header from '@/components/layout/Header'
import Footer from '@/components/layout/Footer'
import ThirdwebAppProvider from '@/components/providers/ThirdwebProvider'

export const metadata: Metadata = {
  title: {
    template: '%s | Kitea',
    default: 'Kitea',
  },
  description:
    'Kitea — a physical NFC tag scavenger hunt where scanning tags unlocks NFTs and exclusive merchandise.',
}

// Tells mobile browsers to render at device width (fixes oversized text on phones)
export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className="theme-dark">
        <ThirdwebAppProvider>
          <Header />
          {children}
          <Footer />
        </ThirdwebAppProvider>
      </body>
    </html>
  )
}
