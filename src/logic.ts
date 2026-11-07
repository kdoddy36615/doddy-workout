import { ROTATION, type DayId, type Load, type Scheme } from './program'

// ---------------------------------------------------------------------------
// Progression
// ---------------------------------------------------------------------------

export type LoggedSet = { reps: number; done: boolean }

export type Evaluation = {
  /** weight to suggest next time, or null for "no change" */
  suggested: number | null
  /** consecutive failed sessions at this weight after this session */
  fails: number
  outcome: 'up' | 'deload' | 'hold' | 'fail' | 'skipped'
}

const MIN_WEIGHT: Record<Load, number> = { barbell: 45, dumbbell: 0, machine: 0, bodyweight: 0 }
export const DELOAD_AFTER = 3

export function roundDown(weight: number, step: number) {
  if (step <= 0) return weight
  return Math.floor(weight / step + 1e-9) * step
}

/**
 * Decide the suggestion after a finished session.
 * - Fixed reps (5x5 etc.): every set at target → +increment. Any set short → fail.
 * - Rep range (8–12): every set at the top → +increment. Any set below the bottom → fail.
 *   Inside the range = hold (progress by reps).
 * - Main lifts deload 10% after DELOAD_AFTER fails in a row. Accessories just hold.
 */
export function evaluate(args: {
  scheme: Scheme
  sets: LoggedSet[]
  weight: number
  increment: number
  load: Load
  main: boolean
  fails: number
}): Evaluation {
  const { scheme, sets, weight, increment, load, main, fails } = args
  const done = sets.filter((s) => s.done)
  if (done.length === 0) return { suggested: null, fails, outcome: 'skipped' }
  if (increment <= 0) return { suggested: null, fails: 0, outcome: 'hold' }

  const [min, max] = scheme.reps
  const allDone = done.length >= scheme.sets
  const anyBelowMin = done.some((s) => s.reps < min) || !allDone
  const allAtTop = allDone && done.every((s) => s.reps >= max)

  if (allAtTop) return { suggested: weight + increment, fails: 0, outcome: 'up' }
  if (!anyBelowMin) return { suggested: null, fails: 0, outcome: 'hold' }

  const nextFails = fails + 1
  if (main && nextFails >= DELOAD_AFTER) {
    const deloaded = Math.max(MIN_WEIGHT[load], roundDown(weight * 0.9, increment))
    return { suggested: deloaded < weight ? deloaded : null, fails: 0, outcome: 'deload' }
  }
  return { suggested: null, fails: nextFails, outcome: 'fail' }
}

// ---------------------------------------------------------------------------
// Rotation + dates
// ---------------------------------------------------------------------------

/** YYYY-MM-DD in the phone's local time zone (never UTC). */
export function localDate(d = new Date()) {
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

export function isSunday(date: string) {
  const [y, m, d] = date.split('-').map(Number)
  return new Date(y, m - 1, d).getDay() === 0
}

/** Last N local dates ending today, oldest first. */
export function lastDates(n: number, today = new Date()) {
  const out: string[] = []
  for (let i = n - 1; i >= 0; i--) {
    const d = new Date(today.getFullYear(), today.getMonth(), today.getDate() - i)
    out.push(localDate(d))
  }
  return out
}

export type SessionLite = { day_id: DayId; date: string; status: 'active' | 'finished' | 'partial'; finished_at: string | null }

/** Next day = the one after the most recently finished session. Unfinished sessions never advance. */
export function nextDay(sessions: SessionLite[]): DayId {
  const finished = sessions
    .filter((s) => s.status === 'finished' && s.finished_at)
    .sort((a, b) => (a.finished_at! < b.finished_at! ? 1 : -1))
  if (finished.length === 0) return ROTATION[0]
  const i = ROTATION.indexOf(finished[0].day_id)
  return ROTATION[(i + 1) % ROTATION.length]
}

/** Active sessions from an earlier local date should be closed as partial. */
export function staleActive<T extends SessionLite>(sessions: T[], today: string): T[] {
  return sessions.filter((s) => s.status === 'active' && s.date < today)
}

export function formatWeight(w: number) {
  return Number.isInteger(w) ? String(w) : w.toFixed(1)
}
