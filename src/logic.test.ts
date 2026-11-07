import { describe, expect, it } from 'vitest'
import { evaluate, isSunday, lastDates, localDate, nextDay, staleActive, type SessionLite } from './logic'
import { DAYS, EXERCISES, PEOPLE, ROTATION } from './program'

const five = { sets: 5, reps: [5, 5] as [number, number], amrapLast: true }
const range = { sets: 3, reps: [8, 12] as [number, number] }
const sets = (...reps: number[]) => reps.map((r) => ({ reps: r, done: true }))
const base = { weight: 100, increment: 5, load: 'barbell' as const, main: true, fails: 0 }

describe('evaluate: fixed reps', () => {
  it('suggests +increment when every set hits target (AMRAP extra reps fine)', () => {
    expect(evaluate({ ...base, scheme: five, sets: sets(5, 5, 5, 5, 8) })).toEqual({ suggested: 105, fails: 0, outcome: 'up' })
  })
  it('counts a fail when a set is short', () => {
    expect(evaluate({ ...base, scheme: five, sets: sets(5, 5, 5, 4, 3) })).toEqual({ suggested: null, fails: 1, outcome: 'fail' })
  })
  it('counts a fail when sets are missing', () => {
    expect(evaluate({ ...base, scheme: five, sets: sets(5, 5, 5) }).outcome).toBe('fail')
  })
  it('deloads 10% (rounded down to the increment) on the 3rd fail in a row, then resets', () => {
    expect(evaluate({ ...base, fails: 2, scheme: five, sets: sets(5, 4, 4, 4, 4) })).toEqual({ suggested: 90, fails: 0, outcome: 'deload' })
  })
  it('rounds deloads to 2.5 lb jumps', () => {
    expect(evaluate({ ...base, weight: 55, increment: 2.5, fails: 2, scheme: five, sets: sets(3) }).suggested).toBe(47.5)
  })
  it('never deloads a barbell below the empty bar', () => {
    expect(evaluate({ ...base, weight: 45, fails: 2, scheme: five, sets: sets(3) })).toEqual({ suggested: null, fails: 0, outcome: 'deload' })
  })
  it('accessories never deload, they just keep counting', () => {
    expect(evaluate({ ...base, main: false, fails: 5, scheme: { sets: 3, reps: [10, 10] }, sets: sets(8, 8, 8) }).outcome).toBe('fail')
  })
  it('skips when nothing was done', () => {
    expect(evaluate({ ...base, fails: 1, scheme: five, sets: [{ reps: 5, done: false }] })).toEqual({ suggested: null, fails: 1, outcome: 'skipped' })
  })
})

describe('evaluate: rep ranges', () => {
  it('goes up only when every set hits the top', () => {
    expect(evaluate({ ...base, main: false, scheme: range, sets: sets(12, 12, 12) }).suggested).toBe(105)
    expect(evaluate({ ...base, main: false, scheme: range, sets: sets(12, 12, 11) }).outcome).toBe('hold')
  })
  it('inside the range is a hold and clears fails', () => {
    expect(evaluate({ ...base, main: true, fails: 2, scheme: range, sets: sets(9, 8, 8) })).toEqual({ suggested: null, fails: 0, outcome: 'hold' })
  })
  it('below the bottom of the range is a fail', () => {
    expect(evaluate({ ...base, main: false, scheme: range, sets: sets(9, 8, 6) }).outcome).toBe('fail')
  })
  it('bodyweight work never suggests weight', () => {
    expect(evaluate({ ...base, increment: 0, scheme: range, sets: sets(12, 12, 12) }).suggested).toBeNull()
  })
})

const s = (day_id: SessionLite['day_id'], status: SessionLite['status'], finished_at: string | null, date = '2026-11-01'): SessionLite => ({
  day_id,
  status,
  finished_at,
  date,
})

describe('rotation', () => {
  it('starts at Push A', () => expect(nextDay([])).toBe('pushA'))
  it('follows the last finished session', () => {
    expect(nextDay([s('pushA', 'finished', '2026-11-01T10:00'), s('pullA', 'finished', '2026-11-02T10:00')])).toBe('legs1')
  })
  it('wraps from the second leg day to Push A', () => expect(nextDay([s('legs2', 'finished', 'x')])).toBe('pushA'))
  it('ignores partial and active sessions', () => {
    expect(nextDay([s('pushA', 'finished', '2026-11-01T10:00'), s('pullA', 'partial', null), s('legs1', 'active', null)])).toBe('pullA')
  })
  it('finds stale active sessions from earlier local dates only', () => {
    const list = [s('pushA', 'active', null, '2026-11-01'), s('pullA', 'active', null, '2026-11-02')]
    expect(staleActive(list, '2026-11-02').map((x) => x.day_id)).toEqual(['pushA'])
  })
})

describe('dates', () => {
  it('formats local dates, not UTC', () => {
    expect(localDate(new Date(2026, 10, 7, 23, 30))).toBe('2026-11-07')
  })
  it('detects Sunday', () => {
    expect(isSunday('2026-11-08')).toBe(true)
    expect(isSunday('2026-11-07')).toBe(false)
  })
  it('lists the last 14 days oldest first', () => {
    const d = lastDates(14, new Date(2026, 10, 7))
    expect(d).toHaveLength(14)
    expect(d[0]).toBe('2026-10-25')
    expect(d[13]).toBe('2026-11-07')
  })
})

describe('program config', () => {
  it('every referenced exercise exists and has a start weight unless bodyweight', () => {
    for (const id of ROTATION) {
      for (const slot of DAYS[id].slots) {
        for (const p of PEOPLE) {
          const cfg = slot[p]
          if (!cfg) continue
          for (const v of cfg.variants) {
            expect(EXERCISES[v], `${id}/${slot.id}/${p}/${v}`).toBeDefined()
            if (EXERCISES[v].load !== 'bodyweight') expect(cfg.start[v], `${id}/${slot.id}/${p}/${v} start`).toBeTypeOf('number')
          }
        }
      }
    }
  })
})
