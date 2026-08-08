'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

interface Props {
  huntLocationId: string
  huntName:       string
  userId:         string
  scanned:        boolean
}

type Path = 'coded' | 'location'

export default function HuntEntryClient({ huntLocationId, huntName, userId, scanned }: Props) {
  const router = useRouter()
  const [saving, setSaving] = useState<Path | null>(null)
  const [error,  setError]  = useState<string | null>(null)

  async function choosePath(path: Path) {
    if (saving) return
    setSaving(path)
    setError(null)

    try {
      const supabase = createClient()

      const { error: saveErr } = await supabase
        .from('hunt_progress')
        .upsert(
          { user_id: userId, hunt_location_id: huntLocationId, selected_path: path },
          { onConflict: 'user_id,hunt_location_id' }
        )
      if (saveErr) throw saveErr

      router.push(`/hunts/${huntLocationId}/${path}${scanned ? '?scanned=true' : ''}`)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not save your choice. Please try again.')
      setSaving(null)
    }
  }

  return (
    <div style={{ color: '#0B2838', minHeight: '100vh' }}>

      {/* ── HERO ─────────────────────────────────────────────────────────── */}
      <section style={{ padding: '2.5rem 1.5rem 1.25rem', display: 'flex', justifyContent: 'center' }}>
        <div className="hunt-entry-title-card">
          <h1 className="hunt-entry-title">{huntName}</h1>
          <p className="hunt-entry-subtitle">How do you want to solve this hunt?</p>
        </div>
      </section>

      {error && (
        <p style={{ textAlign: 'center', color: '#C4A882', fontWeight: 600, padding: '0 1.5rem 1rem' }}>
          {error}
        </p>
      )}

      {/* ── TWO-BUBBLE SPLIT ─────────────────────────────────────────────── */}
      <div className="hunt-entry-split">
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
