// ─── Safe post-auth redirect ──────────────────────────────────────────────────
// Every redirect target that arrives from a URL (?redirect=, ?next=, …) must go
// through safeRedirect() before it is used. It only lets through same-origin
// relative paths; anything else falls back to DEFAULT_REDIRECT.
//
// Accepted:  "/library", "/scan?tag=04%3A6A", "/hunts/abc#clue"
// Rejected:  "//evil.com", "/\evil.com", "https://evil.com", "javascript:…",
//            "%2F%2Fevil.com", "/%2F%2Fevil.com", "/%5Cevil.com", "/\t/evil.com",
//            "", null, and anything that fails to parse
//
// Dependency-free so it can run in client components and route handlers alike.

export const DEFAULT_REDIRECT = '/library'

// How many rounds of percent-decoding to inspect. Covers single and double
// encoding (e.g. "%252F%252F" → "%2F%2F" → "//").
const MAX_DECODE_ROUNDS = 3

// C0 controls, DEL and C1 controls. Browsers strip tab/CR/LF from URLs, so
// "/\t/evil.com" would otherwise become "//evil.com".
const CONTROL_CHARS = /[\u0000-\u001F\u007F-\u009F]/

// Placeholder origin used only to check that the path resolves on-site.
const CHECK_ORIGIN = 'https://same-origin.invalid'

function isSafeForm(value: string): boolean {
  if (CONTROL_CHARS.test(value)) return false
  if (value.includes('\\')) return false   // "/\evil.com" is treated as "//evil.com"
  if (!value.startsWith('/')) return false   // relative paths and schemes ("https:", "javascript:")
  if (value.startsWith('//')) return false   // protocol-relative URL
  return true
}

/**
 * Returns `target` if it is a same-origin relative path, otherwise `fallback`.
 * The returned value always starts with a single "/", so it is safe to pass to
 * router.push() or to append to the site origin in a server redirect.
 */
export function safeRedirect(
  target: string | null | undefined,
  fallback: string = DEFAULT_REDIRECT,
): string {
  if (typeof target !== 'string' || target === '') return fallback

  // Check the raw value and each decoded form, so encoded variants of "//",
  // "/\", schemes and control characters are caught too.
  let current = target
  for (let round = 0; round <= MAX_DECODE_ROUNDS; round++) {
    if (!isSafeForm(current)) return fallback

    let decoded: string
    try {
      decoded = decodeURIComponent(current)
    } catch {
      return fallback   // malformed percent-encoding
    }
    if (decoded === current) break
    current = decoded
  }

  // Final check: the URL parser must resolve it to this origin.
  let url: URL
  try {
    url = new URL(target, CHECK_ORIGIN)
  } catch {
    return fallback
  }
  if (url.origin !== CHECK_ORIGIN) return fallback

  return `${url.pathname}${url.search}${url.hash}`
}
