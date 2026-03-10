// ─── Hunt Progress Route ──────────────────────────────────────────────────────
// GET /api/hunt/progress?user_id=...&hunt_location_id=...
// Returns all progress data for a user at a specific hunt location:
//   clue                  — initial clue content (image, text, code_type_hint)
//   questions             — ordered list of questions for the location
//   progress              — user's current position and reveal status
//   attempts              — per-question attempt records
//   initial_clue_hint     — hint for the initial clue (NOT the answer)
//   initial_clue_attempts — how many times the user has attempted the initial clue
//
// Required env vars: NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY
//
// DB schema notes (as of 2026-03):
//   hunt_clues    : image_url, text_content, code_type_hint, initial_clue_hint
//                   (reveal_image_url / reveal_directions do NOT exist)
//   hunt_attempts : user_id, question_id, attempt_count, solved
//                   (no hunt_location_id column — filter via question_id set instead)

/* eslint-disable @typescript-eslint/no-explicit-any */

import { NextRequest, NextResponse } from 'next/server'
import { createServiceRoleClient }   from '@/lib/supabase/server'

export async function GET(req: NextRequest) {
  console.log('[hunt/progress] GET received')

  try {
    // ── 1. Parse + validate query params ─────────────────────────────────────
    const { searchParams } = new URL(req.url)
    const user_id          = searchParams.get('user_id')
    const hunt_location_id = searchParams.get('hunt_location_id')

    console.log('[hunt/progress] params: user_id=', user_id, '| hunt_location_id=', hunt_location_id)

    if (!user_id?.trim() || !hunt_location_id?.trim()) {
      return NextResponse.json(
        { error: 'user_id and hunt_location_id are required.' },
        { status: 400 }
      )
    }

    // Service-role client bypasses RLS — these tables are server-managed only
    const db: any = createServiceRoleClient()

    // ── 2. Fetch clue, questions, and progress in parallel ────────────────────
    // NOTE: hunt_attempts is fetched separately after questions so we can
    // filter attempts by the known question IDs for this location.
    const [clueRes, questionsRes, progressRes] = await Promise.all([
      // Clue content — only select columns that actually exist in the DB.
      // reveal_image_url / reveal_directions do NOT exist as of 2026-03.
      db
        .from('hunt_clues')
        .select('image_url, text_content, code_type_hint, initial_clue_hint')
        .eq('hunt_location_id', hunt_location_id)
        .maybeSingle(),

      // Questions ordered by position
      db
        .from('hunt_questions')
        .select('id, question_text, order_index, hint_after_attempts')
        .eq('hunt_location_id', hunt_location_id)
        .order('order_index', { ascending: true }),

      // User's progress at this location
      db
        .from('hunt_progress')
        .select('current_question_index, location_revealed, completed_at')
        .eq('user_id', user_id)
        .eq('hunt_location_id', hunt_location_id)
        .maybeSingle(),
    ])

    console.log('[hunt/progress] clue:', clueRes.error ? 'ERROR:' + clueRes.error.message : (clueRes.data ? 'found' : 'null'))
    console.log('[hunt/progress] questions:', questionsRes.error ? 'ERROR:' + questionsRes.error.message : (questionsRes.data?.length ?? 0))
    console.log('[hunt/progress] progress:', progressRes.error ? 'ERROR:' + progressRes.error.message : (progressRes.data ? 'found' : 'null'))

    if (clueRes.error)      console.error('[hunt/progress] clue error:',      clueRes.error.message)
    if (questionsRes.error) console.error('[hunt/progress] questions error:',  questionsRes.error.message)
    if (progressRes.error)  console.error('[hunt/progress] progress error:',   progressRes.error.message)

    const clue      = clueRes.data      as Record<string, any> | null
    const questions = (questionsRes.data ?? []) as any[]
    const progress  = progressRes.data  as Record<string, any> | null

    // ── 3. Fetch attempts filtered by this hunt's question IDs ────────────────
    // hunt_attempts has no hunt_location_id column — scope via question_id set.
    // The initial-clue attempt is stored with question_id = hunt_location_id.
    const questionIds = new Set(questions.map((q: any) => q.id as string))
    questionIds.add(hunt_location_id) // include the initial-clue pseudo-attempt

    const attemptsRes = await db
      .from('hunt_attempts')
      .select('question_id, attempt_count, solved')
      .eq('user_id', user_id)
      .in('question_id', [...questionIds])

    console.log('[hunt/progress] attempts:', attemptsRes.error ? 'ERROR:' + attemptsRes.error.message : (attemptsRes.data?.length ?? 0))
    if (attemptsRes.error) console.error('[hunt/progress] attempts error:', attemptsRes.error.message)

    const allAttempts = (attemptsRes.data ?? []) as { question_id: string; attempt_count: number; solved: boolean }[]

    // ── 4. Separate initial-clue attempt (question_id === hunt_location_id) ───
    const initialClueRow   = allAttempts.find(a => a.question_id === hunt_location_id)
    const questionAttempts = allAttempts.filter(a => a.question_id !== hunt_location_id)

    const initial_clue_attempts: number      = initialClueRow?.attempt_count ?? 0
    const initial_clue_hint:     string|null = (clue?.initial_clue_hint as string|null) ?? null

    console.log(
      '[hunt/progress] returning: clue=', !!clue,
      '| questions=', questions.length,
      '| progress=', progress ? `idx:${progress.current_question_index}` : 'none',
      '| initial_clue_attempts=', initial_clue_attempts
    )

    // ── 5. Return response ────────────────────────────────────────────────────
    return NextResponse.json({
      clue: clue
        ? {
            image_url:      (clue.image_url      as string|null) ?? null,
            text_content:   (clue.text_content   as string|null) ?? null,
            code_type_hint: (clue.code_type_hint as string|null) ?? null,
          }
        : null,
      questions,
      progress,
      attempts: questionAttempts,
      initial_clue_hint,
      initial_clue_attempts,
    })

  } catch (err) {
    console.error('[hunt/progress] unexpected error:', err)
    return NextResponse.json(
      { error: 'Something went wrong. Please try again.' },
      { status: 500 }
    )
  }
}
