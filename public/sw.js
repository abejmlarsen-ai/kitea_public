const CACHE_NAME = 'kitea-v2'

const PRECACHE_URLS = ['/', '/manifest.json']

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(PRECACHE_URLS))
  )
  self.skipWaiting()
})

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys.filter((key) => key \!== CACHE_NAME).map((key) => caches.delete(key))
      )
    )
  )
  self.clients.claim()
})

self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url)

  // Never cache API routes, auth, or page navigation
  if (
    url.pathname.startsWith('/api/') ||
    url.pathname.startsWith('/auth/') ||
    event.request.mode === 'navigate'
  ) {
    event.respondWith(fetch(event.request))
    return
  }

  // Cache first for static assets only (images, fonts, icons)
  if (
    url.pathname.startsWith('/icons/') ||
    url.pathname.startsWith('/images/') ||
    url.pathname.match(/\.(png|jpg|jpeg|svg|woff2|ico)$/)
  ) {
    event.respondWith(
      caches.match(event.request).then((cached) => {
        return cached || fetch(event.request).then((response) => {
          const clone = response.clone()
          caches.open('kitea-v2').then((cache) => cache.put(event.request, clone))
          return response
        })
      })
    )
    return
  }

  // Everything else — network only, no caching
  event.respondWith(fetch(event.request))
})
