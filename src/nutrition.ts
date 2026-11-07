import type { Person } from './program'

// Daily targets: Mifflin-St Jeor BMR × activity, minus a slow deficit (~0.4% bodyweight/week).
// Recalculated from the latest weigh-in. Not a dietitian's plan; the weekly trend corrects the estimate.

export type Profile = {
  sex: 'm' | 'f'
  age: number
  heightIn: number
  goal: string
  goalLb: number
  /** protein (g) is anchored to goal weight, ~1 g/lb (Emily ~0.9) */
  proteinG: number
  /** fat (g) per lb of current bodyweight */
  fatPerLb: number
  startLb: number
}

export const PROFILES: Record<Person, Profile> = {
  kevin: { sex: 'm', age: 34, heightIn: 72, goal: '165 lb', goalLb: 165, proteinG: 165, fatPerLb: 0.38, startLb: 185 },
  emily: { sex: 'f', age: 33, heightIn: 68.5, goal: '150–155 lb', goalLb: 152.5, proteinG: 140, fatPerLb: 0.36, startLb: 180 },
}

export const ACTIVITY = 1.55 // lifting 6 days/week ≈ "moderately active"
export const LOSS_PER_WEEK = 0.004 // fraction of bodyweight
const KCAL_PER_LB = 3500

export function bmr(p: Profile, weightLb: number) {
  const kg = weightLb * 0.45359237
  const cm = p.heightIn * 2.54
  return 10 * kg + 6.25 * cm - 5 * p.age + (p.sex === 'm' ? 5 : -161)
}

export type Targets = { kcal: number; protein: number; fat: number; carbs: number; maintenance: number; lossPerWeek: number }

const r25 = (n: number) => Math.round(n / 25) * 25

/** extraKcal: trend nudge (±100 steps) plus any long-run carbs, all added as carbs. */
export function targets(p: Profile, weightLb: number, extraKcal = 0): Targets {
  const maintenance = bmr(p, weightLb) * ACTIVITY
  const lossPerWeek = weightLb * LOSS_PER_WEEK
  const kcal = r25(maintenance - (lossPerWeek * KCAL_PER_LB) / 7) + extraKcal
  const fat = Math.round(weightLb * p.fatPerLb)
  const protein = p.proteinG
  const carbs = Math.max(0, Math.round((kcal - protein * 4 - fat * 9) / 4 / 5) * 5)
  return { kcal, protein, fat, carbs, maintenance: r25(maintenance), lossPerWeek }
}

export type WeighIn = { date: string; weight: number }

/** lb/week from a least-squares line through weigh-ins of the last 28 days (needs 3+ over 14+ days). */
export function trend(weighIns: WeighIn[], today: string): number | null {
  const t = (s: string) => new Date(s + 'T12:00').getTime() / (7 * 864e5)
  const now = t(today)
  const pts = weighIns.filter((w) => now - t(w.date) <= 4).map((w) => ({ x: t(w.date), y: w.weight }))
  if (pts.length < 3) return null
  const xs = pts.map((p) => p.x)
  if (Math.max(...xs) - Math.min(...xs) < 2) return null
  const mx = xs.reduce((a, b) => a + b, 0) / pts.length
  const my = pts.reduce((a, p) => a + p.y, 0) / pts.length
  const num = pts.reduce((a, p) => a + (p.x - mx) * (p.y - my), 0)
  const den = pts.reduce((a, p) => a + (p.x - mx) ** 2, 0)
  return den === 0 ? null : -(num / den) // positive = losing
}

/** Suggest ±100 kcal when the trend is well off the target pace. */
export function nudge(lossPerWeek: number | null, target: number): -100 | 0 | 100 {
  if (lossPerWeek == null) return 0
  if (lossPerWeek < target * 0.5) return -100 // losing too slowly (or gaining)
  if (lossPerWeek > target * 1.75) return 100 // losing too fast
  return 0
}

/** Long-run day fuel (Emily, half build): +250 kcal as carbs when the long run is 90+ min. */
export function longRunMinutes(text: string): number {
  if (/HALF MARATHON/i.test(text)) return 180
  const hm = /^(\d+):(\d\d)/.exec(text)
  if (hm) return Number(hm[1]) * 60 + Number(hm[2])
  const m = /(\d+) min/.exec(text)
  return m ? Number(m[1]) : 0
}
export const LONG_RUN_EXTRA_KCAL = 250
