// ─── Scan result handoff ───────────────────────────────────────────────────
// /api/nfc/scan now returns everything the post-scan collectible popup needs
// (scan_number, hunt_name, edition_number, a pre-signed art image URL). The
// scan page stashes that response here right before redirecting to the hunt
// page, so the popup can render straight from it — no client-side Supabase
// queries or re-signing on arrival. sessionStorage (not the URL) keeps the
// signed image URL out of the browser history/referrer.
const KEY = 'kitea:lastScanResult'

export interface ScanResultPayload {
  scan_number:      number
  total_scanners:   number
  hunt_name:        string | null
  edition_number:   number | null
  art_image_url:    string | null
}

export function saveScanResult(payload: ScanResultPayload) {
  try {
    sessionStorage.setItem(KEY, JSON.stringify(payload))
  } catch {
    // sessionStorage unavailable (private mode, etc.) — the popup will just
    // fall back to its generic "collectible added" message.
  }
}

export function consumeScanResult(): ScanResultPayload | null {
  try {
    const raw = sessionStorage.getItem(KEY)
    if (!raw) return null
    sessionStorage.removeItem(KEY)
    return JSON.parse(raw) as ScanResultPayload
  } catch {
    return null
  }
}
