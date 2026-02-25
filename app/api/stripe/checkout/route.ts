// ─── Stripe Checkout ─────────────────────────────────────────────────────────
// POST /api/stripe/checkout
// Creates a Stripe Checkout session for a product unlock.

import { NextResponse, type NextRequest } from 'next/server'
import { createServerClient, type CookieOptions } from '@supabase/ssr'
import { cookies } from 'next/headers'

export async function POST(request: NextRequest) {
  const cookieStore = await cookies()
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() { return cookieStore.getAll() },
        setAll(cookiesToSet: { name: string; value: string; options: CookieOptions }[]) {
          cookiesToSet.forEach(({ name, value, options }) =>
            cookieStore.set(name, value, options)
          )
        },
      },
    }
  )

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return NextResponse.json({ error: 'Unauthorised' }, { status: 401 })
  }

  const body = await request.json().catch(() => ({}))
  const { productId } = body as { productId?: string }

  if (!productId) {
    return NextResponse.json({ error: 'Missing productId' }, { status: 400 })
  }

  // TODO: create Stripe checkout session
  return NextResponse.json({ ok: true, message: 'Checkout stub', url: null })
}
