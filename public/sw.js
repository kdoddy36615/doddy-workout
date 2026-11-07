// Offline cache for the app shell + form clips. Logging still needs signal.
const VERSION = 'v1'
const SHELL = `shell-${VERSION}`
const MEDIA = 'media-v1'

self.addEventListener('install', (e) => {
  e.waitUntil(caches.open(SHELL).then((c) => c.addAll(['/', '/manifest.webmanifest'])).then(() => self.skipWaiting()))
})

// Download every form clip once so they play with no signal.
async function precacheMedia() {
  try {
    const list = await (await fetch('/media-list.json', { cache: 'no-store' })).json()
    const cache = await caches.open(MEDIA)
    for (const url of list) {
      if (!(await cache.match(url))) {
        const res = await fetch(url)
        if (res.ok) await cache.put(url, res)
      }
    }
  } catch {
    /* offline or list missing: clips cache on first play instead */
  }
}

self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches
      .keys()
      .then((keys) => Promise.all(keys.filter((k) => k !== SHELL && k !== MEDIA).map((k) => caches.delete(k))))
      .then(() => self.clients.claim()),
  )
  precacheMedia()
})

self.addEventListener('message', (e) => {
  if (e.data === 'precache-media') e.waitUntil(precacheMedia())
})

// Safari requests video with Range headers; answer with a 206 slice of the cached file.
async function mediaResponse(req) {
  const cache = await caches.open(MEDIA)
  const url = new URL(req.url).pathname
  let full = await cache.match(url)
  if (!full) {
    const net = await fetch(url)
    if (!net.ok) return net
    await cache.put(url, net.clone())
    full = net
  }
  const range = req.headers.get('range')
  if (!range) return full
  const buf = await full.arrayBuffer()
  const m = /bytes=(\d*)-(\d*)/.exec(range)
  const size = buf.byteLength
  let start = m && m[1] ? parseInt(m[1], 10) : 0
  let end = m && m[2] ? parseInt(m[2], 10) : size - 1
  if (!m || !m[1]) { if (m && m[2]) { start = size - parseInt(m[2], 10); end = size - 1 } }
  end = Math.min(end, size - 1)
  return new Response(buf.slice(start, end + 1), {
    status: 206,
    headers: {
      'Content-Type': full.headers.get('Content-Type') || 'video/mp4',
      'Content-Range': `bytes ${start}-${end}/${size}`,
      'Content-Length': String(end - start + 1),
      'Accept-Ranges': 'bytes',
    },
  })
}

self.addEventListener('fetch', (e) => {
  const req = e.request
  if (req.method !== 'GET') return
  const url = new URL(req.url)
  if (url.origin !== location.origin) return // Supabase etc. always go to the network

  if (url.pathname.startsWith('/media/')) {
    e.respondWith(mediaResponse(req))
    return
  }
  if (req.mode === 'navigate') {
    // network first so deploys show up; cached shell when there's no signal
    e.respondWith(
      fetch(req)
        .then((res) => {
          const copy = res.clone()
          caches.open(SHELL).then((c) => c.put('/', copy))
          return res
        })
        .catch(() => caches.match('/')),
    )
    return
  }
  if (url.pathname.startsWith('/assets/') || url.pathname.startsWith('/icons/')) {
    // hashed build files never change: cache first
    e.respondWith(
      caches.match(req).then(
        (hit) =>
          hit ||
          fetch(req).then((res) => {
            const copy = res.clone()
            caches.open(SHELL).then((c) => c.put(req, copy))
            return res
          }),
      ),
    )
  }
})
