// ─── Pending-claim cookie ─────────────────────────────────────────────────────
// When a signed-out user scans a tag, /scan stores the tag UID in this cookie
// (via POST /api/nfc/pending-claim, since httpOnly cookies can't be set from
// the client). Whichever auth path they take next — login, signup, email
// confirmation — can then send them back to /scan?tag=<UID> to finish the
// claim, even when a ?redirect / ?next value was lost along the way.
//
// Read by:    app/auth/callback/route.ts, middleware.ts
// Cleared by: app/api/nfc/scan/route.ts once the claim is settled
//
// Dependency-free apart from sibling helpers, so it runs in middleware too.

import { safeRedirect } from '@/lib/auth/safeRedirect'
import { isValidTagUid } from '@/lib/hunts/tagUid'

export const PENDING_CLAIM_COOKIE = 'kitea_pending_claim'

// 30 minutes, in seconds
export const PENDING_CLAIM_MAX_AGE = 30 * 60

export const pendingClaimCookieOptions = {
  httpOnly: true,
  // Secure everywhere except `next dev`, where Safari refuses Secure cookies
  // on http://localhost.
  secure:   process.env.NODE_ENV !== 'development',
  sameSite: 'lax' as const,
  path:     '/',
  maxAge:   PENDING_CLAIM_MAX_AGE,
}

/** Same attributes with an immediate expiry — use to clear the cookie. */
export const clearedPendingClaimCookieOptions = {
  ...pendingClaimCookieOptions,
  maxAge: 0,
}

/** The tag UID from a cookie value, or null if missing or malformed. */
export function readPendingClaim(cookieValue: string | null | undefined): string | null {
  return isValidTagUid(cookieValue) ? cookieValue : null
}

/** "/scan?tag=<UID>" for a pending claim, or null if there isn't a valid one. */
export function pendingClaimScanPath(cookieValue: string | null | undefined): string | null {
  const uid = readPendingClaim(cookieValue)
  if (!uid) return null
  const path = safeRedirect(`/scan?tag=${encodeURIComponent(uid)}`, '')
  return path || null
}
