import { createClient, createServiceRoleClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import HuntPageClient from './HuntPageClient'

export default async function HuntPage({ params }: { params: { id: string } }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  console.log('[hunt/page] fetching huntLocation for id:', params.id)

  const { data: huntLocation, error: locationError } = await supabase
    .from('hunt_locations')
    .select('id, name, description, total_scans, latitude, longitude')
    .eq('id', params.id)
    .single()

  console.log('[hunt/page] huntLocation:', (huntLocation as { name?: string } | null)?.name ?? null, '| error:', locationError?.message ?? null)

  // Render an inline error instead of redirecting — prevents /hunts → /map bounce
  if (!huntLocation) {
    return (
      <div style={{
        display: 'flex', flexDirection: 'column', alignItems: 'center',
        justifyContent: 'center', minHeight: '100vh',
        background: '#f1faee', color: '#1d3557', padding: '2rem', textAlign: 'center',
      }}>
        <h1 style={{ fontSize: '1.5rem', fontWeight: 700, marginBottom: '1rem' }}>Hunt not found</h1>
        <p style={{ color: '#457b9d', marginBottom: '2rem' }}>
          {locationError ? locationError.message : 'This hunt location could not be loaded.'}
        </p>
        <a href="/map" style={{
          padding: '0.75rem 1.5rem', background: '#2a9d8f', color: 'white',
          borderRadius: '0.5rem', textDecoration: 'none', fontWeight: 600,
        }}>
          Return to Map
        </a>
      </div>
    )
  }

  // ── Fetch progress data directly via service-role client ──────────────────
  // Bypasses NEXT_PUBLIC_SITE_URL / internal HTTP fetch — works in all envs
  let progressData = null
  try {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const db = createServiceRoleClient() as any

    const [clueRes, questionsRes, progressRes, attemptsRes] = await Promise.all([
      db
        .from('hunt_clues')
        .select('image_url, text_content, code_type_hint, initial_clue_hint, reveal_image_url, reveal_directions')
        .eq('hunt_location_id', params.id)
        .maybeSingle(),
      db
        .from('hunt_questions')
        .select('id, question_text, order_index, hint_after_attempts')
        .eq('hunt_location_id', params.id)
        .order('order_index', { ascending: true }),
      db
        .from('hunt_progress')
        .select('current_question_index, location_revealed, completed_at')
        .eq('user_id', user.id)
        .eq('hunt_location_id', params.id)
        .maybeSingle(),
      db
        .from('hunt_attempts')
        .select('question_id, attempt_count, solved')
        .eq('user_id', user.id)
        .eq('hunt_location_id', params.id),
    ])

    if (clueRes.error)      console.error('[hunt/page] clue error:',      clueRes.error.message)
    if (questionsRes.error) console.error('[hunt/page] questions error:',  questionsRes.error.message)
    if (progressRes.error)  console.error('[hunt/page] progress error:',   progressRes.error.message)
    if (attemptsRes.error)  console.error('[hunt/page] attempts error:',   attemptsRes.error.message)

    const clue        = clueRes.data
    const questions   = questionsRes.data  ?? []
    const progress    = progressRes.data
    const allAttempts = (attemptsRes.data ?? []) as { question_id: string; attempt_count: number; solved: boolean }[]

    const initialClueRow   = allAttempts.find(a => a.question_id === params.id)
    const questionAttempts = allAttempts.filter(a => a.question_id !== params.id)

    progressData = {
      clue: clue ? {
        image_url:      clue.image_url      ?? null,
        text_content:   clue.text_content   ?? null,
        code_type_hint: clue.code_type_hint ?? null,
      } : null,
      questions,
      progress,
      attempts: questionAttempts,
      reveal: clue ? {
        reveal_image_url:  clue.reveal_image_url  ?? null,
        reveal_directions: clue.reveal_directions ?? '',
      } : null,
      initial_clue_hint:     clue?.initial_clue_hint     ?? null,
      initial_clue_attempts: initialClueRow?.attempt_count ?? 0,
    }

    console.log('[hunt/page] progressData: clue=', !!clue,
      '| questions=', questions.length,
      '| progress=', progress ? `idx:${progress.current_question_index}` : 'none')
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
