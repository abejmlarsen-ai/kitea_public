'use client'

import { useState, useEffect, useCallback } from 'react'
import Image from 'next/image'
import { createClient } from '@/lib/supabase/client'

// Kitea Ao "Dune to Deep" — button gradient #4A7C8C → #0B2838, text #F2EDE3.
// Reveal image/text come from the same hunt_reveals columns and the same
// hunt-assets-private signing pattern Hunt 1's /hunts/[id]/reveal page uses.
// Persistence reuses hunt_progress.location_revealed — the same column the
// existing solve-triggered reveal already relies on — so once pressed, the
// reveal stays unlocked for that user across page loads.

interface RevealContent {
  directions: string | null
  imageUrl:   string | null
}
interface Props {
  huntLocationId:  string
  userId:          string
  hasRevealData:   boolean
  initialRevealed: boolean
  // Pre-fetched + pre-signed server-side by the page when initialRevealed is
  // true, so an already-revealed user doesn't pay for a client-side
  // hunt_reveals query plus a separate signing round trip on every mount.
  // Null when not yet revealed (or, as a safety net, if the server somehow
  // didn't have it) — loadContent() below still covers that case.
  initialRevealContent: { directions: string | null; imageUrl: string | null } | null
  // True once the hunt has a real (non-[PLACEHOLDER]) clue/answer — once the
  // puzzle is actually solvable, this manual shortcut goes away and players
  // have to earn the reveal by playing the clue.
  clueIsReal:      boolean
}

async function signImage(path: string): Promise<string | null> {
  const res  = await fetch(`/api/collectible/image?path=${encodeURIComponent(path)}`)
  const data = await res.json().catch(() => null)
  return data?.signedUrl ?? null
}

export default function RevealLocationButton({
  huntLocationId, userId, hasRevealData, initialRevealed, initialRevealContent, clueIsReal,
}: Props) {
  const [revealed, setRevealed] = useState(initialRevealed)
  const [content,  setContent]  = useState<RevealContent | null>(initialRevealContent)
  const [loading,  setLoading]  = useState(false)
  const [error,    setError]    = useState<string | null>(null)

  const loadContent = useCallback(async () => {
    const supabase = createClient()
    const { data, error: fetchErr } = await supabase
      .from('hunt_reveals')
      .select('reveal_directions, reveal_image_url')
      .eq('hunt_location_id', huntLocationId)
      .maybeSingle()

    if (fetchErr || !data) {
      setError('Could not load the reveal. Please try again.')
      return
    }

    let imageUrl = data.reveal_image_url
    if (imageUrl && !imageUrl.startsWith('http')) {
      imageUrl = await signImage(imageUrl)
    }
    setContent({ directions: data.reveal_directions, imageUrl })
  }, [huntLocationId])

  // Already revealed in a previous session — content state above already
  // seeds from initialRevealContent. Only fall back to fetching client-side
  // if the server somehow didn't supply it.
  useEffect(() => {
    if (initialRevealed && !initialRevealContent) { void loadContent() }
  }, [initialRevealed, initialRevealContent, loadContent])

  async function handleReveal() {
    if (loading || revealed) return
    setLoading(true)
    setError(null)
    try {
      const supabase = createClient()
      const { error: saveErr } = await supabase
        .from('hunt_progress')
        .upsert(
          { user_id: userId, hunt_location_id: huntLocationId, location_revealed: true },
          { onConflict: 'user_id,hunt_location_id' }
        )
      if (saveErr) throw saveErr

      await loadContent()
      setRevealed(true)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not reveal location. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  if (!hasRevealData || clueIsReal) return null

  return (
    <section style={{ background: '#F5F0E8', padding: '2rem 1.5rem 3rem' }}>
      <div style={{ maxWidth: '640px', margin: '0 auto' }}>
        {!revealed ? (
          <>
            <button
              onClick={() => { void handleReveal() }}
              disabled={loading}
              style={{
                display: 'block', width: '100%', padding: '0.85rem',
                background: 'linear-gradient(135deg, #4A7C8C 0%, #0B2838 100%)',
                color: '#F2EDE3', border: 'none', borderRadius: '8px',
                fontSize: '1rem', fontWeight: 700,
                cursor: loading ? 'default' : 'pointer',
                opacity: loading ? 0.7 : 1, transition: 'opacity 0.2s ease',
              }}
            >
              {loading ? 'Revealing…' : 'Reveal location'}
            </button>
            {error && (
              <p style={{ marginTop: '0.75rem', color: '#C4A882', fontSize: '0.9rem', fontWeight: 600, textAlign: 'center' }}>
                {error}
              </p>
            )}
          </>
        ) : (
          <div>
            <h2 style={{ fontSize: '1.25rem', fontWeight: 700, color: '#0B2838', margin: '0 0 1rem', textAlign: 'center' }}>
              Where to Scan
            </h2>
            {content?.directions ? (
              <p style={{ fontSize: '1rem', lineHeight: 1.7, color: '#0B2838', margin: '0 0 1.5rem', whiteSpace: 'pre-wrap', textAlign: 'center' }}>
                {content.directions}
              </p>
            ) : (
              <p style={{ fontSize: '1rem', color: '#8A7A5E', margin: '0 0 1.5rem', fontStyle: 'italic', textAlign: 'center' }}>
                Directions coming soon.
              </p>
            )}
            {content?.imageUrl ? (
              <div style={{ position: 'relative', width: '100%', height: '400px', borderRadius: '8px', overflow: 'hidden' }}>
                <Image
                  src={content.imageUrl}
                  alt="Reveal"
                  fill
                  style={{ objectFit: 'contain' }}
                  sizes="(max-width: 640px) 100vw, 640px"
                />
              </div>
            ) : (
              <div style={{
                background: '#E8DCC8', borderRadius: '8px', height: '200px',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                color: '#8A7A5E', fontSize: '0.875rem',
              }}>
                Reveal image coming soon
              </div>
            )}
          </div>
        )}
      </div>
    </section>
  )
}
