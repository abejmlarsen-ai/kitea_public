import { createClient, createServiceRoleClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import HuntPageClient from './HuntPageClient'

export default async function HuntPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  const { data: huntLocation, error: locationError } = await supabase
    .from('hunt_locations')
    .select('id, name, description, total_scans, latitude, longitude')
    .eq('id', id)
    .single()

  if (!huntLocation) {
    return (
      <div style={{
        display: 'flex', flexDirection: 'column', alignItems: 'center',
        justifyContent: 'center', minHeight: '100vh',
        background: 'var(--horizon-2)', color: 'var(--horizon-7)', padding: '2rem', textAlign: 'center',
      }}>
        <h1 style={{ fontSize: '1.5rem', fontWeight: 700, marginBottom: '1rem' }}>Hunt not found</h1>
        <p style={{ color: 'var(--horizon-4)', marginBottom: '2rem' }}>
          {locationError ? locationError.message : 'This hunt location could not be loaded.'}
        </p>
        <a href="/map" style={{
          padding: '0.75rem 1.5rem', background: 'var(--horizon-3)', color: '#FFFFFF',
          borderRadius: '0.5rem', textDecoration: 'none', fontWeight: 600,
        }}>
          Return to Map
        </a>
      </div>
    )
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const db = createServiceRoleClient() as any

  // ── Parallel DB queries ───────────────────────────────────────────────────
  const [clueRes, hintsRes, revealsRes, progressRes, scansRes] = await Promise.all([
    db.from('hunt_clues')
      .select('image_url, text_content, code_type_hint, initial_clue_hint')
      .eq('hunt_location_id', id)
      .maybeSingle(),
    db.from('hunt_hints')
      .select('hint_1_text, hint_1_answer, hint_2_text, hint_2_answer, hint_3_text, hint_3_answer')
      .eq('hunt_location_id', id)
      .maybeSingle(),
    db.from('hunt_reveals')
      .select('reveal_image_url, reveal_directions')
      .eq('hunt_location_id', id)
      .maybeSingle(),
    db.from('hunt_progress')
      .select('current_question_index, location_revealed, completed_at')
      .eq('user_id', user.id)
      .eq('hunt_location_id', id)
      .maybeSingle(),
    db.from('scans')
      .select('id')
      .eq('user_id', user.id)
      .eq('hunt_location_id', id)
      .maybeSingle(),
  ])

  if (clueRes.error)    console.error('[hunt/page] clue error:',    clueRes.error.message)
  if (hintsRes.error)   console.error('[hunt/page] hints error:',   hintsRes.error.message)
  if (revealsRes.error) console.error('[hunt/page] reveals error:', revealsRes.error.message)

  const clue       = clueRes.data
  const hintsRow   = hintsRes.data   as Record<string, string | null> | null
  const reveals    = revealsRes.data
  const progress   = progressRes.data
  const hasScanned = !!scansRes.data

  // ── Build questions array from hunt_hints ─────────────────────────────────
  const questions: { id: string; question_text: string; order_index: number; hint_after_attempts: number }[] = []
  if (hintsRow) {
    for (let n = 1; n <= 3; n++) {
      const text = hintsRow[`hint_${n}_text`]
      if (text) {
        questions.push({
          id:                  `${id}__hint__${n}`,
          question_text:       text,
          order_index:         n - 1,
          hint_after_attempts: 3,
        })
      }
    }
  }

  // ── Fetch hunt_attempts scoped to this hunt ───────────────────────────────
  const questionIds = questions.map(q => q.id)
  const scopedIds   = [...questionIds, id]

  const attemptsRes = await db
    .from('hunt_attempts')
    .select('question_id, attempt_count, solved')
    .eq('user_id', user.id)
    .in('question_id', scopedIds.length > 0 ? scopedIds : ['__none__'])

  const allAttempts = (attemptsRes.data ?? []) as { question_id: string; attempt_count: number; solved: boolean }[]
  const initialClueRow   = allAttempts.find(a => a.question_id === id)
  const questionAttempts = allAttempts.filter(a => a.question_id !== id)

  // ── Generate signed URLs in parallel ─────────────────────────────────────
  const clueImagePath   = clue?.image_url          as string | null ?? null
  const revealImagePath = reveals?.reveal_image_url as string | null ?? null

  const [clueSignResult, revealSignResult] = await Promise.all([
    clueImagePath && !clueImagePath.startsWith('http')
      ? db.storage.from('hunt-assets-private').createSignedUrl(clueImagePath, 3600)
      : Promise.resolve({ data: clueImagePath ? { signedUrl: clueImagePath } : null }),
    revealImagePath && !revealImagePath.startsWith('http')
      ? db.storage.from('hunt-assets-private').createSignedUrl(revealImagePath, 3600)
      : Promise.resolve({ data: revealImagePath ? { signedUrl: revealImagePath } : null }),
  ])

  const signedClueImageUrl   = (clueSignResult?.data as { signedUrl?: string } | null)?.signedUrl ?? null
  const signedRevealImageUrl = (revealSignResult?.data as { signedUrl?: string } | null)?.signedUrl ?? null

  console.log('[hunt/page] clue:', !!clue, '| hints:', questions.length, '| reveals:', !!reveals,
    '| signedClue:', !!signedClueImageUrl, '| signedReveal:', !!signedRevealImageUrl)

  const progressData = {
    clue: clue ? {
      image_url:      signedClueImageUrl,
      text_content:   clue.text_content   as string | null ?? null,
      code_type_hint: clue.code_type_hint as string | null ?? null,
    } : null,
    questions,
    progress,
    attempts:              questionAttempts,
    initial_clue_hint:     clue?.initial_clue_hint     as string | null ?? null,
    initial_clue_attempts: initialClueRow?.attempt_count ?? 0,
    initial_clue_solved:   initialClueRow?.solved        ?? false,
    reveal_directions:     reveals?.reveal_directions    as string | null ?? null,
    reveal_image_url:      signedRevealImageUrl,
  }

  return (
    <HuntPageClient
      huntLocation={huntLocation}
      userId={user.id}
      progressData={progressData}
      hasScanned={hasScanned}
    />
  )
}
