// ─── Stripe Webhook ───────────────────────────────────────────────────────────
// POST /api/stripe/webhook
// Receives Stripe events (e.g. checkout.session.completed) and updates
// the database to record fulfilled product unlocks.
// Requires: STRIPE_WEBHOOK_SECRET env var.

import { NextResponse, type NextRequest } from 'next/server'

export async function POST(request: NextRequest) {
  const signature = request.headers.get('stripe-signature')
  if (!signature) {
    return NextResponse.json({ error: 'Missing signature' }, { status: 400 })
  }

  const rawBody = await request.text()

  // TODO: verify signature and handle events
  // const stripe  = new Stripe(process.env.STRIPE_SECRET_KEY!)
  // const event   = stripe.webhooks.constructEvent(rawBody, signature, process.env.STRIPE_WEBHOOK_SECRET!)
  // switch (event.type) { case 'checkout.session.completed': ... }

  return NextResponse.json({ received: true })
}
