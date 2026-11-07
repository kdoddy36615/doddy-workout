import { useState } from 'react'
import { useCardio, useLogCardio, useRepeatRunWeek, useRunPlan, type Session } from './db'
import { localDate } from './logic'
import { DAYS, ROTATION, type CardioKind, type DayId, type Person } from './program'
import {
  HEALING_WEEK,
  mondayOf,
  PHASE_NAME,
  PLAN_WEEKS,
  planState,
  RUN_RULES,
  RUN_STOP_RULES,
  SESSION_LABEL,
  todayPlan,
  type RunWeek,
} from './running'
import { Disclosure, Stepper, Warning } from './ui'

const RUN_KINDS: ('quality' | 'easy' | 'long')[] = ['quality', 'easy', 'long']
const RUN_DAY: Record<'quality' | 'easy' | 'long', string> = { quality: 'Mon', easy: 'Thu', long: 'Sat' }

/** Emily's running plan card: today's session, this week's 3 runs, repeat-week, rules. */
export function RunPlan(props: {
  person: Person
  healing: boolean
  dayId: DayId
  sessions: Session[]
  sessionId: string | null
  disabled?: boolean
}) {
  const { person, healing, dayId, sessions } = props
  const run = useRunPlan(person)
  const logs = useCardio(person)
  const log = useLogCardio(person)
  const repeat = useRepeatRunWeek(person)
  const now = new Date()
  const today = localDate(now)
  const weekStart = localDate(mondayOf(now))

  const state = planState(healing, run.data?.run_week ?? 0, run.data?.run_start ?? null, now)
  const week: RunWeek | null = state.status === 'active' ? PLAN_WEEKS[state.index] : null

  // leg-day rules look at FULL leg days only (Emily's 2nd leg day is the light Saturday one)
  const full = (id: DayId | undefined) => id === 'legs1'
  const yesterday = localDate(new Date(now.getFullYear(), now.getMonth(), now.getDate() - 1))
  const nextId = ROTATION[(ROTATION.indexOf(dayId) + 1) % ROTATION.length]
  const legs = {
    today: full(dayId),
    tomorrow: full(nextId),
    yesterday: sessions.some((s) => s.date === yesterday && s.status === 'finished' && full(s.day_id)),
  }
  const plan = todayPlan(week, now.getDay(), legs)

  const thisWeek = (logs.data ?? []).filter((c) => c.date >= weekStart)
  const doneToday = (logs.data ?? []).filter((c) => c.date === today)
  const defaultMinutes = Number(/\((\d+) min\)/.exec(plan.text)?.[1] ?? /^(\d+) min/.exec(plan.text)?.[1] ?? 25)
  const [minutes, setMinutes] = useState(defaultMinutes)
  const logKind: CardioKind = plan.kind === 'rest' ? 'cardio' : plan.kind

  return (
    <section className="rounded-2xl border-2 border-cardio/50 bg-cardio-bg p-4">
      <div className="text-xs font-semibold tracking-widest text-cardio uppercase">Running plan</div>
      <div className="mt-1 text-sm font-semibold text-ink/80">
        {state.status === 'healing' && 'Healing: incline walking only. The plan starts the Monday after healing mode is off.'}
        {state.status === 'starting' && `Week 1 starts Monday ${state.startsOn.slice(5)}. Until then: easy cardio.`}
        {state.status === 'active' && week && `${PHASE_NAME[week.phase]} · week ${week.week}`}
        {state.status === 'done' && 'Plan complete. Nice work!'}
      </div>

      <div className="mt-3 rounded-xl bg-bg/40 p-3">
        <div className="text-xs font-bold tracking-wider text-cardio uppercase">Today · {SESSION_LABEL[plan.kind]}</div>
        <div className="mt-1 text-xl leading-snug font-bold">{state.status === 'starting' ? HEALING_WEEK.easy : plan.text}</div>
        {plan.warning && (
          <div className="mt-2">
            <Warning>{plan.warning}</Warning>
          </div>
        )}
        {plan.kind !== 'rest' && (
          <>
            <div className="mt-3 flex items-center justify-between">
              <span className="text-sm text-dim">Minutes</span>
              <Stepper value={minutes} step={5} min={5} onChange={setMinutes} unit="min" disabled={props.disabled} />
            </div>
            <button
              type="button"
              disabled={props.disabled || log.isPending}
              onClick={() => log.mutate({ kind: logKind, minutes, session_id: props.sessionId })}
              className="mt-3 h-12 w-full rounded-xl bg-cardio font-bold text-bg disabled:opacity-50"
            >
              {log.isPending ? 'Saving…' : `Log ${SESSION_LABEL[plan.kind].toLowerCase()}`}
            </button>
          </>
        )}
        {doneToday.length > 0 && (
          <div className="mt-2 text-sm font-semibold text-cardio">
            Logged today: {doneToday.map((c) => `${SESSION_LABEL[c.kind] ?? c.kind}${c.minutes ? ` · ${c.minutes} min` : ''}`).join(', ')}
          </div>
        )}
      </div>

      {week && (
        <div className="mt-3">
          <div className="mb-1.5 text-xs font-semibold text-dim">This week’s runs</div>
          <ul className="space-y-1.5">
            {RUN_KINDS.map((k) => {
              const done = thisWeek.some((c) => c.kind === k)
              return (
                <li key={k} className={'flex gap-3 rounded-lg px-3 py-2 ' + (done ? 'bg-cardio/15' : 'bg-bg/30')}>
                  <span className={'mt-0.5 font-black ' + (done ? 'text-cardio' : 'text-faint')}>{done ? '✓' : '○'}</span>
                  <span className="min-w-0 text-sm">
                    <span className="font-bold">
                      {RUN_DAY[k]} · {SESSION_LABEL[k]}
                    </span>
                    <span className="block text-ink/80">{week[k]}</span>
                  </span>
                </li>
              )
            })}
          </ul>
          {week.note && <div className="mt-2 text-sm text-ink/80">Note: {week.note}</div>}
          <button
            type="button"
            disabled={props.disabled || repeat.isPending}
            onClick={() => state.status === 'active' && repeat.mutate(state.index)}
            className="mt-3 h-11 w-full rounded-xl border border-cardio/40 text-sm font-semibold text-cardio"
          >
            Repeat this week next week
          </button>
          {run.data?.run_start && run.data.run_start > today && state.status === 'active' && (
            <div className="mt-1 text-center text-xs text-dim">Repeating: next week is week {week.week} again.</div>
          )}
        </div>
      )}

      <div className="mt-2 divide-y divide-cardio/20">
        <Disclosure label={<span className="text-danger">Stop rules</span>}>
          <ul className="list-disc space-y-1.5 pl-5 text-sm text-ink/90">
            {RUN_STOP_RULES.map((r) => (
              <li key={r}>{r}</li>
            ))}
          </ul>
        </Disclosure>
        <Disclosure label="How the plan works">
          <ul className="list-disc space-y-1.5 pl-5 text-sm text-ink/90">
            {RUN_RULES.map((r) => (
              <li key={r}>{r}</li>
            ))}
            <li>Week: Mon quality run · Tue/Wed/Fri easy cardio (bike first) · Thu easy run · Sat long run, then light legs · Sun full rest.</li>
          </ul>
        </Disclosure>
        <Disclosure label="Whole plan">
          <ol className="space-y-1 text-xs text-ink/80">
            {PLAN_WEEKS.map((w, i) => (
              <li
                key={i}
                className={'rounded px-2 py-1 ' + (state.status === 'active' && state.index === i ? 'bg-cardio/20 font-semibold text-ink' : '')}
              >
                {w.phase === '5k' ? '5K' : w.phase === 'base' ? 'Base' : 'Half'} {w.week}: long {w.long}
              </li>
            ))}
          </ol>
        </Disclosure>
      </div>
      <span className="sr-only">{DAYS[dayId].name}</span>
    </section>
  )
}
