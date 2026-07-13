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

      const { data: existing, error: fetchErr } = await supabase
        .from('hunt_progress')
        .select('id')
        .eq('user_id', userId)
        .eq('hunt_location_id', huntLocationId)
        .maybeSingle()
      if (fetchErr) throw fetchErr

      const { error: saveErr } = existing
        ? await supabase.from('hunt_progress')
            .update({ selected_path: path })
            .eq('id', existing.id)
        : await supabase.from('hunt_progress')
            .insert({ user_id: userId, hunt_location_id: huntLocationId, selected_path: path })
      if (saveErr) throw saveErr

      router.push(`/hunts/${huntLocationId}/${path}${scanned ? '?scanned=true' : ''}`)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not save your choice. Please try again.')
      setSaving(null)
    }
  }

  return (
    <div style={{ color: '#0B2838', minHeight: '100vh' }}>

      {/* ── STICKY HEADER ─────────────────────────────────────────────────── */}
      <div style={{
        position: 'sticky', top: 0, zIndex: 100,
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '0.75rem 1.5rem', background: '#F5F0E8', borderBottom: '1px solid #8A7A5E',
      }}>
        <img src="/images/Kitea Logo Only.png" alt="Kitea" style={{ height: '36px', width: 'auto' }} />
        <a href="/map" className="hunt-btn-return">← Return to Map</a>
      </div>

      {/* ── HERO ─────────────────────────────────────────────────────────── */}
      <section style={{ background: '#F5F0E8', padding: '2.5rem 1.5rem 1.25rem', textAlign: 'center' }}>
        <h1 style={{ fontSize: 'clamp(1.75rem,6vw,2.5rem)', fontWeight: 700, margin: '0 0 0.5rem' }}>
          {huntName}
        </h1>
        <p style={{ fontSize: '1rem', color: '#8A7A5E', margin: 0 }}>
          How do you want to solve this hunt?
        </p>
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
            {saving === 'coded' ? 'Loading…' : 'Coded Clue'}
          </button>
          <p className="hunt-entry-caption">
            Decode the riddle — a picture, a written clue, and an answer box.
          </p>
        </div>

        <div className="hunt-entry-half">
          <button
            className="hunt-entry-bubble"
            onClick={() => choosePath('location')}
            disabled={saving !== null}
          >
            {saving === 'location' ? 'Loading…' : 'Location based Clue'}
          </button>
          <p className="hunt-entry-caption">
            Answer location-based questions to work out where to go.
          </p>
        </div>
      </div>
    </div>
  )
}
