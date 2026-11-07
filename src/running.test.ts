import { describe, expect, it } from 'vitest'
import { localDate } from './logic'
import { mondayOf, nextMonday, PLAN_WEEKS, planState, sessionForWeekday, todayPlan } from './running'

const d = (s: string) => {
  const [y, m, day] = s.split('-').map(Number)
  return new Date(y, m - 1, day)
}
// 2026-11-09 is a Monday
describe('dates', () => {
  it('nextMonday keeps a Monday, else moves forward', () => {
    expect(localDate(nextMonday(d('2026-11-09')))).toBe('2026-11-09')
    expect(localDate(nextMonday(d('2026-11-07')))).toBe('2026-11-09')
    expect(localDate(nextMonday(d('2026-11-10')))).toBe('2026-11-16')
  })
  it('mondayOf goes back to the week start', () => {
    expect(localDate(mondayOf(d('2026-11-15')))).toBe('2026-11-09')
    expect(localDate(mondayOf(d('2026-11-09')))).toBe('2026-11-09')
  })
})

describe('planState', () => {
  it('healing mode always shows healing', () => {
    expect(planState(true, 3, '2026-11-09', d('2026-11-20')).status).toBe('healing')
  })
  it('before the first Monday it is "starting"', () => {
    expect(planState(false, 0, '2026-11-09', d('2026-11-07'))).toEqual({ status: 'starting', index: 0, startsOn: '2026-11-09' })
  })
  it('advances one week per calendar week', () => {
    expect(planState(false, 0, '2026-11-09', d('2026-11-09'))).toEqual({ status: 'active', index: 0 })
    expect(planState(false, 0, '2026-11-09', d('2026-11-15'))).toEqual({ status: 'active', index: 0 })
    expect(planState(false, 0, '2026-11-09', d('2026-11-16'))).toEqual({ status: 'active', index: 1 })
  })
  it('repeat this week: runWeek = current, start = next Monday → same week shows now and next week', () => {
    // she's on index 4 during the week of 2026-11-09 and taps repeat
    expect(planState(false, 4, '2026-11-16', d('2026-11-12'))).toEqual({ status: 'active', index: 4 })
    expect(planState(false, 4, '2026-11-16', d('2026-11-18'))).toEqual({ status: 'active', index: 4 })
    expect(planState(false, 4, '2026-11-16', d('2026-11-23'))).toEqual({ status: 'active', index: 5 })
  })
  it('resuming after healing keeps the paused week (not "starting")', () => {
    expect(planState(false, 3, '2026-11-16', d('2026-11-12'))).toEqual({ status: 'active', index: 3 })
  })
  it('ends after the last week', () => {
    expect(planState(false, PLAN_WEEKS.length - 1, '2026-11-09', d('2026-11-16')).status).toBe('done')
  })
})

describe('todayPlan', () => {
  const w = PLAN_WEEKS[10] // base week 1 (has steady blocks)
  const none = { today: false, tomorrow: false, yesterday: false }
  it('maps weekdays: Mon quality, Thu easy, Sat long, Sun rest, others easy cardio', () => {
    expect([0, 1, 2, 3, 4, 5, 6].map(sessionForWeekday)).toEqual(['rest', 'quality', 'cardio', 'cardio', 'easy', 'cardio', 'long'])
  })
  it('Sunday is always rest, even while healing', () => {
    expect(todayPlan(null, 0, none).kind).toBe('rest')
  })
  it('healing shows the incline walk on every non-Sunday', () => {
    expect(todayPlan(null, 1, none).text).toMatch(/Incline walk/)
  })
  it('quality run near a full leg day is downgraded with a warning', () => {
    expect(todayPlan(w, 1, none).warning).toBeUndefined()
    expect(todayPlan(w, 1, { ...none, tomorrow: true }).warning).toMatch(/easy run of the same length/)
    expect(todayPlan(w, 1, { ...none, yesterday: true }).warning).toMatch(/easy run/)
  })
  it('long run on a full leg day says run first, light legs only', () => {
    expect(todayPlan(w, 6, { ...none, today: true }).warning).toMatch(/light legs only/)
  })
  it('plan has 28 weeks: 10 + 6 + 12', () => {
    expect(PLAN_WEEKS).toHaveLength(28)
    expect(PLAN_WEEKS.filter((x) => x.phase === '5k')).toHaveLength(10)
  })
})
