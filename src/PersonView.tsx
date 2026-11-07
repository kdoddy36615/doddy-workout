import { useMemo, useRef, useState } from 'react'
import {
  startSession,
  useCardio,
  useChoices,
  useFinish,
  useHealing,
  useLogCardio,
  useLogSet,
  useSaveState,
  useSessions,
  useSetChoice,
  useSetHealing,
  useSetLogs,
  useStates,
  type Session,
  type SetLog,
} from './db'
import { ExerciseCard } from './ExerciseCard'
import { isSunday, lastDates, localDate, nextDay } from './logic'
import {
  CARDIO_OPTIONS,
  DAYS,
  DOCTOR,
  EMILY_CARDIO,
  GLOBAL_NOTES,
  HEALING_NOTES,
  PERSON_NAME,
  PROGRAM_RULES,
  ROTATION,
  SUNDAY_CARDIO,
  WARMUPS,
  slotsFor,
  stateKey,
  type CardioKind,
  type DayId,
  type Person,
} from './program'
import { Disclosure, Stepper, Warning } from './ui'
import { useQueryClient } from '@tanstack/react-query'

export function PersonView({ person }: { person: Person }) {
  const qc = useQueryClient()
  const sessions = useSessions(person)
  const states = useStates(person)
  const choices = useChoices(person)
  const healingQ = useHealing()
  const healing = Boolean(healingQ.data?.[person])
  const today = localDate()

  const active = sessions.data?.find((s) => s.status === 'active' && s.date === today)
  const suggestedDay = nextDay(sessions.data ?? [])
  const [override, setOverride] = useState<DayId | null>(null)
  const dayId: DayId = active?.day_id ?? override ?? suggestedDay
  const day = DAYS[dayId]

  const setLogs = useSetLogs(active?.id)
  const saveState = useSaveState(person)
  const setChoice = useSetChoice(person)
  const logSet = useLogSet()
  const finish = useFinish(person)
  // ref, not state: rapid taps in the same render must share one insert
  const creating = useRef<Promise<Session> | null>(null)

  const ensureSession = async (): Promise<Session> => {
    if (active) return active
    if (!creating.current) {
      creating.current = startSession(person, dayId).then((s) => {
        qc.setQueryData<Session[]>(['sessions', person], (old = []) => [...old, s])
        return s
      })
      creating.current.finally(() => setTimeout(() => (creating.current = null), 2000))
    }
    return creating.current
  }

  const onSet = async (s: Omit<SetLog, 'session_id'>) => {
    const sess = await ensureSession()
    logSet.mutate({ ...s, session_id: sess.id })
  }

  if (sessions.isError || states.isError) {
    return <div className="p-4 text-danger">Couldn’t reach the database. Check your signal and reload.</div>
  }
  if (sessions.isLoading || states.isLoading || choices.isLoading) {
    return <div className="p-6 text-dim">Loading…</div>
  }

  const color = person === 'kevin' ? 'text-kevin' : 'text-emily'
  const warmup = WARMUPS[person][day.kind]
  const sets = setLogs.data ?? []

  return (
    <div className="space-y-4">
      <ProgramInfo person={person} healing={healing} />

      <section className="rounded-2xl border border-line bg-panel p-4">
        <div className="flex items-baseline justify-between gap-2">
          <div>
            <div className="text-xs font-semibold tracking-widest text-dim uppercase">
              {active ? 'In progress' : override && override !== suggestedDay ? 'Doing instead' : 'Next up'}
            </div>
            <div className={'text-4xl font-black tracking-tight ' + color}>{day.name}</div>
          </div>
          {isSunday(today) && !active && <div className="text-right text-sm text-dim">Sunday is rest day.<br />Optional.</div>}
        </div>
        {!active && (
          <div className="mt-3 flex flex-wrap gap-2" role="group" aria-label="Choose day">
            {ROTATION.map((id) => (
              <button
                key={id}
                type="button"
                onClick={() => setOverride(id === suggestedDay ? null : id)}
                className={
                  'h-10 rounded-lg px-3 text-sm font-semibold ' +
                  (id === dayId ? 'bg-ink text-bg' : 'bg-panel-2 text-dim') +
                  (id === suggestedDay && id !== dayId ? ' ring-1 ring-accent/60' : '')
                }
              >
                {DAYS[id].name}
                {id === 'legs1' ? ' 1' : id === 'legs2' ? ' 2' : ''}
              </button>
            ))}
          </div>
        )}
        <HistoryStrip sessions={sessions.data ?? []} />
      </section>

      {warmup && (
        <section className="rounded-2xl border border-line bg-panel px-4">
          <Disclosure label="Warm-up" defaultOpen={false}>
            <ul className="list-disc space-y-1 pl-5 text-sm text-ink/90">
              {warmup.map((w) => (
                <li key={w}>{w}</li>
              ))}
            </ul>
          </Disclosure>
        </section>
      )}

      {slotsFor(person, dayId).map(({ slot, cfg }) => {
        const variant = choices.data?.[slot.id] ?? cfg.variants[0]
        const k = stateKey(variant, slot.main)
        return (
          <ExerciseCard
            key={`${dayId}-${slot.id}`}
            person={person}
            slot={slot}
            cfg={cfg}
            variant={variant}
            state={states.data?.[k]}
            sets={sets.filter((s) => s.key === k)}
            healing={healing}
            onVariant={(v) => setChoice.mutate({ slot_key: slot.id, variant: v })}
            onState={(s) => saveState.mutate(s)}
            onSet={onSet}
          />
        )
      })}

      <Cardio person={person} dayId={dayId} healing={healing} sessionId={active?.id ?? null} />

      <button
        type="button"
        disabled={!active || finish.isPending}
        onClick={() =>
          active &&
          finish.mutate({ session: active, states: states.data ?? {}, choices: choices.data ?? {} }, { onSuccess: () => setOverride(null) })
        }
        className="h-16 w-full rounded-2xl bg-accent text-lg font-black text-accent-ink disabled:bg-panel-2 disabled:text-faint"
      >
        {finish.isPending ? 'Saving…' : active ? `Finish ${day.name}` : 'Log a set to start'}
      </button>
      {finish.isError && <div className="text-sm text-danger">Couldn’t save. Try again.</div>}
    </div>
  )
}

function HistoryStrip({ sessions }: { sessions: Session[] }) {
  const dates = lastDates(14)
  const byDate = new Map<string, Session[]>()
  sessions.forEach((s) => byDate.set(s.date, [...(byDate.get(s.date) ?? []), s]))
  return (
    <div className="mt-4">
      <div className="mb-1.5 text-xs font-semibold text-faint">Last 14 days</div>
      <div className="grid grid-cols-14 gap-1">
        {dates.map((d) => {
          const list = byDate.get(d) ?? []
          const fin = list.find((s) => s.status === 'finished')
          const part = list.find((s) => s.status !== 'finished')
          const s = fin ?? part
          const dow = 'SMTWTFS'[new Date(d + 'T12:00').getDay()]
          return (
            <div key={d} className="flex flex-col items-center gap-1" title={`${d}${s ? ' · ' + DAYS[s.day_id].name : ''}`}>
              <div
                className={
                  'grid h-8 w-full place-items-center rounded text-[10px] font-bold ' +
                  (fin ? 'bg-accent text-accent-ink' : part ? 'border border-warn/60 text-warn' : 'bg-panel-2 text-faint')
                }
              >
                {s ? DAYS[s.day_id].short : ''}
              </div>
              <div className="text-[10px] text-faint">{dow}</div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

function ProgramInfo({ person, healing }: { person: Person; healing: boolean }) {
  const setHealing = useSetHealing()
  return (
    <section className="space-y-3">
      {person === 'emily' && (
        <div className="rounded-2xl border border-line bg-panel p-4">
          <label className="flex items-center justify-between gap-4">
            <span>
              <span className="block font-bold">Healing mode</span>
              <span className="text-sm text-dim">Conservative while the ab strain heals</span>
            </span>
            <input
              type="checkbox"
              role="switch"
              checked={healing}
              onChange={(e) => setHealing.mutate({ person, on: e.target.checked })}
              className="h-7 w-12 shrink-0 cursor-pointer appearance-none rounded-full bg-panel-2 transition-colors before:block before:size-6 before:translate-x-0.5 before:rounded-full before:bg-faint before:transition-transform checked:bg-accent checked:before:translate-x-5.5 checked:before:bg-accent-ink"
            />
          </label>
          {healing && (
            <ul className="mt-3 list-disc space-y-1 pl-5 text-sm text-dim">
              {HEALING_NOTES.map((n) => (
                <li key={n}>{n}</li>
              ))}
            </ul>
          )}
        </div>
      )}

      <div className="rounded-2xl border border-line bg-panel px-4 divide-y divide-line">
        <Disclosure label="Program & injury notes">
          <div className="space-y-2">
            {GLOBAL_NOTES[person].map((n) => (
              <Warning key={n}>{n}</Warning>
            ))}
          </div>
          <div className="mt-4 mb-2 text-xs font-semibold tracking-widest text-dim uppercase">Program rules</div>
          <ul className="list-disc space-y-1.5 pl-5 text-sm text-ink/90">
            {PROGRAM_RULES.map((r) => (
              <li key={r}>{r}</li>
            ))}
          </ul>
        </Disclosure>
        {DOCTOR[person].map((box) => (
          <Disclosure key={box.title} label={<span className="text-danger">{box.title}</span>} defaultOpen={person === 'emily'}>
            <ul className="list-disc space-y-1.5 pl-5 text-sm text-ink/90">
              {box.items.map((i) => (
                <li key={i}>{i}</li>
              ))}
            </ul>
            {box.urgent && (
              <div className="mt-3 rounded-lg bg-danger-bg p-3 text-sm">
                <div className="mb-1 font-bold text-danger">Go to the ER / urgent care</div>
                <ul className="list-disc space-y-1 pl-5 text-ink/90">
                  {box.urgent.map((i) => (
                    <li key={i}>{i}</li>
                  ))}
                </ul>
              </div>
            )}
          </Disclosure>
        ))}
      </div>
    </section>
  )
}

function Cardio({ person, dayId, healing, sessionId }: { person: Person; dayId: DayId; healing: boolean; sessionId: string | null }) {
  const log = useLogCardio(person)
  const history = useCardio(person)
  const [kind, setKind] = useState<CardioKind>('int-4x4')
  const [minutes, setMinutes] = useState(25)
  const plan = EMILY_CARDIO[dayId]
  const today = localDate()
  const doneToday = useMemo(() => history.data?.filter((c) => c.date === today) ?? [], [history.data, today])
  if (person === 'kevin') return null

  return (
    <section className="rounded-2xl border border-line bg-panel p-4">
      <div className="text-xs font-semibold tracking-widest text-dim uppercase">Cardio</div>
      <div className="mt-1 text-xl font-bold">{plan.label}</div>
      {isSunday(today) && <div className="text-sm text-dim">Sunday: {SUNDAY_CARDIO}</div>}
      {plan.hard && <div className="mt-1 text-sm text-dim">Max 2–3 hard sessions a week.</div>}
      <div className="mt-3 space-y-2" role="radiogroup" aria-label="Cardio type">
        {CARDIO_OPTIONS.map((o) => {
          const blocked = healing && o.sprint
          return (
            <button
              key={o.id}
              type="button"
              role="radio"
              aria-checked={kind === o.id}
              disabled={blocked}
              onClick={() => setKind(o.id)}
              className={
                'flex min-h-12 w-full items-center justify-between rounded-xl px-4 text-left text-sm font-semibold ' +
                (kind === o.id ? 'bg-ink text-bg' : 'bg-panel-2 text-ink') +
                (blocked ? ' opacity-40' : '')
              }
            >
              {o.label}
              {blocked && <span className="text-xs font-medium">on hold (healing)</span>}
            </button>
          )
        })}
      </div>
      {kind !== 'none' && (
        <div className="mt-4 flex items-center justify-between">
          <span className="text-sm text-dim">Minutes</span>
          <Stepper value={minutes} step={5} min={5} onChange={setMinutes} unit="min" />
        </div>
      )}
      <button
        type="button"
        onClick={() => log.mutate({ kind, minutes: kind === 'none' ? null : minutes, session_id: sessionId })}
        className="mt-4 h-12 w-full rounded-xl border border-line bg-panel-2 font-bold"
      >
        {log.isPending ? 'Saving…' : 'Log cardio'}
      </button>
      {doneToday.length > 0 && (
        <div className="mt-2 text-sm text-accent">
          Logged today: {doneToday.map((c) => CARDIO_OPTIONS.find((o) => o.id === c.kind)?.label + (c.minutes ? ` · ${c.minutes} min` : '')).join(', ')}
        </div>
      )}
      <div className="sr-only">{PERSON_NAME[person]}</div>
    </section>
  )
}
