// ─── Hunt Answer Route ───────────────────────────────────────────────────────
// POST /api/hunt/answer
// Checks a user's answer against the stored normalised answer for a hunt
// question. Uses Levenshtein distance (≤ 3) to accept minor typos.
// Updates hunt_attempts (per user+question) and hunt_progress (per user+location).
//
// Required env vars: NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY

/* eslint-disable @typescript-eslint/no-explicit-any */

import { NextRequest, NextResponse } from 'next/server'
import { distance }                   from 'fastest-levenshtein'
import { createServiceRoleClient }    from '@/lib/supabase/server'

// ── Answer normalisation ──────────────────────────────────────────────────────
// Must match the normalisation applied in the admin panel when saving questions:
// trim → lowercase → strip punctuation → collapse whitespace.
function normaliseAnswer(raw: string): string {
  return raw
    .trim()
    .toLowerCase()
    .replace(/[^\w\s]/g, '')  // remove punctuation
    .replace(/\s+/g, ' ')     // collapse runs of whitespace
    .trim()
}

// ── Route handler ─────────────────────────────────────────────────────────────
export async function POST(req: NextRequest) {
  console.log('[hunt/answer] POST received')

  try {
    // ── 1. Parse + validate body ──────────────────────────────────────────────
    const body = await req.json() as {
      user_id?:          string
      question_id?:      string
      hunt_location_id?: string
      answer?:           unknown
      type?:             'question' | 'initial_clue'
    }

    const { user_id, question_id, hunt_location_id, answer, type: reqType = 'question' } = body

    // ── Initial clue branch ───────────────────────────────────────────────────
    if (reqType === 'initial_clue') {
      if (!user_id?.trim() || !hunt_location_id?.trim() || answer === undefined || answer === null) {
        return NextResponse.json(
          { error: 'user_id, hunt_location_id, and answer are required.' },
          { status: 400 }
        )
      }

      console.log('[hunt/answer] initial_clue — user:', user_id, '| location:', hunt_location_id)

      const db: any = createServiceRoleClient()

      // ── ic.1 Fetch the clue record ──────────────────────────────────────────
      const { data: clue, error: clueErr } = await db
        .from('hunt_clues')
        .select('initial_clue_answer, initial_clue_hint')
        .eq('hunt_location_id', hunt_location_id)
        .single()

      if (clueErr || !clue) {
        console.error('[hunt/answer] initial_clue not found:', clueErr?.message ?? 'no row')
        return NextResponse.json({ error: 'Clue not found.' }, { status: 404 })
      }

      // ── ic.2 Normalise + compare via Levenshtein ────────────────────────────
      const normInput  = normaliseAnswer(String(answer))
      const normTarget = normaliseAnswer(String(clue.initial_clue_answer ?? ''))

      const dist      = distance(normInput, normTarget)
      const isCorrect = dist <= 3

      console.log(
        '[hunt/answer] initial_clue input:', JSON.stringify(normInput),
        '| target:', JSON.stringify(normTarget),
        '| dist:', dist, '| correct:', isCorrect
      )

      // ── ic.3 Fetch or create hunt_attempts row (location id as pseudo question_id) ──
      const { data: existing, error: fetchErr } = await db
        .from('hunt_attempts')
        .select('id, attempt_count, solved')
        .eq('user_id', user_id)
        .eq('question_id', hunt_location_id)
        .maybeSingle()

      if (fetchErr) {
        console.error('[hunt/answer] initial_clue fetch attempt error:', fetchErr.message)
        return NextResponse.json({ error: 'Failed to fetch attempt record.' }, { status: 500 })
      }

      let attemptCount: number

      if (existing) {
        attemptCount = (existing.attempt_count as number ?? 0) + 1
        const { error: updErr } = await db
          .from('hunt_attempts')
          .update({
            attempt_count: attemptCount,
            solved: isCorrect || Boolean(existing.solved),
          })
          .eq('id', existing.id)

        if (updErr) {
          console.error('[hunt/answer] initial_clue update attempt error:', updErr.message)
          return NextResponse.json({ error: 'Failed to update attempt record.' }, { status: 500 })
        }
      } else {
        attemptCount = 1
        const { error: creErr } = await db
          .from('hunt_attempts')
          .insert({
            user_id,
            question_id:      hunt_location_id,   // pseudo question_id
            hunt_location_id,
            attempt_count:    1,
            solved:           isCorrect,
          })

        if (creErr) {
          console.error('[hunt/answer] initial_clue create attempt error:', creErr.message)
          return NextResponse.json({ error: 'Failed to create attempt record.' }, { status: 500 })
        }
      }

      console.log('[hunt/answer] initial_clue attempt_count:', attemptCount)

      // ── ic.4 Correct branch — reveal the location ───────────────────────────
      if (isCorrect) {
        const { data: prog } = await db
          .from('hunt_progress')
          .select('id')
          .eq('user_id', user_id)
          .eq('hunt_location_id', hunt_location_id)
          .maybeSingle()

        const now   = new Date().toISOString()
        const patch = { location_revealed: true, completed_at: now }

        if (prog) {
          await db.from('hunt_progress').update(patch).eq('id', prog.id)
        } else {
          await db.from('hunt_progress').insert({ user_id, hunt_location_id, ...patch })
        }

        console.log('[hunt/answer] initial_clue correct — hunt_progress updated, location_revealed: true')

        return NextResponse.json({ correct: true })
      }

      // ── ic.5 Wrong branch — show hint after 5 attempts ─────────────────────
      const showHint = attemptCount >= 5

      console.log(
        '[hunt/answer] initial_clue wrong — attempts:', attemptCount,
        '| showHint:', showHint
      )

      return NextResponse.json({
        correct:      false,
        showHint,
        hint:         showHint ? (clue.initial_clue_hint as string | null) : null,
        attemptCount,
      })
    }

    // ── Question branch (existing logic — unchanged) ───────────────────────────
    if (!user_id?.trim() || !question_id?.trim() || answer === undefined || answer === null) {
      return NextResponse.json(
        { error: 'user_id, question_id, and answer are required.' },
        { status: 400 }
      )
    }

    console.log('[hunt/answer] user:', user_id, '| question:', question_id)

    // Service-role client bypasses RLS — these tables are server-managed only
    const db: any = createServiceRoleClient()

    // ── 2. Fetch the question ─────────────────────────────────────────────────
    const { data: question, error: qErr } = await db
      .from('hunt_questions')
      .select('id, answer_normalised, hint_text, hint_after_attempts, hunt_location_id, order_index')
      .eq('id', question_id)
      .single()

    if (qErr || !question) {
      console.error('[hunt/answer] question not found:', qErr?.message ?? 'no row')
      return NextResponse.json({ error: 'Question not found.' }, { status: 404 })
    }

    // ── 3. Normalise + compare via Levenshtein ────────────────────────────────
    const normInput  = normaliseAnswer(String(answer))
    const normTarget = String(question.answer_normalised ?? '')

    const dist      = distance(normInput, normTarget)
    const isCorrect = dist <= 3

    console.log(
      '[hunt/answer] input:', JSON.stringify(normInput),
      '| target:', JSON.stringify(normTarget),
      '| dist:', dist, '| correct:', isCorrect
    )

    // ── 4. Fetch or create hunt_attempts row, increment attempt_count ─────────
    const { data: existing, error: fetchErr } = await db
      .from('hunt_attempts')
      .select('id, attempt_count, solved')
      .eq('user_id', user_id)
      .eq('question_id', question_id)
      .maybeSingle()

    if (fetchErr) {
      console.error('[hunt/answer] fetch attempt error:', fetchErr.message)
      return NextResponse.json({ error: 'Failed to fetch attempt record.' }, { status: 500 })
    }

    let attemptCount: number
    let attemptId:    string

    if (existing) {
      // Already attempted — increment
      attemptCount = (existing.attempt_count as number ?? 0) + 1
      const { data: upd, error: updErr } = await db
        .from('hunt_attempts')
        .update({
          attempt_count: attemptCount,
          // Never flip solved back to false once correct
          solved: isCorrect || Boolean(existing.solved),
        })
        .eq('id', existing.id)
        .select('id')
        .single()

      if (updErr) {
        console.error('[hunt/answer] update attempt error:', updErr.message)
        return NextResponse.json({ error: 'Failed to update attempt record.' }, { status: 500 })
      }
      attemptId = upd.id as string
    } else {
      // First attempt
      attemptCount = 1
      const { data: cre, error: creErr } = await db
        .from('hunt_attempts')
        .insert({
          user_id,
          question_id,
          hunt_location_id: question.hunt_location_id as string,
          attempt_count:    1,
          solved:           isCorrect,
        })
        .select('id')
        .single()

      if (creErr) {
        console.error('[hunt/answer] create attempt error:', creErr.message)
        return NextResponse.json({ error: 'Failed to create attempt record.' }, { status: 500 })
      }
      attemptId = cre.id as string
    }

    console.log('[hunt/answer] attempt_id:', attemptId, '| attempt_count:', attemptCount)

    // ── 5. Correct branch — update hunt_progress ──────────────────────────────
    if (isCorrect) {
      // How many questions does this location have in total?
      const { count: totalQ, error: cntErr } = await db
        .from('hunt_questions')
        .select('id', { count: 'exact', head: true })
        .eq('hunt_location_id', question.hunt_location_id)

      if (cntErr) {
        console.error('[hunt/answer] count questions error:', cntErr.message)
        return NextResponse.json({ error: 'Failed to count questions.' }, { status: 500 })
      }

      const orderIndex     = question.order_index as number
      const isLastQuestion = orderIndex + 1 >= (totalQ ?? 1)

      console.log(
        '[hunt/answer] correct — order_index:', orderIndex,
        '| total:', totalQ, '| isLast:', isLastQuestion
      )

      // Upsert hunt_progress
      const { data: prog } = await db
        .from('hunt_progress')
        .select('id')
        .eq('user_id', user_id)
        .eq('hunt_location_id', question.hunt_location_id)
        .maybeSingle()

      const progressPatch = isLastQuestion
        ? { current_question_index: orderIndex + 1, location_revealed: true }
        : { current_question_index: orderIndex + 1 }

      if (prog) {
        await db.from('hunt_progress').update(progressPatch).eq('id', prog.id)
      } else {
        await db.from('hunt_progress').insert({
          user_id,
          hunt_location_id: question.hunt_location_id as string,
          ...progressPatch,
        })
      }

      console.log('[hunt/answer] hunt_progress updated, location_revealed:', isLastQuestion)

      return NextResponse.json({
        correct:           true,
        isLastQuestion,
        locationRevealed:  isLastQuestion,
        nextQuestionIndex: isLastQuestion ? null : orderIndex + 1,
        message: isLastQuestion
          ? 'Correct! You have completed all questions — the location is now revealed!'
          : 'Correct! Moving to the next question.',
      })
    }

    // ── 6. Wrong branch — return hint if threshold reached ────────────────────
    const hintThreshold = question.hint_after_attempts as number ?? 3
    const showHint      = Boolean(question.hint_text) && attemptCount >= hintThreshold

    console.log(
      '[hunt/answer] wrong — attempts:', attemptCount,
      '| threshold:', hintThreshold, '| showHint:', showHint
    )

    return NextResponse.json({
      correct:      false,
      attemptCount,
      showHint,
      hint:         showHint ? (question.hint_text as string) : null,
      message:      showHint
        ? `Incorrect — hint: ${question.hint_text as string}`
        : `Incorrect. Try again. (Attempt ${attemptCount})`,
    })

  } catch (err) {
    console.error('[hunt/answer] unexpected error:', err)
    return NextResponse.json(
      { error: 'Something went wrong. Please try again.' },
      { status: 500 }
    )
  }
}
