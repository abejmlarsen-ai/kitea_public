// ─── Shop Cancel Page ─────────────────────────────────────────────────────────
// Stripe redirects here when the user abandons the checkout flow.

import type { Metadata } from 'next'
import Link from 'next/link'

export const metadata: Metadata = { title: 'Checkout Cancelled' }

export default function CancelPage() {
  return (
    <div className="shop-result-page">
      <div className="shop-result-container">
        <div className="shop-result-icon shop-result-icon--cancel">✕</div>
        <h1>Checkout Cancelled</h1>
        <p>Your order was not completed. No charges have been made.</p>
        <p>Your cart items are still saved — head back to finish whenever you&apos;re ready.</p>

        <div className="shop-result-actions">
          <Link href="/shop" className="shop-result-btn">
            Return to Shop
          </Link>
        </div>
      </div>
    </div>
  )
}
