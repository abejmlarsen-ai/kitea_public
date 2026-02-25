// ─── Shop Success Page ────────────────────────────────────────────────────────
// Stripe redirects here after a successful payment with ?session_id=...

import type { Metadata } from 'next'
import Link from 'next/link'

export const metadata: Metadata = { title: 'Order Confirmed' }

type Props = {
  searchParams: Promise<{ session_id?: string }>
}

export default async function SuccessPage({ searchParams }: Props) {
  const { session_id } = await searchParams
  // Show just the last 8 chars as a short order reference
  const orderRef = session_id ? session_id.slice(-8).toUpperCase() : null

  return (
    <div className="shop-result-page">
      <div className="shop-result-container">
        <div className="shop-result-icon">✓</div>
        <h1>Order Confirmed!</h1>
        <p>Thank you for your purchase. Your order has been placed successfully.</p>

        {orderRef && (
          <p className="shop-result-session">
            Order reference: <code>{orderRef}</code>
          </p>
        )}

        <p>You&apos;ll receive a confirmation email shortly.</p>

        <div className="shop-result-actions">
          <Link href="/shop" className="shop-result-btn">
            Continue Shopping
          </Link>
          <Link href="/library" className="shop-result-btn shop-result-btn--secondary">
            View Library
          </Link>
        </div>
      </div>
    </div>
  )
}
