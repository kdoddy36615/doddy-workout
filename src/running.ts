// Emily's running plan. Source + reasoning: docs/running-plan.md (tables generated from the same data).
// Runs are keyed to weekdays (quality Mon, easy Thu, long Sat, Sun rest); the plan advances by calendar week.

export type RunWeek = {
  phase: 'healing' | '5k' | 'base' | 'half'
  week: number
  easy: string
  quality: string
  long: string
  note?: string
}

export const RUNNING_PLAN: RunWeek[] = [
  { phase: 'healing', week: 1, easy: "Incline walk 8% @ 3.8 mph, 20–30 min", quality: "Incline walk 8% @ 3.8 mph, 20–30 min", long: "Incline walk 8% @ 3.8 mph, 20–30 min", note: "Open-ended. No running. Repeat until healing mode is off." },
  { phase: '5k', week: 1, easy: "Run 1 / walk 1 × 10 (20 min)", quality: "Run 2 / walk 1 × 7 (21 min)", long: "Run 2 / walk 1 × 8 + run 1 (25 min)", note: "First week back. Next-morning abdomen check after each run." },
  { phase: '5k', week: 2, easy: "Run 2 / walk 1 × 7 (21 min)", quality: "Run 3 / walk 1 × 6 (24 min)", long: "Run 3 / walk 1 × 6 + run 3 (27 min)" },
  { phase: '5k', week: 3, easy: "Run 2 / walk 1 × 8 (24 min)", quality: "Run 4 / walk 1 × 5 (25 min)", long: "Run 4 / walk 1 × 6 (30 min)" },
  { phase: '5k', week: 4, easy: "Run 3 / walk 1 × 6 (24 min)", quality: "Run 5 / walk 1 × 5 (30 min)", long: "Run 5 / walk 1 × 5 + run 3 (33 min)" },
  { phase: '5k', week: 5, easy: "Run 3 / walk 1 × 5 (20 min)", quality: "Run 5 / walk 1 × 4 (24 min)", long: "Run 6 / walk 1 × 4 (28 min)", note: "Cutback week: lighter on purpose." },
  { phase: '5k', week: 6, easy: "Run 4 / walk 1 × 5 (25 min)", quality: "Run 8 / walk 2 × 3 (30 min)", long: "Run 8 / walk 1 × 4 (36 min)" },
  { phase: '5k', week: 7, easy: "Run 5 / walk 1 × 5 (30 min)", quality: "Run 10 / walk 2 × 3 (36 min)", long: "Run 12 / walk 1 × 3 + run 1 (40 min)" },
  { phase: '5k', week: 8, easy: "25 min easy, walk breaks OK", quality: "Run 20 / walk 2 / run 10 (32 min)", long: "Run 15 / walk 1 × 2 + run 12 (44 min)" },
  { phase: '5k', week: 9, easy: "25 min easy run", quality: "30 min continuous easy", long: "Run 25 / walk 1 / run 22 (48 min)" },
  { phase: '5k', week: 10, easy: "25 min easy run", quality: "30 min continuous easy", long: "5K continuous, or 50 min (whichever first)", note: "Goal week. Walk breaks needed? Repeat week 10." },
  { phase: 'base', week: 1, easy: "30 min easy", quality: "30 min: 10 easy, 3 × 3 min steady / 2 easy, easy", long: "55 min easy" },
  { phase: 'base', week: 2, easy: "30 min easy", quality: "35 min: 10 easy, 3 × 4 min steady / 2 easy, easy", long: "60 min easy" },
  { phase: 'base', week: 3, easy: "35 min easy", quality: "35 min: 10 easy, 2 × 8 min steady / 2 easy, easy", long: "65 min easy" },
  { phase: 'base', week: 4, easy: "25 min easy", quality: "30 min easy", long: "50 min easy", note: "Cutback week." },
  { phase: 'base', week: 5, easy: "35 min easy", quality: "40 min: 10 easy, 15 min steady, easy", long: "70 min easy (~5 mi)" },
  { phase: 'base', week: 6, easy: "35 min easy", quality: "40 min: 10 easy, 20 min steady, easy", long: "75 min easy (~5+ mi)", note: "Phase goal: 5 mi feels comfortable." },
  { phase: 'half', week: 1, easy: "35 min easy", quality: "40 min: 10 easy, 3 × 5 min steady / 2 easy, easy", long: "1:15 easy" },
  { phase: 'half', week: 2, easy: "35 min easy", quality: "40 min: 10 easy, 2 × 8 min steady / 2 easy, easy", long: "1:20 easy" },
  { phase: 'half', week: 3, easy: "40 min easy", quality: "45 min: 10 easy, 20 min steady, easy", long: "1:28 easy, walk breaks OK" },
  { phase: 'half', week: 4, easy: "30 min easy", quality: "35 min easy", long: "1:05 easy", note: "Cutback week." },
  { phase: 'half', week: 5, easy: "40 min easy", quality: "45 min: 10 easy, 3 × 8 min steady / 2 easy, easy", long: "1:35 easy, walk breaks OK", note: "Long run > 90 min: trim leg-day accessories." },
  { phase: 'half', week: 6, easy: "40 min easy", quality: "50 min: 10 easy, 25 min steady, easy", long: "1:45 easy, walk breaks OK", note: "Practise race-day fuel and drink on the long run." },
  { phase: 'half', week: 7, easy: "45 min easy", quality: "50 min: 10 easy, 4 × 4 min hard / 3 easy, easy", long: "1:55 easy, walk breaks OK", note: "4 × 4 only if cleared (see rules). Else 3 × 8 steady." },
  { phase: 'half', week: 8, easy: "35 min easy", quality: "40 min easy", long: "1:30 easy, walk breaks OK", note: "Cutback week." },
  { phase: 'half', week: 9, easy: "45 min easy", quality: "50 min: 10 easy, 2 × 12 min steady / 3 easy, easy", long: "2:05 easy, walk breaks OK" },
  { phase: 'half', week: 10, easy: "45 min easy", quality: "50 min: 10 easy, 30 min steady, easy", long: "2:15 easy, walk breaks OK (~10 mi)", note: "Peak week." },
  { phase: 'half', week: 11, easy: "35 min easy", quality: "35 min: 10 easy, 2 × 6 min steady / 2 easy, easy", long: "1:20 easy", note: "Taper week 1: volume down, keep a little steady running." },
  { phase: 'half', week: 12, easy: "25 min easy", quality: "20 min: 15 easy, 3 × 1 min steady", long: "HALF MARATHON: 13.1 mi, run/walk OK", note: "Taper week 2. No Sat light legs; rest Sun." },
]

/** Plan weeks after healing (index 0 = 5K week 1). */
export const PLAN_WEEKS = RUNNING_PLAN.filter((w) => w.phase !== 'healing')
export const HEALING_WEEK = RUNNING_PLAN[0]
export const PHASE_NAME: Record<RunWeek['phase'], string> = {
  healing: 'Healing',
  '5k': 'Phase 1 · Run/walk to 5K',
  base: 'Phase 2 · Base to 5 miles',
  half: 'Phase 3 · Half-marathon build',
}

export type SessionKind = 'quality' | 'easy' | 'long' | 'cardio' | 'rest'
export const SESSION_LABEL: Record<SessionKind, string> = {
  quality: 'Quality run',
  easy: 'Easy run',
  long: 'Long run',
  cardio: 'Easy cardio',
  rest: 'Rest day',
}

/** 0 = Sunday … 6 = Saturday */
export function sessionForWeekday(dow: number): SessionKind {
  return dow === 1 ? 'quality' : dow === 4 ? 'easy' : dow === 6 ? 'long' : dow === 0 ? 'rest' : 'cardio'
}

const HEALING_WALK = 'Incline walk 8% @ 3.8 mph, 20–30 min'

/** Non-run cardio (Tue/Wed/Fri) by phase. Always easy; bike first. */
export function easyCardio(week: RunWeek | null, dow: number): string {
  if (!week) return HEALING_WALK
  const late = week.phase === 'half' && week.week >= 5 && week.week <= 10
  const taper = week.phase === 'half' && week.week >= 11
  if (dow === 2) return taper ? '15–20 min easy (bike first)' : late ? '20 min easy (bike first)' : '20–30 min easy (bike first)'
  if (dow === 3) return late ? '15 min easy bike, or skip if legs are heavy' : '15–20 min easy bike'
  // Friday: day before the long run is the lightest
  if (taper) return 'Skip, or a 10 min walk'
  if (late) return '10–15 min very easy, or skip'
  if (week.phase === 'half') return '15 min very easy'
  return '15–20 min easy'
}

/** Monday on/after the given date (the date itself if it's a Monday). */
export function nextMonday(d: Date) {
  const out = new Date(d.getFullYear(), d.getMonth(), d.getDate())
  out.setDate(out.getDate() + ((8 - out.getDay()) % 7))
  return out
}

/** Monday of the week containing d. */
export function mondayOf(d: Date) {
  const out = new Date(d.getFullYear(), d.getMonth(), d.getDate())
  out.setDate(out.getDate() - ((out.getDay() + 6) % 7))
  return out
}

const parse = (s: string) => {
  const [y, m, d] = s.split('-').map(Number)
  return new Date(y, m - 1, d)
}

export type PlanState =
  | { status: 'healing' }
  | { status: 'starting'; index: number; startsOn: string }
  | { status: 'active'; index: number }
  | { status: 'done' }

/**
 * Where she is in the plan. runWeek = plan index she's on (or paused at); runStart = the Monday it began
 * (null while healing). Weeks never count down before runStart, which is how "repeat this week" works.
 */
export function planState(healing: boolean, runWeek: number, runStart: string | null, today: Date): PlanState {
  if (healing || !runStart) return { status: 'healing' }
  const start = parse(runStart)
  const t = new Date(today.getFullYear(), today.getMonth(), today.getDate())
  const diffWeeks = Math.floor((t.getTime() - start.getTime()) / (7 * 864e5) + 1e-9)
  if (diffWeeks < 0 && runWeek === 0) return { status: 'starting', index: 0, startsOn: runStart }
  const index = runWeek + Math.max(0, diffWeeks)
  if (index >= PLAN_WEEKS.length) return { status: 'done' }
  return { status: 'active', index }
}

export type TodayPlan = { kind: SessionKind; text: string; warning?: string }

/**
 * Today's session, with the leg-day rules from docs/running-plan.md §1.6.
 * liftToday / liftTomorrow / liftYesterday: whether that day is (or was) a FULL leg day.
 */
export function todayPlan(
  week: RunWeek | null,
  dow: number,
  legs: { today: boolean; tomorrow: boolean; yesterday: boolean },
): TodayPlan {
  const kind = sessionForWeekday(dow)
  if (kind === 'rest') return { kind, text: 'Full rest: no lifting, no cardio.' }
  if (!week) return { kind: 'cardio', text: HEALING_WALK }
  if (kind === 'cardio') return { kind, text: easyCardio(week, dow) }
  const text = week[kind]
  if (kind === 'quality' && (legs.today || legs.tomorrow || legs.yesterday)) {
    return {
      kind,
      text,
      warning: 'Leg-day rule: run this as an easy run of the same length (no steady/hard blocks), and run before lifting.',
    }
  }
  if (kind === 'long' && legs.today) {
    return { kind, text, warning: 'Long run first, then light legs only. Do squat + RDL on the next rotation day after Sunday.' }
  }
  if (kind === 'long' && legs.yesterday) {
    return { kind, text, warning: 'Full legs were yesterday: cap today at last week’s long-run time and keep it easy.' }
  }
  if (kind === 'easy' && legs.today) {
    return { kind, text, warning: 'Leg day: easy run first, legs after (or split them by a few hours).' }
  }
  return { kind, text }
}

export const RUN_RULES = [
  'Easy = full sentences (talk test). Steady = short sentences. Hard = a few words; only in Phase 3 week 7, and only if 4×4 intervals have been cleared.',
  'Every session: 5 min brisk-walk warm-up and 5 min walk cool-down (not in the times).',
  'Quality and long runs: fresh, before lifting. Easy run after lifting is fine: drop to last week’s run/walk ratio, or 1:1.',
  'No run more than ~10% longer than your longest run in the last 30 days (the half marathon itself is the planned exception).',
  'Repeat the week if a run couldn’t be finished, easy runs felt hard, a pain rule triggered, or you missed runs or slept badly.',
  'Missed 1 week → repeat the last completed week. 2–3 weeks → go back 2. 4+ → back to the start of the phase.',
]

export const RUN_STOP_RULES = [
  'Any ab pain while running, or a lump/bulge: stop, walk home, turn healing mode back on for at least a week. Bulge/lump = see a doctor.',
  'Sharp pain, a changed stride or limping: stop. No running until it’s gone.',
  'Ache ≤3/10 that fades and is gone by morning: OK. Worse than 3/10, getting worse, or still there next morning: skip the next run, repeat the week.',
  'Pain in one spot on a shin or foot, or pain at rest/night: stop running and see a clinician.',
  'Chest pain, fainting or unusual breathlessness: stop and get urgent care.',
]
