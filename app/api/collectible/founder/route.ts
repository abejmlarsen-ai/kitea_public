// ─── Founder Collectible Route ──────────────────────────────────────────────
// POST /api/collectible/founder
// Awaited by SignupForm (right after a password signup that returns a session)
// and by LoginForm (as a backstop for accounts that predate the signup hook).
// The caller authenticates with its Supabase access token; awarding itself is
// idempotent and lives in lib/collectibles/founder.ts.
import { NextRequest, NextResponse } from 'next/server'
import { createServiceRoleClient } from '@/lib/supabase/server'
import { awardFounderCollectible } from '@/lib/collectibles/founder'

export async function POST(request: NextRequest) {
  const authHeader = request.headers.get('authorization')
  if (!authHeader) {
    return NextResponse.json({ ok: false, error: 'Not authenticated' }, { status: 401 })
  }

  const token = authHeader.replace('Bearer ', '')
  const { data: { user }, error: userError } = await createServiceRoleClient().auth.getUser(token)

  if (userError || !user) {
    return NextResponse.json({ ok: false, error: 'Invalid session' }, { status: 401 })
  }

  const result = await awardFounderCollectible(user.id)

  // Awarding is best-effort. On failure we still answer 200 so the caller's
  // signup/login flow proceeds; the failure is already logged inside
  // awardFounderCollectible and the next login retries the same path.
  if (!result.ok) {
    return NextResponse.json({ ok: false }, { status: 200 })
  }

  return NextResponse.json({ ok: true, status: result.status })
}
