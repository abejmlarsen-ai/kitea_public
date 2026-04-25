// ─── Hunt Answer Route ───────────────────────────────────────────────────────
// POST /api/hunt/answer
// Checks a user's answer against the stored normalised answer for a hunt
// question. Uses Levenshtein distance (≤ 3) to accept minor typos.
// Updates hunt_attempts (per user+question) and hunt_progress (per user+location).
//
// Required env vars: NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY
//
// DB schema — hunt_attempts: id, user_id, question_id, attempt_count, solved, updated_at
// (NO hunt_location_id column — do not try to insert/filter by it)
// NOTE: hunt_attempts_question_id_fkey (FK → hunt_hints) was DROPPED via migration.
//       question_id may hold a hunt_location UUID as a pseudo-ID for initial-clue attempts.

/* eslint-disable @typescript-eslint/no-explicit-any */

import { NextRequest, NextResponse } from 'next/server'
import { distance }                   from 'fastest-levenshtein'
import { createServiceRoleClient }    from '@/lib/supabase/server'

// ── Answer normalisation ──────────────────────────────────────────────────────
// Applied to BOTH the submitted answer AND the stored answer_normalised value
// so that casing / punctuation differences never cause false mismatches.
function normaliseAnswer(raw: string): string {
  return raw
    .trim()
    .toLowerCase()
    .replace(/[^\w\s]/g, '')  // remove punctuation
    .replace(/\s+/g, ' ')      // collapse runs of whitespace
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
        .select('answer')
        .eq('hunt_location_id', hunt_location_id)
        .single()

      if (clueErr || !clue) {
        console.error('[hunt/answer] initial_clue not found:', clueErr?.message ?? 'no row')
        return NextResponse.json({ error: 'Clue not found.' }, { status: 404 })
      }

      // ── ic.2 Normalise + compare via Levenshtein ────────────────────────────
      const rawSubmitted  = String(answer)
      const normInput     = normaliseAnswer(rawSubmitted)
      const normTarget    = normaliseAnswer(String(clue.answer ?? ''))

      const dist      = distance(normInput, normTarget)
      const isCorrect = dist <= 3

      console.log(
        '[hunt/answer] initial_clue raw submitted:', JSON.stringify(rawSubmitted),
        '\n[hunt/answer] initial_clue norm submitted:', JSON.stringify(normInput),
        '\n[hunt/answer] initial_clue norm target:', JSON.stringify(normTarget),
        '\n[hunt/answer] initial_clue dist:', dist, '| correct:', isCorrect
      )

      // ── ic.3 Fetch or create hunt_attempts row ──────────────────────────────
      // The initial-clue attempt is stored with question_id = hunt_location_id
      // (a pseudo question_id so it can be distinguished from real questions).
      // hunt_attempts has NO hunt_location_id column — do NOT include it in inserts.
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
            question_id:   hunt_location_id,  // pseudo question_id for initial clue
            attempt_count: 1,
            solved:        isCorrect,
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

        console.log('[hunt/answer] initial_clue correct — location_revealed: true')

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
        hint:         null,
        attemptCount,
      })
    }

    // ── Question branch ────────────────────────────────────────────────────────
    if (!user_id?.trim() || !question_id?.trim() || answer === undefined || answer === null) {
      return NextResponse.json(
        { error: 'user_id, question_id, and answer are required.' },
        { status: 400 }
      )
    }

    console.log('[hunt/answer] question — user:', user_id, '| question:', question_id)

    const db: any = createServiceRoleClient()

    // ── 2. Parse synthetic hint question_id ({locId}__hint__{N}) ────────────────
    const hintSep = '__hint__'
    const sepIdx  = question_id.lastIndexOf(hintSep)
    if (sepIdx === -1) {
      console.error('[hunt/answer] invalid question_id format:', question_id)
      return NextResponse.json({ error: 'Question not found.' }, { status: 404 })
    }
    const hintLocId  = question_id.slice(0, sepIdx)
    const hintNum    = parseInt(question_id.slice(sepIdx + hintSep.length), 10)
    if (isNaN(hintNum) || hintNum < 1 || hintNum > 3) {
      console.error('[hunt/answer] invalid hint number in question_id:', question_id)
      return NextResponse.json({ error: 'Question not found.' }, { status: 404 })
    }

    // ── 3. Fetch hunt_hints row ────────────────────────────────────────────────
    const { data: hintsRow, error: hintsErr } = await db
      .from('hunt_hints')
      .select('hint_1_text, hint_1_answer, hint_2_text, hint_2_answer, hint_3_text, hint_3_answer')
      .eq('hunt_location_id', hintLocId)
      .single()

    if (hintsErr || !hintsRow) {
      console.error('[hunt/answer] hunt_hints not found:', hintsErr?.message ?? 'no row')
      return NextResponse.json({ error: 'Question not found.' }, { status: 404 })
    }

    const answerNormalised = (hintsRow as any)[`hint_${hintNum}_answer`] as string | null
    const hintText: string | null = null
    const orderIndex       = hintNum - 1

    // Count total populated hints for isLastQuestion check
    const totalHints = [1, 2, 3].filter(n => (hintsRow as any)[`hint_${n}_text`] != null).length

    // Build a question-like object for the logic below
    const question = {
      answer_normalised: answerNormalised,
      hint_text:         hintText,
      hint_after_attempts: 3,
      hunt_location_id:  hintLocId,
      order_index:       orderIndex,
    }

    // ── 4. Normalise + compare via Levenshtein ────────────────────────────────
    const rawSubmitted = String(answer)
    const normInput    = normaliseAnswer(rawSubmitted)
    const normTarget   = normaliseAnswer(String(question.answer_normalised ?? ''))

    const dist      = distance(normInput, normTarget)
    const isCorrect = dist <= 3

    console.log(
      '[hunt/answer] question raw submitted:', JSON.stringify(rawSubmitted),
      '\n[hunt/answer] question norm submitted:', JSON.stringify(normInput),
      '\n[hunt/answer] question norm target:', JSON.stringify(normTarget),
      '\n[hunt/answer] question dist:', dist, '| correct:', isCorrect
    )

    // ── 5. Fetch or create hunt_attempts row ──────────────────────────────────
    // hunt_attempts has NO hunt_location_id column — do NOT include it in inserts.
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
      attemptCount = (existing.attempt_count as number ?? 0) + 1
      const { data: upd, error: updErr } = await db
        .from('hunt_attempts')
        .update({
          attempt_count: attemptCount,
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
      attemptCount = 1
      const { data: cre, error: creErr } = await db
        .from('hunt_attempts')
        .insert({
          user_id,
          question_id,
          attempt_count: 1,
          solved:        isCorrect,
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

    // ── 6. Correct branch — update hunt_progress ──────────────────────────────
    if (isCorrect) {
      const orderIndex     = question.order_index as number
      const isLastQuestion = hintNum >= totalHints

      console.log(
        '[hunt/answer] correct — order_index:', orderIndex,
        '| totalHints:', totalHints, '| isLast:', isLastQuestion
      )

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

    // ── 7. Wrong branch ───────────────────────────────────────────────────────
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
      hint:         showHint ? (question.hint_text ?? null) : null,
      message:      showHint
        ? `Incorrect — hint: ${question.hint_text ?? ''}`
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
