import { useEffect, useRef, useState } from 'react'
import {
  startSession,
  useChoices,
  useFinish,
  useHealing,
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
import { RunPlan } from './RunPlan'
import { isSunday, lastDates, localDate, nextDay } from './logic'
import {
  DAYS,
  DOCTOR,
  GLOBAL_NOTES,
  HEALING_NOTES,
  PROGRAM_RULES,
  ROTATION,
  WARMUPS,
  pickVariant,
  slotsFor,
  stateKey,
  type DayId,
  type Person,
} from './program'
import { Disclosure, Media, Warning } from './ui'
import { useQueryClient } from '@tanstack/react-query'

function useOnline() {
  const [online, setOnline] = useState(() => navigator.onLine)
  useEffect(() => {
    const on = () => setOnline(true)
    const off = () => setOnline(false)
    window.addEventListener('online', on)
    window.addEventListener('offline', off)
    return () => {
      window.removeEventListener('online', on)
      window.removeEventListener('offline', off)
    }
  }, [])
  return online
}

export function PersonView({ person }: { person: Person }) {
  const online = useOnline()
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

  if (!sessions.data && !states.data && (sessions.isError || states.isError)) {
    return <div className="p-4 text-danger">Couldn’t reach the database. Check your signal and reload.</div>
  }
  if (!sessions.data || !states.data || !choices.data) {
    return <div className="p-6 text-dim">Loading…</div>
  }

  const color = person === 'kevin' ? 'text-kevin' : 'text-emily'
  const warmup = WARMUPS[person][day.kind]
  const sets = setLogs.data ?? []

  const offline = !online || sessions.isError || states.isError

  return (
    <div className="space-y-4">
      {offline && (
        <div className="rounded-xl border border-warn/40 bg-warn-bg px-4 py-3 text-sm text-warn">
          No signal. Showing your last saved workout; logging sets needs a connection.
        </div>
      )}
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

      {day.note?.[person] && (
        <div className="rounded-xl border border-cardio/40 bg-cardio-bg px-4 py-3 text-sm font-semibold text-cardio">{day.note[person]}</div>
      )}

      {warmup && (
        <section className="rounded-2xl border-2 border-warmup/60 bg-warmup-bg px-4">
          <Disclosure
            label={
              <span className="flex items-center gap-2 text-base">
                <span className="rounded-md bg-warmup px-2 py-0.5 text-xs font-black tracking-wider text-bg uppercase">Start here</span>
                <span className="font-bold text-warmup">Warm-up</span>
              </span>
            }
            defaultOpen={false}
          >
            <ul className="space-y-1">
              {warmup.map((w) =>
                w.media ? (
                  <li key={w.text} className="rounded-lg bg-bg/40 px-3">
                    <Disclosure label={<span className="font-medium text-ink/90">{w.text}</span>}>
                      <Media src={w.media} alt={`${w.text} form`} />
                    </Disclosure>
                  </li>
                ) : (
                  <li key={w.text} className="px-3 py-3 text-sm text-ink/90">
                    {w.text}
                  </li>
                ),
              )}
            </ul>
          </Disclosure>
        </section>
      )}

      {slotsFor(person, dayId).map(({ slot, cfg }) => {
        const variant = pickVariant(cfg, choices.data?.[slot.id], healing)
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
            disabled={offline}
            onVariant={(v) => setChoice.mutate({ slot_key: slot.id, variant: v })}
            onState={(s) => saveState.mutate(s)}
            onSet={onSet}
          />
        )
      })}

      {person === 'emily' && (
        <RunPlan
          person={person}
          healing={healing}
          dayId={dayId}
          sessions={sessions.data ?? []}
          sessionId={active?.id ?? null}
          disabled={offline}
        />
      )}

      <button
        type="button"
        disabled={!active || finish.isPending || offline}
        onClick={() =>
          active &&
          finish.mutate({ session: active, states: states.data ?? {}, choices: choices.data ?? {}, healing }, { onSuccess: () => setOverride(null) })
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
          <div className="flex items-center justify-between gap-4">
            <span>
              <span className="block font-bold">Healing mode</span>
              <span className="text-sm text-dim">Conservative while the ab strain heals</span>
            </span>
            <button
              type="button"
              role="switch"
              aria-checked={healing}
              aria-label="Healing mode"
              onClick={() => setHealing.mutate({ person, on: !healing })}
              className="flex shrink-0 items-center gap-2"
            >
              <span className={'w-7 text-right text-xs font-bold ' + (healing ? 'text-accent' : 'text-faint')}>{healing ? 'ON' : 'OFF'}</span>
              <span className={'relative h-8 w-14 rounded-full transition-colors ' + (healing ? 'bg-accent' : 'bg-line')}>
                <span
                  className={
                    'absolute top-1 left-1 size-6 rounded-full bg-white shadow-md transition-transform ' + (healing ? 'translate-x-6' : 'translate-x-0')
                  }
                />
              </span>
            </button>
          </div>
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
