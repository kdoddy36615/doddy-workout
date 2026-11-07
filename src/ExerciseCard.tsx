import { useState } from 'react'
import { stateDefaults, type ExerciseState, type SetLog } from './db'
import { formatWeight, warmupSets } from './logic'
import {
  EXERCISES,
  incrementFor,
  schemeFor,
  stateKey,
  SWAP_WHEN,
  type Load,
  type Person,
  type Scheme,
  type Slot,
  type SlotPerson,
} from './program'
import { Disclosure, Media, restartRest, Stepper, Warning } from './ui'

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
  /** offline: nothing can be saved, so no taps */
  disabled?: boolean
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
  const warnings = [...(cfg.warnings ?? []), ...(healing ? (cfg.healingWarnings ?? []) : [])]
  const doneCount = props.sets.filter((s) => s.done).length
  const warmup = warmupSets(st.weight)
  const [showSwaps, setShowSwaps] = useState(false)
  const why = (v: string) => SWAP_WHEN[`${props.person}/${slot.id}/${v}`] ?? 'you prefer it'
  // first session on a lift with no injury notes: offer a bigger jump if it was easy
  const calibrating =
    weighted &&
    !st.calibrated &&
    warnings.length === 0 &&
    !(healing && cfg.healingProgression) &&
    doneCount >= scheme.sets &&
    st.suggested == null

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
        <div className="mt-3">
          {variant !== cfg.variants[0] && (
            <div className="mb-2 rounded-lg bg-panel-2 px-3 py-2 text-sm leading-snug">
              <span className="font-semibold">Swapped in</span>
              {healing && cfg.healingDefault === variant ? ' (preselected while healing)' : ''}: use this when{' '}
              {why(variant)}. Switch back to {EXERCISES[cfg.variants[0]].name} once that’s no longer true.
            </div>
          )}
          <button
            type="button"
            disabled={props.disabled}
            aria-expanded={showSwaps}
            onClick={() => setShowSwaps((s) => !s)}
            className="flex h-11 w-full items-center justify-between rounded-lg border border-line px-3 text-sm font-semibold text-dim"
          >
            Swap exercise ({cfg.variants.length - 1} option{cfg.variants.length > 2 ? 's' : ''})
            <span className={'text-faint transition-transform ' + (showSwaps ? 'rotate-180' : '')}>▾</span>
          </button>
          {showSwaps && (
            <ul className="mt-2 space-y-2" role="radiogroup" aria-label="Exercise variant">
              {cfg.variants.map((v, i) => (
                <li key={v}>
                  <button
                    type="button"
                    role="radio"
                    aria-checked={v === variant}
                    onClick={() => {
                      props.onVariant(v)
                      setShowSwaps(false)
                    }}
                    className={
                      'w-full rounded-xl border px-3 py-2.5 text-left ' +
                      (v === variant ? 'border-accent bg-accent/10' : 'border-line bg-panel-2')
                    }
                  >
                    <span className="block text-sm font-bold">
                      {EXERCISES[v].name}
                      {v === variant && <span className="ml-2 text-xs font-semibold text-accent">current</span>}
                    </span>
                    <span className="block text-xs leading-snug text-dim">
                      {i === 0 ? 'Standard. Use this unless one of the reasons below applies.' : `Use when ${why(v)}.`}
                    </span>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
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
          <Stepper value={st.weight} step={step} onChange={setWeight} unit={UNIT[ex.load]} big disabled={props.disabled} />
          {st.suggested != null && st.suggested !== st.weight && (
            <button
              type="button"
              disabled={props.disabled}
              onClick={() => props.onState({ ...st, weight: st.suggested!, suggested: null, fails: 0 })}
              className={
                'rounded-full px-4 py-2.5 text-sm font-bold ' +
                (st.suggested > st.weight ? 'bg-accent text-accent-ink' : 'bg-warn text-accent-ink')
              }
            >
              {st.suggested > st.weight ? 'Suggested' : slot.main ? 'Deload to' : 'Go lighter:'} {formatWeight(st.suggested)} lb
            </button>
          )}
        </div>
      )}
      {weighted && st.weight === 0 && ex.load === 'machine' && variant === 'calf-raise' && (
        <div className="mt-1 text-xs text-faint">0 = bodyweight</div>
      )}
      {slot.main && ex.load === 'barbell' && (
        <div className="mt-3 rounded-lg border border-warmup/40 bg-warmup-bg px-3 py-2 text-sm">
          <span className="font-bold text-warmup">Warm-up sets: </span>
          {warmup.length === 0 ? (
            <span className="text-ink/90">none needed at the empty bar; your first set is the warm-up.</span>
          ) : (
            <span className="font-semibold text-ink tabular-nums">{warmup.map((w) => `${formatWeight(w.weight)}×${w.reps}`).join(' → ')}</span>
          )}
        </div>
      )}
      {st.fails > 0 && (
        <div className="mt-2 text-xs text-warn">
          {slot.main
            ? `Missed reps ${st.fails}× at this weight. 3 in a row suggests a ~10% deload.`
            : `Below the rep range ${st.fails}× in a row. 2 in a row suggests going one step lighter.`}
        </div>
      )}
      {calibrating && (
        <div className="mt-3 rounded-lg border border-accent/40 bg-accent/10 p-3">
          <div className="text-sm font-semibold">First time on this lift: how did it feel?</div>
          <div className="mt-2 flex gap-2">
            <button
              type="button"
              disabled={props.disabled}
              onClick={() => props.onState({ ...st, suggested: st.weight + 2 * step })}
              className="h-11 flex-1 rounded-lg bg-accent text-sm font-bold text-accent-ink"
            >
              Easy (3+ reps left) → +{formatWeight(2 * step)}
            </button>
            <button
              type="button"
              disabled={props.disabled}
              onClick={() => props.onState({ ...st, calibrated: true })}
              className="h-11 flex-1 rounded-lg bg-panel-2 text-sm font-bold"
            >
              About right
            </button>
          </div>
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
              <button type="button" disabled={props.disabled} aria-label="Fewer reps" className="grid size-11 place-items-center rounded-lg bg-panel-2 text-xl" onClick={() => save({ reps: Math.max(0, reps - 1) })}>
                −
              </button>
              <span className="w-12 text-center text-2xl font-bold tabular-nums">
                {reps}
                <span className="ml-0.5 text-xs font-medium text-faint">{ex.timed ? 's' : ''}</span>
              </span>
              <button type="button" disabled={props.disabled} aria-label="More reps" className="grid size-11 place-items-center rounded-lg bg-panel-2 text-xl" onClick={() => save({ reps: reps + 1 })}>
                +
              </button>
              <button
                type="button"
                aria-pressed={done}
                disabled={props.disabled}
                aria-label={done ? `Set ${i + 1} done` : `Mark set ${i + 1} done`}
                onClick={() => {
                  if (!done) restartRest()
                  save({ done: !done })
                }}
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
        <Disclosure
          label={
            <span>
              Machine settings
              {st.setup_note && <span className="ml-2 font-normal text-ink/80">· {st.setup_note}</span>}
            </span>
          }
        >
          <div className="space-y-4">
            <label className="block">
              <span className="mb-1.5 block text-xs text-dim">
                Your note for this exercise: seat height, pin position, foot spot. It shows on the card once saved.
              </span>
              <input
                defaultValue={st.setup_note ?? ''}
                placeholder="e.g. seat 4, pins at 7, feet low"
                disabled={props.disabled}
                onBlur={(e) => e.target.value !== (st.setup_note ?? '') && props.onState({ ...st, setup_note: e.target.value || null })}
                className="h-11 w-full rounded-lg border border-line bg-panel-2 px-3 text-sm"
              />
            </label>
            {weighted && (
              <div>
                <span className="mb-1.5 block text-xs text-dim">
                  Weight jump: how much − / + changes the weight (and the suggested increase).
                </span>
                <div className="flex gap-2" role="group" aria-label="Weight jump">
                  {[2.5, 5, 10].map((s) => (
                    <button
                      key={s}
                      type="button"
                      disabled={props.disabled}
                      aria-pressed={step === s}
                      onClick={() => props.onState({ ...st, step: s })}
                      className={'h-11 flex-1 rounded-lg text-sm font-semibold ' + (step === s ? 'bg-ink text-bg' : 'bg-panel-2 text-ink')}
                    >
                      {s} lb
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        </Disclosure>
      </div>
    </article>
  )
}
