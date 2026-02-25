import type { Metadata } from 'next'
import './globals.css'
import Header from '@/components/layout/Header'
import Footer from '@/components/layout/Footer'

export const metadata: Metadata = {
  title: {
    template: '%s | Kitea',
    default: 'Kitea',
  },
  description:
    'Kitea — a physical NFC tag scavenger hunt where scanning tags unlocks NFTs and exclusive merchandise.',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className="theme-dark">
        <Header />
        {children}
        <Footer />
      </body>
    </html>
  )
}
