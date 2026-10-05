// ─── NFC tag UID format ───────────────────────────────────────────────────────
// Letters, digits, colon, underscore, hyphen, up to 64 chars. Covers
// "04:6A:61:22:49:68:80", "046A61224968" and test tags ("TEST:<id>"). No
// commas, dots, parens, quotes or spaces, so a UID can never smuggle filter
// syntax into a database query or anything else into a cookie or URL.

export const TAG_UID_PATTERN = /^[A-Za-z0-9:_-]{1,64}$/

export function isValidTagUid(value: unknown): value is string {
  return typeof value === 'string' && TAG_UID_PATTERN.test(value)
}
