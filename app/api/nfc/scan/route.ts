// ─── NFC Scan Verification ────────────────────────────────────────────────────
// POST /api/nfc/scan
// Verifies a scanned NFC tag UID and records the scan in the database.

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
  const { uid } = body as { uid?: string }

  if (!uid) {
    return NextResponse.json({ error: 'Missing uid' }, { status: 400 })
  }

  // TODO: look up the tag, record the scan, trigger NFT mint
  // const { data: tag } = await supabase.from('nfc_tags').select('*').eq('uid', uid).single()

  return NextResponse.json({ ok: true, message: 'Scan recorded (stub)' })
}
