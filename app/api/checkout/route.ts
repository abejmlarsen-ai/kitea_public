// ─── Checkout API ─────────────────────────────────────────────────────────────
// POST /api/checkout
// Accepts { price_id, product_id } and creates a Stripe Checkout session.

import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { price_id, product_id } = body

    if (!price_id || !product_id) {
      return NextResponse.json(
        { error: 'Missing price_id or product_id' },
        { status: 400 }
      )
    }

    // Stripe not yet configured — return a clear error so the page handles it gracefully
    return NextResponse.json(
      { error: 'Stripe not yet configured' },
      { status: 501 }
    )
  } catch {
    return NextResponse.json(
      { error: 'Invalid request' },
      { status: 400 }
    )
  }
}
