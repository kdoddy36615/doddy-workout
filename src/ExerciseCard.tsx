import { useState } from 'react'
import { stateDefaults, type ExerciseState, type SetLog } from './db'
import { formatWeight } from './logic'
import {
  EXERCISES,
  incrementFor,
  schemeFor,
  stateKey,
  type Load,
  type Person,
  type Scheme,
  type Slot,
  type SlotPerson,
} from './program'
import { Disclosure, Media, Stepper, Warning } from './ui'

const UNIT: Record<Load, string> = { barbell: 'lb', dumbbell: 'lb / DB', machine: 'lb', bodyweight: '' }

export function schemeLabel(s: Scheme, amrap: boolean, perSide?: boolean, timed?: boolean) {
  const [min, max] = s.reps
  const r = min === max ? `${min}` : `${min}–${max}`
  const suffix = timed ? 's' : ''
  const side = perSide ? '/side' : ''
  if (amrap && s.amrapLast && s.sets > 1) return `${s.sets - 1}×${r}${suffix}, 1×${r}+`
  if (amrap && s.amrapLast) return `${s.sets}×${r}+`
  return `${s.sets}×${r}${suffix}${side}`
}

export function ExerciseCard(props: {
  person: Person
  slot: Slot
  cfg: SlotPerson
  variant: string
  state: ExerciseState | undefined
  sets: SetLog[]
  healing: boolean
  onVariant: (v: string) => void
  onState: (s: Omit<ExerciseState, 'person'>) => void
  onSet: (s: Omit<SetLog, 'session_id'>) => void
}) {
  const { slot, cfg, variant, healing } = props
  const ex = EXERCISES[variant]
  const k = stateKey(variant, slot.main)
  const st = props.state ?? { ...stateDefaults(k, cfg.start[variant] ?? 0), person: props.person }
  const scheme = schemeFor(slot, cfg, variant)
  const amrap = Boolean(scheme.amrapLast) && !healing
  const step = st.step ?? (incrementFor(cfg, variant) || 5)
  const weighted = ex.load !== 'bodyweight'
  const [showSetup, setShowSetup] = useState(false)
  const warnings = [...(cfg.warnings ?? []), ...(healing ? (cfg.healingWarnings ?? []) : [])]
  const doneCount = props.sets.filter((s) => s.done).length

  const setWeight = (w: number) =>
    props.onState({ ...st, weight: w, fails: w === st.weight ? st.fails : 0, suggested: st.suggested === w ? null : st.suggested })

  return (
    <article className="rounded-2xl border border-line bg-panel p-4">
      <header className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          {slot.main && <div className="mb-1 text-[11px] font-bold tracking-widest text-accent uppercase">Main lift</div>}
          <h3 className="text-lg leading-tight font-bold">{ex.name}</h3>
          <div className="mt-1 text-2xl font-extrabold tracking-tight text-ink tabular-nums">
            {schemeLabel(scheme, amrap, ex.perSide, ex.timed)}
          </div>
        </div>
        <div className="shrink-0 pt-1 text-right text-sm text-dim tabular-nums">
          {doneCount}/{scheme.sets}
        </div>
      </header>

      {cfg.variants.length > 1 && (
        <label className="mt-3 block">
          <span className="sr-only">Exercise variant</span>
          <select
            value={variant}
            onChange={(e) => props.onVariant(e.target.value)}
            className="h-11 w-full rounded-lg border border-line bg-panel-2 px-3 text-sm font-medium text-ink"
          >
            {cfg.variants.map((v, i) => (
              <option key={v} value={v}>
                {EXERCISES[v].name}
                {i === 0 ? ' (standard)' : ''}
              </option>
            ))}
          </select>
        </label>
      )}

      {warnings.length > 0 && (
        <div className="mt-3 space-y-2">
          {warnings.map((w) => (
            <Warning key={w}>{w}</Warning>
          ))}
        </div>
      )}

      {weighted && (
        <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
          <Stepper value={st.weight} step={step} onChange={setWeight} unit={UNIT[ex.load]} big />
          {st.suggested != null && st.suggested !== st.weight && (
            <button
              type="button"
              onClick={() => props.onState({ ...st, weight: st.suggested!, suggested: null, fails: 0 })}
              className={
                'rounded-full px-4 py-2.5 text-sm font-bold ' +
                (st.suggested > st.weight ? 'bg-accent text-accent-ink' : 'bg-warn text-accent-ink')
              }
            >
              {st.suggested > st.weight ? 'Suggested' : 'Deload to'} {formatWeight(st.suggested)} lb
            </button>
          )}
        </div>
      )}
      {weighted && st.weight === 0 && ex.load === 'machine' && variant === 'calf-raise' && (
        <div className="mt-1 text-xs text-faint">0 = bodyweight</div>
      )}
      {st.fails > 0 && slot.main && (
        <div className="mt-2 text-xs text-warn">
          Missed reps {st.fails}× at this weight. 3 in a row suggests a 10% deload.
        </div>
      )}

      <ol className="mt-4 space-y-2">
        {Array.from({ length: scheme.sets }, (_, i) => {
          const log = props.sets.find((s) => s.set_index === i)
          const isAmrap = amrap && i === scheme.sets - 1
          const reps = log?.reps ?? scheme.reps[0]
          const done = log?.done ?? false
          const save = (patch: Partial<SetLog>) =>
            props.onSet({ key: k, set_index: i, weight: st.weight, reps, done, ...patch })
          return (
            <li key={i} className={'flex items-center gap-2 rounded-xl px-2 py-1.5 ' + (done ? 'bg-accent/10' : 'bg-panel-2/60')}>
              <span className="w-14 shrink-0 text-xs font-semibold text-dim">
                Set {i + 1}
                {isAmrap && <span className="block text-accent">AMRAP</span>}
              </span>
              <button type="button" aria-label="Fewer reps" className="grid size-11 place-items-center rounded-lg bg-panel-2 text-xl" onClick={() => save({ reps: Math.max(0, reps - 1) })}>
                −
              </button>
              <span className="w-12 text-center text-2xl font-bold tabular-nums">
                {reps}
                <span className="ml-0.5 text-xs font-medium text-faint">{ex.timed ? 's' : ''}</span>
              </span>
              <button type="button" aria-label="More reps" className="grid size-11 place-items-center rounded-lg bg-panel-2 text-xl" onClick={() => save({ reps: reps + 1 })}>
                +
              </button>
              <button
                type="button"
                aria-pressed={done}
                aria-label={done ? `Set ${i + 1} done` : `Mark set ${i + 1} done`}
                onClick={() => save({ done: !done })}
                className={
                  'ml-auto grid h-12 w-16 place-items-center rounded-xl text-2xl font-black ' +
                  (done ? 'bg-accent text-accent-ink' : 'border-2 border-line text-faint')
                }
              >
                ✓
              </button>
            </li>
          )
        })}
      </ol>
      <div className="mt-2 text-xs text-faint">Rest ~{slot.main ? '3 min' : '90 s'} between sets</div>

      <div className="mt-2 divide-y divide-line border-t border-line">
        {ex.media && (
          <Disclosure label="Form">
            <Media src={ex.media} alt={`${ex.name} form`} />
          </Disclosure>
        )}
        {ex.cues && ex.cues.length > 0 && (
          <Disclosure label="Notes">
            <ul className="list-disc space-y-1 pl-5 text-sm text-dim">
              {ex.cues.map((c) => (
                <li key={c}>{c}</li>
              ))}
            </ul>
          </Disclosure>
        )}
        <div>
          <button type="button" className="py-3 text-sm font-semibold text-dim" onClick={() => setShowSetup((s) => !s)}>
            Setup {st.setup_note ? `· ${st.setup_note}` : ''}
          </button>
          {showSetup && (
            <div className="space-y-3 pb-3">
              <input
                defaultValue={st.setup_note ?? ''}
                placeholder="Seat 4, pins at 7, feet low…"
                onBlur={(e) => e.target.value !== (st.setup_note ?? '') && props.onState({ ...st, setup_note: e.target.value || null })}
                className="h-11 w-full rounded-lg border border-line bg-panel-2 px-3 text-sm"
              />
              {weighted && (
                <div className="flex items-center gap-2 text-sm text-dim">
                  Step
                  {[2.5, 5, 10].map((s) => (
                    <button
                      key={s}
                      type="button"
                      onClick={() => props.onState({ ...st, step: s })}
                      className={'h-10 rounded-lg px-3 font-semibold ' + (step === s ? 'bg-ink text-bg' : 'bg-panel-2')}
                    >
                      {s}
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </article>
  )
}
