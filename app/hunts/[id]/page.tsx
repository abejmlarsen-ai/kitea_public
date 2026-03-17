import { createClient, createServiceRoleClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import HuntPageClient from './HuntPageClient'

// In Next.js 15+ params is a Promise and must be awaited before use.
// Accessing params.id without awaiting returns undefined, which gets
// coerced to the string "undefined" when passed to Supabase as a UUID.
export default async function HuntPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  console.log('[hunt/page] fetching huntLocation for id:', id)

  const { data: huntLocation, error: locationError } = await supabase
    .from('hunt_locations')
    .select('id, name, description, total_scans, latitude, longitude')
    .eq('id', id)
    .single()

  console.log('[hunt/page] huntLocation:', (huntLocation as { name?: string } | null)?.name ?? null, '| error:', locationError?.message ?? null)

  // Render an inline error instead of redirecting — prevents /hunts -> /map bounce
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

  // ── Fetch progress data directly via service-role client ──────────────────
  // Direct queries — no internal HTTP fetch (unreliable on Vercel preview).
  // DB schema notes:
  //   hunt_clues    : image_url, text_content, code_type_hint, initial_clue_hint
  //                   (reveal_image_url / reveal_directions do NOT exist)
  //   hunt_attempts : user_id, question_id, attempt_count, solved
  //                   (no hunt_location_id column — scope via question_id set)
  let progressData = null
  try {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const db = createServiceRoleClient() as any

    // Fetch clue, questions, and progress first
    const [clueRes, questionsRes, progressRes] = await Promise.all([
      db
        .from('hunt_clues')
        .select('image_url, text_content, code_type_hint, initial_clue_hint')
        .eq('hunt_location_id', id)
        .maybeSingle(),
      db
        .from('hunt_questions')
        .select('id, question_text, order_index, hint_after_attempts')
        .eq('hunt_location_id', id)
        .order('order_index', { ascending: true }),
      db
        .from('hunt_progress')
        .select('current_question_index, location_revealed, completed_at')
        .eq('user_id', user.id)
        .eq('hunt_location_id', id)
        .maybeSingle(),
    ])

    if (clueRes.error)      console.error('[hunt/page] clue error:',      clueRes.error.message)
    if (questionsRes.error) console.error('[hunt/page] questions error:',  questionsRes.error.message)
    if (progressRes.error)  console.error('[hunt/page] progress error:',   progressRes.error.message)

    const clue      = clueRes.data
    const questions = (questionsRes.data ?? []) as { id: string; question_text: string; order_index: number; hint_after_attempts: number }[]
    const progress  = progressRes.data

    console.log('[hunt/page] clue:', !!clue, '| questions:', questions.length, '| progress:', progress ? `idx:${progress.current_question_index}` : 'none')

    // Fetch attempts scoped to this hunt's question IDs.
    // hunt_attempts has no hunt_location_id column — filter via question_id set.
    // The initial-clue attempt is stored with question_id = hunt location id.
    const questionIds = questions.map(q => q.id)
    const scopedIds   = [...questionIds, id]

    const attemptsRes = await db
      .from('hunt_attempts')
      .select('question_id, attempt_count, solved')
      .eq('user_id', user.id)
      .in('question_id', scopedIds)

    if (attemptsRes.error) console.error('[hunt/page] attempts error:', attemptsRes.error.message)
    console.log('[hunt/page] attempts:', attemptsRes.data?.length ?? 0)

    const allAttempts = (attemptsRes.data ?? []) as { question_id: string; attempt_count: number; solved: boolean }[]

    const initialClueRow   = allAttempts.find(a => a.question_id === id)
    const questionAttempts = allAttempts.filter(a => a.question_id !== id)

    progressData = {
      clue: clue ? {
        image_url:      clue.image_url      ?? null,
        text_content:   clue.text_content   ?? null,
        code_type_hint: clue.code_type_hint ?? null,
      } : null,
      questions,
      progress,
      attempts: questionAttempts,
      initial_clue_hint:     clue?.initial_clue_hint     ?? null,
      initial_clue_attempts: initialClueRow?.attempt_count ?? 0,
    }

    console.log('[hunt/page] progressData built: clue=', !!clue,
      '| initial_clue_hint=', !!progressData.initial_clue_hint,
      '| initial_clue_attempts=', progressData.initial_clue_attempts)
  } catch (err) {
    console.error('[hunt/page] progress fetch failed:', err)
  }

  return (
    <HuntPageClient
      huntLocation={huntLocation}
      userId={user.id}
      progressData={progressData}
    />
  )
}
