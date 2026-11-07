import { createSyncStoragePersister } from '@tanstack/query-sync-storage-persister'
import { QueryClient } from '@tanstack/react-query'
import { PersistQueryClientProvider } from '@tanstack/react-query-persist-client'
import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import App from './App.tsx'
import './index.css'

const qc = new QueryClient({
  defaultOptions: {
    // offlineFirst: show the last data saved on the phone when there's no signal
    queries: { staleTime: 30_000, gcTime: 7 * 864e5, retry: 2, refetchOnWindowFocus: true, networkMode: 'offlineFirst' },
  },
})

// Keeps the last-loaded workout on the phone (localStorage) so it renders offline.
const persister = createSyncStoragePersister({
  storage: (() => {
    try {
      return window.localStorage
    } catch {
      return undefined
    }
  })(),
  key: 'doddy-workout-cache',
})

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <PersistQueryClientProvider client={qc} persistOptions={{ persister, maxAge: 7 * 864e5 }}>
      <App />
    </PersistQueryClientProvider>
  </StrictMode>,
)

if ('serviceWorker' in navigator && import.meta.env.PROD) {
  navigator.serviceWorker
    .register('/sw.js')
    .then((r) => navigator.serviceWorker.ready.then(() => r.active?.postMessage('precache-media')))
    .catch(() => {})
}
