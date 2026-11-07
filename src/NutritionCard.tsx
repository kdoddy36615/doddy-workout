import { useState } from 'react'
import { useKcalAdjust, useLogWeighIn, useRunPlan, useSetKcalAdjust, useWeighIns } from './db'
import { formatWeight, localDate } from './logic'
import { LONG_RUN_EXTRA_KCAL, longRunMinutes, nudge, PROFILES, targets, trend } from './nutrition'
import type { Person } from './program'
import { PLAN_WEEKS, planState } from './running'
import { Disclosure, Stepper } from './ui'

export function NutritionCard(props: { person: Person; healing: boolean; disabled?: boolean }) {
  const { person } = props
  const p = PROFILES[person]
  const weighIns = useWeighIns(person)
  const adjustQ = useKcalAdjust(person)
  const setAdjust = useSetKcalAdjust(person)
  const logWeight = useLogWeighIn(person)
  const run = useRunPlan(person)
  const now = new Date()
  const today = localDate(now)

  const list = weighIns.data ?? []
  const last = list.at(-1)
  const current = last?.weight ?? p.startLb
  const adjust = adjustQ.data ?? 0

  // Emily: extra carbs on Saturdays when the plan's long run is 90+ min
  let longRunBonus = 0
  if (person === 'emily' && now.getDay() === 6) {
    const st = planState(props.healing, run.data?.run_week ?? 0, run.data?.run_start ?? null, now)
    if (st.status === 'active' && longRunMinutes(PLAN_WEEKS[st.index].long) >= 90) longRunBonus = LONG_RUN_EXTRA_KCAL
  }

  const t = targets(p, current, adjust + longRunBonus)
  const rate = trend(list, today)
  const suggestion = nudge(rate, t.lossPerWeek)
  const toGo = Math.max(0, current - p.goalLb)
  const [entry, setEntry] = useState<number | null>(null)
  const weighed = last?.date === today

  return (
    <section className="rounded-2xl border-2 border-food/50 bg-food-bg p-4">
      <div className="flex items-baseline justify-between">
        <div className="text-xs font-semibold tracking-widest text-food uppercase">Nutrition</div>
        <div className="text-xs text-faint">
          Goal {p.goal} · {formatWeight(toGo)} to go
        </div>
      </div>
      <div className="mt-1 text-4xl font-black tracking-tight tabular-nums">
        {t.kcal.toLocaleString()} <span className="text-base font-semibold text-dim">kcal / day</span>
      </div>
      {longRunBonus > 0 && <div className="text-sm font-semibold text-cardio">Includes +{longRunBonus} kcal (carbs) for today’s long run.</div>}

      <div className="mt-3 grid grid-cols-3 gap-2 text-center">
        {[
          ['Protein', t.protein],
          ['Carbs', t.carbs],
          ['Fat', t.fat],
        ].map(([label, g]) => (
          <div key={label} className="rounded-xl bg-bg/40 py-2.5">
            <div className="text-2xl font-extrabold tabular-nums">
              {g}
              <span className="text-sm font-semibold text-dim">g</span>
            </div>
            <div className="text-xs text-dim">{label}</div>
          </div>
        ))}
      </div>

      <div className="mt-4 rounded-xl bg-bg/40 p-3">
        <div className="flex items-center justify-between gap-3">
          <span className="text-sm font-semibold">Weekly weigh-in</span>
          <Stepper value={entry ?? current} step={0.5} min={80} onChange={setEntry} unit="lb" disabled={props.disabled} />
        </div>
        <button
          type="button"
          disabled={props.disabled || logWeight.isPending}
          onClick={() => logWeight.mutate(entry ?? current, { onSuccess: () => setEntry(null) })}
          className="mt-3 h-11 w-full rounded-xl bg-food font-bold text-bg disabled:opacity-50"
        >
          {logWeight.isPending ? 'Saving…' : weighed ? 'Update today’s weigh-in' : 'Log weigh-in'}
        </button>
        <div className="mt-2 text-xs text-dim">
          {last ? `Last: ${formatWeight(last.weight)} lb on ${last.date.slice(5)}. ` : 'No weigh-ins yet. '}
          Same morning each week, after the bathroom, before eating.
        </div>
        {rate != null && (
          <div className="mt-2 text-sm">
            Trend: {rate >= 0 ? `losing ${rate.toFixed(1)}` : `gaining ${(-rate).toFixed(1)}`} lb/week · target {t.lossPerWeek.toFixed(1)}
          </div>
        )}
        {suggestion !== 0 && (
          <button
            type="button"
            disabled={props.disabled}
            onClick={() => setAdjust.mutate(adjust + suggestion)}
            className="mt-2 h-11 w-full rounded-xl bg-accent text-sm font-bold text-accent-ink"
          >
            {suggestion < 0 ? 'Losing slower than planned: eat 100 kcal less' : 'Losing faster than planned: eat 100 kcal more'}
          </button>
        )}
        {adjust !== 0 && (
          <div className="mt-2 flex items-center justify-between text-xs text-dim">
            <span>
              Trend adjustment: {adjust > 0 ? '+' : ''}
              {adjust} kcal
            </span>
            <button type="button" disabled={props.disabled} className="font-semibold underline" onClick={() => setAdjust.mutate(0)}>
              Reset
            </button>
          </div>
        )}
      </div>

      <Disclosure label="How this is calculated">
        <ul className="list-disc space-y-1.5 pl-5 text-sm text-ink/90">
          <li>
            Maintenance ≈ {t.maintenance.toLocaleString()} kcal (Mifflin-St Jeor for {p.age}, {Math.floor(p.heightIn / 12)}′
            {p.heightIn % 12}″, {formatWeight(current)} lb × 1.55 for lifting 6 days a week).
          </li>
          <li>
            Target loses ~{t.lossPerWeek.toFixed(1)} lb/week (0.4% of bodyweight): slow on purpose to keep strength
            {person === 'emily' ? ' and running' : ''} progressing.
          </li>
          <li>Protein {t.protein} g is anchored to your goal weight to keep muscle while losing fat. Fat ~{p.fatPerLb} g per lb. Carbs fill the rest.</li>
          <li>Targets update with each weigh-in. If the 2-week trend is well off pace, a ±100 kcal suggestion appears; the formula is only an estimate.</li>
          {person === 'emily' && <li>Long runs of 90+ min (half-marathon build) add {LONG_RUN_EXTRA_KCAL} kcal of carbs that day.</li>}
          <li>A starting point, not a dietitian’s plan.</li>
        </ul>
      </Disclosure>
    </section>
  )
}
