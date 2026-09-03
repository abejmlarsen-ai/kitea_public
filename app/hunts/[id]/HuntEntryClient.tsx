'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

interface Props {
  huntLocationId: string
  huntName:       string
  scanned:        boolean
}

type Path = 'coded' | 'location'

// The chosen path is never persisted — the user re-picks it every time this
// page loads, so this is purely local view state driving the navigation.
export default function HuntEntryClient({ huntLocationId, huntName, scanned }: Props) {
  const router = useRouter()
  const [saving, setSaving] = useState<Path | null>(null)

  function choosePath(path: Path) {
    if (saving) return
    setSaving(path)
    router.push(`/hunts/${huntLocationId}/${path}${scanned ? '?scanned=true' : ''}`)
  }

  return (
    <div style={{ color: '#0B2838', minHeight: '100vh' }}>

      {/* ── TWO-BUBBLE SPLIT ─────────────────────────────────────────────── */}
      <div className="hunt-entry-split">
        {/* Overlaps the seam between the two halves — see .hunt-entry-heading-bubble */}
        <div className="hunt-entry-heading-bubble">
          <span className="hunt-entry-heading-name">{huntName}</span>
          <span className="hunt-entry-heading-sub">How do you want to find this?</span>
        </div>

        <div className="hunt-entry-half">
          <button
            className="hunt-entry-bubble"
            onClick={() => choosePath('coded')}
            disabled={saving !== null}
          >
            <span className="hunt-entry-bubble-label">
              {saving === 'coded' ? 'Loading…' : 'Coded Clue'}
            </span>
            <span className="hunt-entry-bubble-desc">
              Decode the riddle — a picture, a written clue, and an answer box.
            </span>
          </button>
        </div>

        <div className="hunt-entry-half">
          <button
            className="hunt-entry-bubble"
            onClick={() => choosePath('location')}
            disabled={saving !== null}
          >
            <span className="hunt-entry-bubble-label">
              {saving === 'location' ? 'Loading…' : 'Location based Clue'}
            </span>
            <span className="hunt-entry-bubble-desc">
              Answer location-based questions to work out where to go.
            </span>
          </button>
        </div>
      </div>
    </div>
  )
}
