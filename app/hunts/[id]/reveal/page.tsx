import { createClient, createServiceRoleClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import HuntNotFound from '../HuntNotFound'

// The reveal — shared destination for both the Coded Clue and Location based
// Clue paths once solved. Whether the directions/image are visible is
// decided entirely by the "Location revealed only after completion" RLS
// policy on hunt_reveals (gated on hunt_progress.location_revealed, which
// the trg_check_hunt_completion trigger flips automatically) — this page
// does no client-side or app-level completion check of its own.
export const dynamic = 'force-dynamic'

export default async function HuntRevealPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: huntLocation } = await supabase
    .from('hunt_locations')
    .select('id, name')
    .eq('id', id)
    .single()

  if (!huntLocation) {
    return <HuntNotFound />
  }

  // RLS-scoped read — returns a row only if this user has actually completed
  // a path for this hunt. No row simply means "not revealed yet".
  const { data: reveal } = await supabase
    .from('hunt_reveals')
    .select('reveal_directions, reveal_image_url')
    .eq('hunt_location_id', id)
    .maybeSingle()

  let revealImageUrl: string | null = null
  if (reveal?.reveal_image_url) {
    if (reveal.reveal_image_url.startsWith('http')) {
      revealImageUrl = reveal.reveal_image_url
    } else {
      // Signing requires the service-role storage client, but only after
      // the RLS-gated select above already authorized access to this row.
      const db = createServiceRoleClient()
      const { data: signed } = await db.storage
        .from('hunt-assets-private')
        .createSignedUrl(reveal.reveal_image_url, 3600)
      revealImageUrl = signed?.signedUrl ?? null
    }
  }

  return (
    <div className="page-theme page-theme--hunt" style={{ color: '#0B2838' }}>

      {/* ── BACK TO SELECTION ────────────────────────────────────────────── */}
      <div style={{ background: '#F5F0E8', padding: '1rem 1.5rem 0', textAlign: 'center' }}>
        <a
          href={`/hunts/${huntLocation.id}?select=1`}
          style={{ fontSize: '0.85rem', color: '#4A7C8C', fontWeight: 600, textDecoration: 'underline' }}
        >
          ← Back to selection
        </a>
      </div>

      {/* ── HERO ─────────────────────────────────────────────────────────── */}
      <section style={{ background: '#F5F0E8', padding: '2.5rem 1.5rem 1.25rem', textAlign: 'center' }}>
        <h1 style={{ fontSize: 'clamp(1.75rem,6vw,2.5rem)', fontWeight: 700, margin: '0 0 0.5rem' }}>
          {huntLocation.name}
        </h1>
      </section>

      {/* ── WHERE TO SCAN ────────────────────────────────────────────────── */}
      <section style={{ background: '#D4C4A0', padding: '2rem 1.5rem 3rem' }}>
        <div style={{ maxWidth: '640px', margin: '0 auto' }}>
          <h2 style={{ fontSize: '1.25rem', fontWeight: 700, color: '#0B2838', margin: '0 0 1rem' }}>
            Where to Scan
          </h2>

          {reveal ? (
            <>
              {reveal.reveal_directions ? (
                <p style={{ fontSize: '1rem', lineHeight: 1.7, color: '#0B2838', margin: '0 0 1.5rem', whiteSpace: 'pre-wrap' }}>
                  {reveal.reveal_directions}
                </p>
              ) : (
                <p style={{ fontSize: '1rem', color: '#8A7A5E', margin: '0 0 1.5rem', fontStyle: 'italic' }}>
                  Directions coming soon.
                </p>
              )}
              {revealImageUrl ? (
                <img
                  src={revealImageUrl}
                  alt="Reveal"
                  style={{ display: 'block', width: '100%', maxHeight: '400px', objectFit: 'contain', borderRadius: '8px', margin: '0 auto' }}
                />
              ) : (
                <div style={{
                  background: '#E8DCC8', borderRadius: '8px', height: '200px',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  color: '#8A7A5E', fontSize: '0.875rem',
                }}>
                  Reveal image coming soon
                </div>
              )}
            </>
          ) : (
            <p style={{ fontSize: '1rem', color: '#0B2838', margin: 0, lineHeight: 1.7 }}>
              This hunt hasn't been fully solved on your account yet — finish
              either the Coded Clue or Location based Clue path to unlock the
              reveal.
            </p>
          )}
        </div>
      </section>
    </div>
  )
}
