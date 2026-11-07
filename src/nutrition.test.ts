import { describe, expect, it } from 'vitest'
import { longRunMinutes, nudge, PROFILES, targets, trend } from './nutrition'

describe('targets', () => {
  it('matches the agreed starting numbers for Kevin (185 lb)', () => {
    expect(targets(PROFILES.kevin, 185)).toMatchObject({ kcal: 2450, protein: 165, fat: 70, carbs: 290 })
  })
  it('matches the agreed starting numbers for Emily (180 lb)', () => {
    expect(targets(PROFILES.emily, 180)).toMatchObject({ kcal: 2075, protein: 140, fat: 65, carbs: 235 })
  })
  it('goes down as weight goes down', () => {
    expect(targets(PROFILES.kevin, 175).kcal).toBeLessThan(targets(PROFILES.kevin, 185).kcal)
  })
  it('extra kcal land on carbs', () => {
    const a = targets(PROFILES.emily, 180)
    const b = targets(PROFILES.emily, 180, 250)
    expect(b.kcal - a.kcal).toBe(250)
    expect(b.protein).toBe(a.protein)
    expect(b.carbs).toBeGreaterThan(a.carbs)
  })
})

describe('trend + nudge', () => {
  const w = (date: string, weight: number) => ({ date, weight })
  it('needs 3 weigh-ins spanning 2+ weeks', () => {
    expect(trend([w('2026-11-01', 185), w('2026-11-08', 184)], '2026-11-08')).toBeNull()
  })
  it('computes lb/week lost', () => {
    expect(trend([w('2026-11-01', 185), w('2026-11-08', 184), w('2026-11-15', 183)], '2026-11-15')).toBeCloseTo(1, 5)
  })
  it('nudges down when too slow, up when too fast, else nothing', () => {
    expect(nudge(0.1, 0.74)).toBe(-100)
    expect(nudge(-0.5, 0.74)).toBe(-100)
    expect(nudge(0.7, 0.74)).toBe(0)
    expect(nudge(1.5, 0.74)).toBe(100)
    expect(nudge(null, 0.74)).toBe(0)
  })
})

describe('long-run minutes', () => {
  it('parses plan text', () => {
    expect(longRunMinutes('1:35 easy, walk breaks OK')).toBe(95)
    expect(longRunMinutes('75 min easy (~5+ mi)')).toBe(75)
    expect(longRunMinutes('Run 2 / walk 1 × 8 + run 1 (25 min)')).toBe(25)
    expect(longRunMinutes('HALF MARATHON: 13.1 mi, run/walk OK')).toBe(180)
  })
})
