import { CartesianGrid, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import { useProgress, useWeighIns } from './db'
import { PROFILES } from './nutrition'
import { MAIN_LIFTS, PEOPLE, PERSON_NAME, type Person } from './program'

const COLORS: Record<Person, string> = { kevin: '#6cb6ff', emily: '#ff8fb8' }

export function Progress() {
  const q = useProgress()
  if (q.isLoading) return <div className="p-6 text-dim">Loading…</div>
  if (q.isError) return <div className="p-4 text-danger">Couldn’t load progress.</div>
  const rows = q.data ?? []

  return (
    <div className="space-y-4">
      <div className="flex gap-4 text-sm font-semibold">
        {PEOPLE.map((p) => (
          <span key={p} className="flex items-center gap-2">
            <span className="h-1 w-5 rounded" style={{ background: COLORS[p] }} />
            {PERSON_NAME[p]}
          </span>
        ))}
      </div>
      <BodyWeight />
      {MAIN_LIFTS.map((lift) => {
        // top weight per (date, person)
        const byDate = new Map<string, Partial<Record<Person, number>>>()
        for (const r of rows) {
          if (!lift.keys[r.person].includes(r.key)) continue
          const entry = byDate.get(r.date) ?? {}
          entry[r.person] = Math.max(entry[r.person] ?? 0, r.weight)
          byDate.set(r.date, entry)
        }
        const data = [...byDate.entries()].sort(([a], [b]) => (a < b ? -1 : 1)).map(([date, v]) => ({ date: date.slice(5), ...v }))
        const latest = (p: Person) => [...data].reverse().find((d) => d[p] != null)?.[p]
        return (
          <section key={lift.label} className="rounded-2xl border border-line bg-panel p-4">
            <div className="flex items-baseline justify-between">
              <h3 className="text-lg font-bold">{lift.label}</h3>
              <div className="flex gap-3 text-sm font-bold tabular-nums">
                {PEOPLE.map((p) => (
                  <span key={p} style={{ color: COLORS[p] }}>
                    {latest(p) ?? '–'}
                  </span>
                ))}
              </div>
            </div>
            {data.length < 2 ? (
              <div className="py-6 text-center text-sm text-faint">
                {data.length === 0 ? 'No sessions yet' : 'One session so far. The chart starts after the next one.'}
              </div>
            ) : (
              <div className="mt-2 h-36">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={data} margin={{ top: 6, right: 6, bottom: 0, left: -24 }}>
                    <CartesianGrid stroke="#262b33" vertical={false} />
                    <XAxis dataKey="date" tick={{ fill: '#636c78', fontSize: 11 }} tickLine={false} axisLine={false} />
                    <YAxis tick={{ fill: '#636c78', fontSize: 11 }} tickLine={false} axisLine={false} domain={['dataMin - 10', 'dataMax + 10']} />
                    <Tooltip
                      contentStyle={{ background: '#1b1f26', border: '1px solid #262b33', borderRadius: 8 }}
                      labelStyle={{ color: '#9aa3ae' }}
                    />
                    {PEOPLE.map((p) => (
                      <Line key={p} type="monotone" dataKey={p} name={PERSON_NAME[p]} stroke={COLORS[p]} strokeWidth={2.5} dot={{ r: 3 }} connectNulls />
                    ))}
                  </LineChart>
                </ResponsiveContainer>
              </div>
            )}
          </section>
        )
      })}
      <p className="text-xs text-faint">Top working-set weight per session. Shoulder press is Kevin’s machine press vs Emily’s DB press (per DB).</p>
    </div>
  )
}

function BodyWeight() {
  const q = useWeighIns()
  const rows = q.data ?? []
  const byDate = new Map<string, Partial<Record<Person, number>>>()
  for (const r of rows) byDate.set(r.date, { ...byDate.get(r.date), [r.person]: r.weight })
  const data = [...byDate.entries()].sort(([a], [b]) => (a < b ? -1 : 1)).map(([date, v]) => ({ date: date.slice(5), ...v }))
  const latest = (p: Person) => rows.filter((r) => r.person === p).at(-1)?.weight
  return (
    <section className="rounded-2xl border border-line bg-panel p-4">
      <div className="flex items-baseline justify-between">
        <h3 className="text-lg font-bold">Body weight</h3>
        <div className="flex gap-3 text-sm font-bold tabular-nums">
          {PEOPLE.map((p) => (
            <span key={p} style={{ color: COLORS[p] }}>
              {latest(p) ?? '–'} → {PROFILES[p].goal.replace(' lb', '')}
            </span>
          ))}
        </div>
      </div>
      {data.length < 2 ? (
        <div className="py-6 text-center text-sm text-faint">Log weekly weigh-ins on your tab (Nutrition card) to see the trend.</div>
      ) : (
        <div className="mt-2 h-36">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={data} margin={{ top: 6, right: 6, bottom: 0, left: -24 }}>
              <CartesianGrid stroke="#262b33" vertical={false} />
              <XAxis dataKey="date" tick={{ fill: '#636c78', fontSize: 11 }} tickLine={false} axisLine={false} />
              <YAxis tick={{ fill: '#636c78', fontSize: 11 }} tickLine={false} axisLine={false} domain={['dataMin - 3', 'dataMax + 3']} />
              <Tooltip contentStyle={{ background: '#1b1f26', border: '1px solid #262b33', borderRadius: 8 }} labelStyle={{ color: '#9aa3ae' }} />
              {PEOPLE.map((p) => (
                <Line key={p} type="monotone" dataKey={p} name={PERSON_NAME[p]} stroke={COLORS[p]} strokeWidth={2.5} dot={{ r: 3 }} connectNulls />
              ))}
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}
    </section>
  )
}
