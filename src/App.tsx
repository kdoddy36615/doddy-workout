import { lazy, Suspense, useState } from 'react'
import { configured } from './db'
import { PersonView } from './PersonView'
import { PERSON_NAME, type Person } from './program'
import { RestTimer } from './ui'

const Progress = lazy(() => import('./Progress').then((m) => ({ default: m.Progress })))

type Tab = Person | 'progress'
const TABS: { id: Tab; label: string; active: string }[] = [
  { id: 'kevin', label: PERSON_NAME.kevin, active: 'bg-kevin text-bg' },
  { id: 'emily', label: PERSON_NAME.emily, active: 'bg-emily text-bg' },
  { id: 'progress', label: 'Progress', active: 'bg-ink text-bg' },
]

function initialTab(): Tab {
  try {
    const t = localStorage.getItem('tab')
    if (t === 'kevin' || t === 'emily' || t === 'progress') return t
  } catch {
    /* storage blocked */
  }
  return 'kevin'
}

export default function App() {
  const [tab, setTabState] = useState<Tab>(initialTab)
  const setTab = (t: Tab) => {
    setTabState(t)
    try {
      localStorage.setItem('tab', t)
    } catch {
      /* ignore */
    }
    window.scrollTo({ top: 0 })
  }

  return (
    <div className="mx-auto min-h-dvh max-w-xl pb-[calc(env(safe-area-inset-bottom)+2rem)]">
      <header className="sticky top-0 z-10 border-b border-line bg-bg/95 px-4 pt-[calc(env(safe-area-inset-top)+0.75rem)] pb-3 backdrop-blur">
        <div className="flex items-center gap-2">
          <nav className="flex flex-1 gap-1 rounded-xl bg-panel p-1" aria-label="Sections">
            {TABS.map((t) => (
              <button
                key={t.id}
                type="button"
                aria-current={tab === t.id ? 'page' : undefined}
                onClick={() => setTab(t.id)}
                className={'h-11 flex-1 rounded-lg text-sm font-bold ' + (tab === t.id ? t.active : 'text-dim')}
              >
                {t.label}
              </button>
            ))}
          </nav>
          <RestTimer />
        </div>
      </header>
      <main className="px-4 pt-4">
        {!configured ? (
          <div className="rounded-xl bg-danger-bg p-4 text-sm text-danger">
            Missing VITE_SUPABASE_URL / VITE_SUPABASE_KEY.
          </div>
        ) : tab === 'progress' ? (
          <Suspense fallback={<div className="p-6 text-dim">Loading…</div>}>
            <Progress />
          </Suspense>
        ) : (
          <PersonView key={tab} person={tab} />
        )}
      </main>
    </div>
  )
}
