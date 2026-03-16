// ─── Stripe Checkout ─────────────────────────────────────────────────────────
// POST /api/stripe/checkout
// Creates a Stripe Checkout session for a product unlock.

import { NextRequest, NextResponse } from 'next/server'
import Stripe from 'stripe'
import { createClient } from '@supabase/supabase-js'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2026-01-28.clover'
})

export async function POST(request: NextRequest) {
  try {
    // Step 1 — Get the items being purchased from the request
    const body = await request.json()
    const { items, user_id } = body

    if (!items || items.length === 0) {
      return NextResponse.json(
        { error: 'No items provided' },
        { status: 400 }
      )
    }

    // Step 2 — Create Supabase admin client
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )

    // Step 3 — Verify each product exists and is available
    // Also check scan requirements are met
    const lineItems: Stripe.Checkout.SessionCreateParams.LineItem[] = []
    for (const item of items) {
      const { data: product } = await supabase
        .from('products')
        .select('*')
        .eq('id', item.product_id)
        .eq('is_active', true)
        .single()

      if (!product) {
        return NextResponse.json(
          { error: `Product not found` },
          { status: 404 }
        )
      }

      // Check scan requirement if applicable
      if (product.requires_scan && product.required_location_id) {
        const { data: scan } = await supabase
          .from('scans')
          .select('id')
          .eq('user_id', user_id)
          .eq('location_id', product.required_location_id)
          .single()

        if (!scan) {
          return NextResponse.json(
            { error: `You need to scan the location to unlock ${product.name}` },
            { status: 403 }
          )
        }
      }

      // Build Stripe line item
      lineItems.push({
        price_data: {
          currency: 'aud',
          product_data: {
            name: product.name,
            description: product.description || undefined,
            images: product.image_url ? [product.image_url] : undefined,
          },
          unit_amount: Math.round(product.price * 100),
        },
        quantity: item.quantity || 1,
      })
    }

    // Step 4 — Resolve the site URL with scheme guaranteed.
    // NEXT_PUBLIC_SITE_URL may be missing on Vercel Preview, or set without
    // the https:// prefix. VERCEL_URL is always a bare hostname (no scheme).
    const rawSiteUrl =
      process.env.NEXT_PUBLIC_SITE_URL ||
      (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : 'http://localhost:3000')

    // Normalise: ensure there is always a scheme so Stripe doesn't reject the URL.
    const siteUrl = rawSiteUrl.startsWith('http') ? rawSiteUrl : `https://${rawSiteUrl}`

    console.log('[checkout] siteUrl debug', {
      NEXT_PUBLIC_SITE_URL: process.env.NEXT_PUBLIC_SITE_URL,
      VERCEL_URL: process.env.VERCEL_URL,
      rawSiteUrl,
      siteUrl,
    })

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: lineItems,
      mode: 'payment',
      success_url: `${siteUrl}/shop/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${siteUrl}/shop`,
      metadata: {
        user_id: user_id,
      },
      shipping_address_collection: {
        allowed_countries: ['AU', 'NZ', 'US', 'GB'],
      },
    })

    // Step 5 — Create a pending order in Supabase
    await supabase
      .from('orders')
      .insert({
        user_id: user_id,
        stripe_session_id: session.id,
        status: 'pending',
        total_amount: (session.amount_total || 0) / 100,
        currency: 'aud'
      })

    // Step 6 — Return the checkout URL to the browser
    return NextResponse.json({ url: session.url })

  } catch (error) {
    console.error('Checkout error:', error)
    return NextResponse.json(
      { error: 'Failed to create checkout session' },
      { status: 500 }
    )
  }
}
