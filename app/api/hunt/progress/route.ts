// ─── Hunt Progress Route ──────────────────────────────────────────────────────
// GET /api/hunt/progress?user_id=...&hunt_location_id=...
// Returns all progress data for a user at a specific hunt location:
//   clue       — initial clue content (image, text, code_type_hint)
//   questions  — ordered list of questions for the location
//   progress   — user's current position and reveal status
//   attempts   — per-question attempt records
//   reveal     — reveal image + directions (shown once location is found)
//   initial_clue_hint     — hint for the initial clue (NOT the answer)
//   initial_clue_attempts — how many times the user has attempted the initial clue
//
// Required env vars: NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY

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

    if (!user_id?.trim() || !hunt_location_id?.trim()) {
      return NextResponse.json(
        { error: 'user_id and hunt_location_id are required.' },
        { status: 400 }
      )
    }

    console.log('[hunt/progress] user:', user_id, '| location:', hunt_location_id)

    // Service-role client bypasses RLS — these tables are server-managed only
    const db: any = createServiceRoleClient()

    // ── 2. Fetch all data in parallel ─────────────────────────────────────────
    const [clueRes, questionsRes, progressRes, attemptsRes] = await Promise.all([
      // Clue content + reveal data + initial clue hint (NOT answer)
      db
        .from('hunt_clues')
        .select('image_url, text_content, code_type_hint, initial_clue_hint, reveal_image_url, reveal_directions')
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

      // All attempt records for this user + location (covers both question
      // attempts and the initial-clue pseudo-attempt)
      db
        .from('hunt_attempts')
        .select('question_id, attempt_count, solved')
        .eq('user_id', user_id)
        .eq('hunt_location_id', hunt_location_id),
    ])

    // ── 3. Log any Supabase errors (non-fatal — return nulls gracefully) ──────
    if (clueRes.error)      console.error('[hunt/progress] clue error:',      clueRes.error.message)
    if (questionsRes.error) console.error('[hunt/progress] questions error:',  questionsRes.error.message)
    if (progressRes.error)  console.error('[hunt/progress] progress error:',   progressRes.error.message)
    if (attemptsRes.error)  console.error('[hunt/progress] attempts error:',   attemptsRes.error.message)

    const clue        = clueRes.data      as Record<string, any> | null
    const questions   = (questionsRes.data  ?? []) as any[]
    const progress    = progressRes.data  as Record<string, any> | null
    const allAttempts = (attemptsRes.data ?? []) as { question_id: string; attempt_count: number; solved: boolean }[]

    // ── 4. Separate initial-clue attempt (question_id === hunt_location_id) ───
    // The answer route stores the initial-clue attempt using hunt_location_id
    // as a pseudo question_id so it can be distinguished from real questions.
    const initialClueRow = allAttempts.find(a => a.question_id === hunt_location_id)
    const questionAttempts = allAttempts.filter(a => a.question_id !== hunt_location_id)

    const initial_clue_attempts: number     = initialClueRow?.attempt_count ?? 0
    const initial_clue_hint:     string | null = (clue?.initial_clue_hint as string | null) ?? null

    console.log(
      '[hunt/progress] questions:', questions.length,
      '| progress:', progress ? `idx:${progress.current_question_index}` : 'none',
      '| initial_clue_attempts:', initial_clue_attempts
    )

    // ── 5. Return response ────────────────────────────────────────────────────
    return NextResponse.json({
      // Initial clue content shown on the clue view
      clue: clue
        ? {
            image_url:      (clue.image_url      as string | null) ?? null,
            text_content:   (clue.text_content   as string | null) ?? null,
            code_type_hint: (clue.code_type_hint as string | null) ?? null,
          }
        : null,

      // Ordered question list
      questions,

      // User's saved progress (null if they haven't started yet)
      progress,

      // Per-question attempt records (excludes the initial-clue pseudo-attempt)
      attempts: questionAttempts,

      // Reveal content shown once location_revealed = true
      reveal: clue
        ? {
            reveal_image_url:  (clue.reveal_image_url  as string | null) ?? null,
            reveal_directions: (clue.reveal_directions as string)         ?? '',
          }
        : null,

      // ── New fields added per user request ───────────────────────────────────
      // Text hint for the initial clue answer — safe to send to client
      // (initial_clue_answer is intentionally NOT selected above)
      initial_clue_hint,

      // How many times the user has attempted to answer the initial clue
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
