// ─── Pending-claim cookie ─────────────────────────────────────────────────────
// POST /api/nfc/pending-claim   { tag_uid }
// Called by /scan when a signed-out user scans a tag, before it sends them to
// log in. Stores the UID in an httpOnly cookie (which the client-only scan page
// can't set itself) so every auth path can return them to /scan?tag=<UID>.
// See lib/auth/pendingClaim.ts. Public route — no session needed (middleware
// passes /api/nfc/* straight through).
import { NextRequest, NextResponse } from 'next/server'
import { isValidTagUid } from '@/lib/hunts/tagUid'
import { PENDING_CLAIM_COOKIE, pendingClaimCookieOptions } from '@/lib/auth/pendingClaim'

export async function POST(request: NextRequest) {
  // Same-origin only: another site must not be able to plant a claim.
  const origin = request.headers.get('origin')
  if (origin && origin !== request.nextUrl.origin) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  let tag_uid: unknown
  try {
    ({ tag_uid } = await request.json())
  } catch {
    return NextResponse.json({ error: 'Invalid request' }, { status: 400 })
  }

  if (!isValidTagUid(tag_uid)) {
    return NextResponse.json({ error: 'Invalid tag ID' }, { status: 400 })
  }

  const response = new NextResponse(null, { status: 204 })
  response.cookies.set(PENDING_CLAIM_COOKIE, tag_uid, pendingClaimCookieOptions)
  return response
}
