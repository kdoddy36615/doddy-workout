import { createClient } from '@supabase/supabase-js'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { evaluate, localDate, staleActive } from './logic'
import {
  EXERCISES,
  incrementFor,
  schemeFor,
  slotsFor,
  stateKey,
  type CardioKind,
  type DayId,
  type Person,
} from './program'

const url = import.meta.env.VITE_SUPABASE_URL as string | undefined
const key = import.meta.env.VITE_SUPABASE_KEY as string | undefined
export const configured = Boolean(url && key)
export const supabase = createClient(url ?? 'http://localhost', key ?? 'missing', {
  auth: { persistSession: false },
})

export type ExerciseState = {
  person: Person
  key: string
  weight: number
  fails: number
  suggested: number | null
  step: number | null
  setup_note: string | null
}
export type Session = {
  id: string
  person: Person
  day_id: DayId
  date: string
  status: 'active' | 'finished' | 'partial'
  started_at: string
  finished_at: string | null
}
export type SetLog = {
  id?: string
  session_id: string
  key: string
  set_index: number
  weight: number
  reps: number
  done: boolean
}

async function must<T = unknown>(p: PromiseLike<{ data: unknown; error: unknown }>): Promise<T> {
  const { data, error } = await p
  if (error) throw error
  return data as T
}

// ---------------------------------------------------------------------------
// Queries
// ---------------------------------------------------------------------------

export function useStates(person: Person) {
  return useQuery({
    queryKey: ['state', person],
    queryFn: async () => {
      const rows = await must<ExerciseState[]>(supabase.from('exercise_state').select('*').eq('person', person))
      return Object.fromEntries(rows.map((r) => [r.key, { ...r, weight: Number(r.weight), suggested: r.suggested == null ? null : Number(r.suggested) }])) as Record<
        string,
        ExerciseState
      >
    },
  })
}

export function useChoices(person: Person) {
  return useQuery({
    queryKey: ['choice', person],
    queryFn: async () => {
      const rows = await must<{ slot_key: string; variant: string }[]>(
        supabase.from('slot_choice').select('slot_key, variant').eq('person', person),
      )
      return Object.fromEntries(rows.map((r) => [r.slot_key, r.variant])) as Record<string, string>
    },
  })
}

export function useHealing() {
  return useQuery({
    queryKey: ['settings'],
    queryFn: async () => {
      const rows = await must<{ person: Person; healing_mode: boolean }[]>(supabase.from('person_settings').select('*'))
      return Object.fromEntries(rows.map((r) => [r.person, r.healing_mode])) as Partial<Record<Person, boolean>>
    },
  })
}

/** All sessions for a person in the last ~60 days. Closes yesterday's unfinished ones as partial. */
export function useSessions(person: Person) {
  return useQuery({
    queryKey: ['sessions', person],
    queryFn: async () => {
      const since = localDate(new Date(Date.now() - 60 * 864e5))
      const rows = await must<Session[]>(
        supabase.from('sessions').select('*').eq('person', person).gte('date', since).order('started_at'),
      )
      const stale = staleActive(rows, localDate())
      if (stale.length) {
        await must(supabase.from('sessions').update({ status: 'partial' }).in('id', stale.map((s) => s.id)))
        stale.forEach((s) => (s.status = 'partial'))
      }
      return rows
    },
  })
}

export function useSetLogs(sessionId: string | undefined) {
  return useQuery({
    queryKey: ['sets', sessionId],
    enabled: Boolean(sessionId),
    queryFn: () => must<SetLog[]>(supabase.from('set_logs').select('*').eq('session_id', sessionId!)),
  })
}

export function useCardio(person: Person) {
  return useQuery({
    queryKey: ['cardio', person],
    queryFn: () =>
      must<{ id: string; date: string; kind: CardioKind; minutes: number | null; session_id: string | null }[]>(
        supabase.from('cardio_logs').select('*').eq('person', person).order('created_at', { ascending: false }).limit(30),
      ),
  })
}

/** Progress: top done-set weight per main-lift key per date, both people. */
export function useProgress() {
  return useQuery({
    queryKey: ['progress'],
    queryFn: async () => {
      const rows = await must<{ key: string; weight: number; done: boolean; sessions: { person: Person; date: string } }[]>(
        supabase.from('set_logs').select('key, weight, done, sessions!inner(person, date)').eq('done', true).like('key', '%:main'),
      )
      return rows.map((r) => ({ key: r.key, weight: Number(r.weight), person: r.sessions.person, date: r.sessions.date }))
    },
  })
}

// ---------------------------------------------------------------------------
// Mutations
// ---------------------------------------------------------------------------

export function useSaveState(person: Person) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (row: Omit<ExerciseState, 'person'>) => {
      await must(supabase.from('exercise_state').upsert({ ...row, person, updated_at: new Date().toISOString() }))
    },
    onMutate: (row) => {
      qc.setQueryData<Record<string, ExerciseState>>(['state', person], (old) => ({ ...old, [row.key]: { ...row, person } }))
    },
    onError: () => qc.invalidateQueries({ queryKey: ['state', person] }),
  })
}

export function useSetChoice(person: Person) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (v: { slot_key: string; variant: string }) => {
      await must(supabase.from('slot_choice').upsert({ ...v, person }))
    },
    onMutate: (v) => {
      qc.setQueryData<Record<string, string>>(['choice', person], (old) => ({ ...old, [v.slot_key]: v.variant }))
    },
    onError: () => qc.invalidateQueries({ queryKey: ['choice', person] }),
  })
}

export function useSetHealing() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (v: { person: Person; on: boolean }) => {
      await must(supabase.from('person_settings').upsert({ person: v.person, healing_mode: v.on }))
    },
    onMutate: (v) => qc.setQueryData<Partial<Record<Person, boolean>>>(['settings'], (old) => ({ ...old, [v.person]: v.on })),
    onError: () => qc.invalidateQueries({ queryKey: ['settings'] }),
  })
}

export async function startSession(person: Person, dayId: DayId): Promise<Session> {
  const rows = await must<Session[]>(
    supabase.from('sessions').insert({ person, day_id: dayId, date: localDate() }).select(),
  )
  return rows[0]
}

export function useLogSet() {
  const qc = useQueryClient()
  return useMutation({
    mutationKey: ['logSet'],
    mutationFn: async (s: SetLog) => {
      await must(supabase.from('set_logs').upsert(s, { onConflict: 'session_id,key,set_index' }))
    },
    onMutate: async (s) => {
      // a slower in-flight fetch must not overwrite taps that already happened
      await qc.cancelQueries({ queryKey: ['sets', s.session_id] })
      qc.setQueryData<SetLog[]>(['sets', s.session_id], (old = []) => [
        ...old.filter((o) => !(o.key === s.key && o.set_index === s.set_index)),
        s,
      ])
    },
    onError: (_e, s) => qc.invalidateQueries({ queryKey: ['sets', s.session_id] }),
  })
}

export function useLogCardio(person: Person) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (v: { kind: CardioKind; minutes: number | null; session_id: string | null }) => {
      await must(supabase.from('cardio_logs').insert({ ...v, person, date: localDate() }))
    },
    onSettled: () => qc.invalidateQueries({ queryKey: ['cardio', person] }),
  })
}

/**
 * Finish: evaluate every exercise that has logged sets, store suggestions + fail counts,
 * mark the session finished (this is the only thing that advances the rotation).
 */
export function useFinish(person: Person) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (v: {
      session: Session
      states: Record<string, ExerciseState>
      choices: Record<string, string>
    }) => {
      // wait for queued set saves, then evaluate what's actually in the DB
      while (qc.isMutating({ mutationKey: ['logSet'] }) > 0) await new Promise((r) => setTimeout(r, 100))
      const sets = await must<SetLog[]>(supabase.from('set_logs').select('*').eq('session_id', v.session.id))
      const updates: ExerciseState[] = []
      for (const { slot, cfg } of slotsFor(person, v.session.day_id)) {
        const variant = v.choices[slot.id] ?? cfg.variants[0]
        const k = stateKey(variant, slot.main)
        const logged = sets.filter((s) => s.key === k)
        if (!logged.length) continue
        const st = v.states[k] ?? stateDefaults(k, cfg.start[variant] ?? 0)
        const ev = evaluate({
          scheme: schemeFor(slot, cfg, variant),
          sets: logged,
          weight: st.weight,
          increment: st.step ?? incrementFor(cfg, variant),
          load: EXERCISES[variant].load,
          main: Boolean(slot.main),
          fails: st.fails,
        })
        if (ev.outcome === 'skipped') continue
        updates.push({ ...st, person, fails: ev.fails, suggested: ev.suggested ?? (ev.outcome === 'up' || ev.outcome === 'deload' ? null : st.suggested) })
      }
      if (updates.length) {
        await must(supabase.from('exercise_state').upsert(updates.map((u) => ({ ...u, updated_at: new Date().toISOString() }))))
      }
      await must(
        supabase.from('sessions').update({ status: 'finished', finished_at: new Date().toISOString() }).eq('id', v.session.id),
      )
    },
    onSettled: () => {
      qc.invalidateQueries({ queryKey: ['sessions', person] })
      qc.invalidateQueries({ queryKey: ['state', person] })
      qc.invalidateQueries({ queryKey: ['progress'] })
    },
  })
}

export function stateDefaults(k: string, weight: number): Omit<ExerciseState, 'person'> {
  return { key: k, weight, fails: 0, suggested: null, step: null, setup_note: null }
}
