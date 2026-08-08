// ─── Signed URL cache ──────────────────────────────────────────────────────
// Signed URLs from Supabase Storage are valid for a full hour, but pages like
// the hunt clue and the library grid were re-signing the same paths on every
// single render — a Storage API round trip that gains nothing since the
// underlying image essentially never changes. This caches by path in memory
// for a slice of that lifetime (comfortably short of the real 1hr expiry) so
// repeat renders within a warm server instance skip the round trip entirely.
//
// Process-memory only — resets on cold start/redeploy, which is fine: it's a
// latency optimisation for warm instances, not a correctness guarantee.
import type { SupabaseClient } from '@supabase/supabase-js'

const SIGN_TTL_SECONDS   = 3600 // matches the actual signed URL lifetime
const CACHE_TTL_MS       = 15 * 60 * 1000 // reuse for 15 min, well inside that

const cache = new Map<string, { url: string; expiresAt: number }>()

export async function getCachedSignedUrl(
  storage: SupabaseClient['storage'],
  bucket: string,
  path: string
): Promise<string | null> {
  const key = `${bucket}:${path}`
  const hit = cache.get(key)
  if (hit && hit.expiresAt > Date.now()) {
    return hit.url
  }

  const { data, error } = await storage.from(bucket).createSignedUrl(path, SIGN_TTL_SECONDS)
  if (error || !data?.signedUrl) {
    return null
  }

  cache.set(key, { url: data.signedUrl, expiresAt: Date.now() + CACHE_TTL_MS })
  return data.signedUrl
}
