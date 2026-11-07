import { useEffect, useRef, useState, useSyncExternalStore, type ReactNode } from 'react'
import { formatWeight } from './logic'

export function Stepper(props: {
  value: number
  step: number
  min?: number
  onChange: (v: number) => void
  unit?: string
  big?: boolean
  disabled?: boolean
}) {
  const { value, step, min = 0, onChange, unit, big, disabled } = props
  const btn =
    'grid place-items-center rounded-xl bg-panel-2 text-2xl font-semibold text-ink active:bg-line select-none disabled:opacity-40 ' +
    (big ? 'size-14' : 'size-12')
  return (
    <div className="flex items-center gap-2">
      <button type="button" disabled={disabled} aria-label="Decrease" className={btn} onClick={() => onChange(Math.max(min, +(value - step).toFixed(2)))}>
        −
      </button>
      <div className={'min-w-[4.5ch] text-center font-bold tabular-nums ' + (big ? 'text-4xl' : 'text-2xl')}>
        {formatWeight(value)}
        {unit && <span className="ml-1 text-sm font-medium text-dim">{unit}</span>}
      </div>
      <button type="button" disabled={disabled} aria-label="Increase" className={btn} onClick={() => onChange(+(value + step).toFixed(2))}>
        +
      </button>
    </div>
  )
}

export function Disclosure(props: { label: ReactNode; children: ReactNode; defaultOpen?: boolean; className?: string }) {
  const [open, setOpen] = useState(props.defaultOpen ?? false)
  return (
    <div className={props.className}>
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="flex w-full items-center justify-between gap-3 py-3 text-left text-sm font-semibold text-dim"
        aria-expanded={open}
      >
        <span>{props.label}</span>
        <span className={'text-faint transition-transform ' + (open ? 'rotate-180' : '')}>▾</span>
      </button>
      {open && <div className="pb-3">{props.children}</div>}
    </div>
  )
}

export function Warning({ children, tone = 'warn' }: { children: ReactNode; tone?: 'warn' | 'danger' }) {
  const cls = tone === 'warn' ? 'bg-warn-bg text-warn border-warn/30' : 'bg-danger-bg text-danger border-danger/30'
  return (
    <div className={'flex gap-2 rounded-lg border px-3 py-2 text-sm leading-snug ' + cls}>
      <span aria-hidden>⚠</span>
      <span className="text-ink/90">{children}</span>
    </div>
  )
}

/** Looping muted clip that only loads/plays while mounted (i.e. when the Form dropdown is open). */
export function Media({ src, alt }: { src: string; alt: string }) {
  const ref = useRef<HTMLVideoElement>(null)
  useEffect(() => {
    ref.current?.play().catch(() => {})
  }, [])
  if (!src.endsWith('.mp4')) return <img src={src} alt={alt} className="mx-auto max-h-[60vh] rounded-lg" />
  return (
    <video
      ref={ref}
      src={src}
      autoPlay
      muted
      loop
      playsInline
      preload="auto"
      className="mx-auto max-h-[60vh] rounded-lg bg-black"
      aria-label={alt}
    />
  )
}

// ---------------------------------------------------------------------------
// Rest timer. All the "when does it start" rules live here so they're easy to change.
//   - Checking off a set (✓) calls restartRest(): starts it, or resets to 0:00 if running.
//   - The clock button toggles it manually.
// ---------------------------------------------------------------------------
let restStart: number | null = null
const listeners = new Set<() => void>()
const setRest = (v: number | null) => {
  restStart = v
  listeners.forEach((l) => l())
}
export const restartRest = () => setRest(Date.now())
const toggleRest = () => setRest(restStart == null ? Date.now() : null)
const subscribe = (l: () => void) => {
  listeners.add(l)
  return () => listeners.delete(l)
}

/** Small count-up clock in the header. */
export function RestTimer() {
  const start = useSyncExternalStore(subscribe, () => restStart)
  const [now, setNow] = useState(() => Date.now())
  useEffect(() => {
    if (start == null) return
    // no immediate setNow: a stale `now` is before the new start, so it clamps to 0:00
    const id = setInterval(() => setNow(Date.now()), 250)
    return () => clearInterval(id)
  }, [start])
  const secs = start == null ? 0 : Math.max(0, Math.floor((now - start) / 1000))
  const mm = Math.floor(secs / 60)
  const ss = String(secs % 60).padStart(2, '0')
  const running = start != null
  return (
    <button
      type="button"
      onClick={toggleRest}
      className={
        'flex h-10 items-center gap-1.5 rounded-full px-3 text-sm font-semibold tabular-nums ' +
        (running ? 'bg-accent text-accent-ink' : 'bg-panel-2 text-dim')
      }
      aria-label={running ? 'Stop rest timer' : 'Start rest timer'}
    >
      <svg viewBox="0 0 24 24" className="size-4" fill="none" stroke="currentColor" strokeWidth="2.2" aria-hidden>
        <circle cx="12" cy="13" r="8" />
        <path d="M12 9v4l2.5 2M9 2h6" strokeLinecap="round" />
      </svg>
      {running ? `${mm}:${ss}` : 'Rest'}
    </button>
  )
}
