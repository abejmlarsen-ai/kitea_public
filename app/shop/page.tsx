// ─── Shop Page (Protected) ───────────────────────────────────────────────────

import type { Metadata } from 'next'
import Image from 'next/image'
import LogoutButton from '@/components/auth/LogoutButton'

export const metadata: Metadata = { title: 'Shop' }

export default function ShopPage() {
  return (
    <>
      <section className="logo-hero logo-hero--home">
        <Image
          src="/images/Kitea Logo Only.png"
          alt="Kitea logo"
          width={300}
          height={300}
          priority
          style={{ objectFit: 'contain', maxHeight: '60vh', width: 'auto' }}
        />
      </section>

      <section className="section_1 section_1--home">
        <div className="container">
          <h2>Shop</h2>
          <p>Shop content coming soon.</p>
        </div>
        <LogoutButton />
      </section>
    </>
  )
}
