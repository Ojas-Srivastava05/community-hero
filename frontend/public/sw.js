const CACHE_NAME = 'community-hero-static-v2'

/** Only immutable static files — never cache index.html or hashed /assets/ bundles. */
const PRECACHE = ['/favicon.svg', '/icons.svg', '/manifest.webmanifest', '/manifest.json']

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches
      .open(CACHE_NAME)
      .then((cache) => cache.addAll(PRECACHE))
      .then(() => self.skipWaiting()),
  )
})

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) => Promise.all(keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k))))
      .then(() => self.clients.claim()),
  )
})

self.addEventListener('message', (event) => {
  if (event.data?.type === 'SKIP_WAITING') self.skipWaiting()
})

self.addEventListener('fetch', (event) => {
  const { request } = event
  if (request.method !== 'GET') return

  const url = new URL(request.url)
  if (url.origin !== self.location.origin) return

  // SPA navigations + HTML: network-first so deploys always pick up new chunk hashes.
  if (request.mode === 'navigate' || request.headers.get('accept')?.includes('text/html')) {
    event.respondWith(
      fetch(request)
        .then((response) => response)
        .catch(async () => {
          const cache = await caches.open(CACHE_NAME)
          return (await cache.match('/index.html')) || (await cache.match('/')) || Response.error()
        }),
    )
    return
  }

  // Vite hashed bundles: network-first (stale cache caused blank first load after deploy).
  if (url.pathname.startsWith('/assets/')) {
    event.respondWith(
      fetch(request).catch(() => caches.match(request).then((r) => r || Response.error())),
    )
    return
  }

  // Small static icons/manifest: stale-while-revalidate.
  if (PRECACHE.includes(url.pathname)) {
    event.respondWith(
      caches.match(request).then((cached) => {
        const network = fetch(request).then((response) => {
          if (response.ok) {
            caches.open(CACHE_NAME).then((cache) => cache.put(request, response.clone()))
          }
          return response
        })
        return cached || network
      }),
    )
  }
})
