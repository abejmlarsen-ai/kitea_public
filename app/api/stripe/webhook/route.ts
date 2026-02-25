// ─── Stripe Webhook ───────────────────────────────────────────────────────────
// POST /api/stripe/webhook
// Receives and verifies Stripe events, then updates the database.
//
// Env vars required:
//   STRIPE_SECRET_KEY       — used to initialise the Stripe client
//   STRIPE_WEBHOOK_SECRET   — used to verify the request came from Stripe
//
// Register this endpoint in your Stripe dashboard:
//   https://dashboard.stripe.com/webhooks
//   URL: https://kitea-ao.com/api/stripe/webhook
//   Events to listen for: checkout.session.completed

import { NextRequest, NextResponse } from 'next/server'
import Stripe from 'stripe'
import { createClient } from '@supabase/supabase-js'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2026-01-28.clover'
})

export async function POST(request: NextRequest) {
  const body = await request.text()
  const signature = request.headers.get('stripe-signature')!

  let event: Stripe.Event

  // Step 1 — Verify the webhook came from Stripe and not someone else
  try {
    event = stripe.webhooks.constructEvent(
      body,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET!
    )
  } catch (error) {
    console.error('Webhook signature verification failed:', error)
    return NextResponse.json(
      { error: 'Invalid signature' },
      { status: 400 }
    )
  }

  // Step 2 — Create Supabase admin client
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )

  // Step 3 — Handle the payment completed event
  if (event.type === 'checkout.session.completed') {
    const session = event.data.object as Stripe.Checkout.Session

    // Update the order status to paid
    await supabase
      .from('orders')
      .update({
        status: 'paid',
        stripe_payment_intent: session.payment_intent as string,
        shipping_address: session.collected_information?.shipping_details ?? null,
        updated_at: new Date().toISOString()
      })
      .eq('stripe_session_id', session.id)

    console.log(`Order paid: ${session.id}`)
  }

  // Step 4 — Handle failed payments
  if (event.type === 'payment_intent.payment_failed') {
    const paymentIntent = event.data.object as Stripe.PaymentIntent

    await supabase
      .from('orders')
      .update({
        status: 'failed',
        updated_at: new Date().toISOString()
      })
      .eq('stripe_payment_intent', paymentIntent.id)

    console.log(`Payment failed: ${paymentIntent.id}`)
  }

  return NextResponse.json({ received: true })
}
