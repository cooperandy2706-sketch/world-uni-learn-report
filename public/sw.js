// public/sw.js — WULA Reports Service Worker v2
const CACHE_NAME = 'wula-assets-v2'
const STATIC_ASSETS = [
  '/',
  '/index.html',
  '/manifest.json',
  '/icon-192.png',
  '/icon-512.png',
]

self.addEventListener('install', (e) => {
  console.log('[SW] Installing and pre-caching static assets...')
  e.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(STATIC_ASSETS).catch((err) => {
        console.warn('[SW] Pre-caching skipped/failed for some assets:', err)
      })
    })
  )
  self.skipWaiting()
})

self.addEventListener('activate', (e) => {
  console.log('[SW] Activating and cleaning old caches...')
  e.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys.map((key) => {
          if (key !== CACHE_NAME) {
            console.log('[SW] Deleting old cache:', key)
            return caches.delete(key)
          }
        })
      )
    }).then(() => self.clients.claim())
  )
})

// Fetch event — intercepting static assets for speed and reliability
self.addEventListener('fetch', (e) => {
  const url = new URL(e.request.url)

  // 1. Bypass non-GET requests and API calls to Supabase or Paystack
  if (
    e.request.method !== 'GET' ||
    url.hostname.includes('supabase.co') ||
    url.pathname.includes('/rest/v1/') ||
    url.hostname.includes('paystack')
  ) {
    return
  }

  // 2. Handle static assets (CSS, JS, Fonts, Images)
  const isStaticAsset =
    url.pathname.startsWith('/assets/') ||
    url.pathname.includes('/node_modules/') ||
    /\.(js|css|woff2|woff|ttf|eot|svg|png|jpg|jpeg|gif|ico|webp)$/i.test(url.pathname)

  if (isStaticAsset) {
    e.respondWith(
      caches.match(e.request).then((cachedResponse) => {
        if (cachedResponse) {
          // Cache-First: return from cache immediately
          return cachedResponse
        }

        // Fallback to network and cache the response for subsequent loads
        return fetch(e.request).then((networkResponse) => {
          if (networkResponse && networkResponse.status === 200) {
            const cacheCopy = networkResponse.clone()
            caches.open(CACHE_NAME).then((cache) => {
              cache.put(e.request, cacheCopy)
            })
          }
          return networkResponse
        }).catch((err) => {
          console.error('[SW] Fetch failed for static asset:', url.pathname, err)
          return new Response('Asset unavailable offline', { status: 503 })
        })
      })
    )
    return
  }

  // 3. Stale-While-Revalidate for the main shell index page
  if (
    e.request.mode === 'navigate' ||
    url.pathname === '/' ||
    url.pathname === '/index.html'
  ) {
    e.respondWith(
      caches.match('/index.html').then((cachedResponse) => {
        const networkFetch = fetch(e.request).then((networkResponse) => {
          if (networkResponse && networkResponse.status === 200) {
            const cacheCopy = networkResponse.clone()
            caches.open(CACHE_NAME).then((cache) => {
              cache.put('/index.html', cacheCopy)
            })
          }
          return networkResponse
        }).catch(() => {
          // If offline and cache exists, return it, otherwise let it fail
          if (cachedResponse) return cachedResponse
          throw new Error('Offline and no cached index.html available')
        })

        // Return cached page instantly if available, otherwise wait for network
        return cachedResponse || networkFetch
      })
    )
  }
})


// Push event — fires when server sends a notification
self.addEventListener('push', (e) => {
  const rawData = e.data?.text() || ''
  console.log('[SW] Push received raw:', rawData)

  let data = {
    title: 'WULA Reports',
    body: 'You have a new notification',
    url: '/',
    icon: '/icon-192.png'
  }

  try {
    if (rawData) {
      const parsed = JSON.parse(rawData)
      data = { ...data, ...parsed }
    }
  } catch (err) {
    console.warn('[SW] Push data was not JSON, using as body text:', rawData)
    data.body = rawData || data.body
  }

  console.log('[SW] Showing notification:', data.title)

  e.waitUntil(
    self.registration.showNotification(data.title, {
      body: data.body,
      icon: data.icon || '/icon-192.png',
      tag: 'wula-notification',
      renotify: true,
      requireInteraction: true, // This keeps it on screen until you click it
      data: { url: data.url || '/' },
    })
      .then(() => console.log('[SW] Notification shown successfully'))
      .catch(err => console.error('[SW] showNotification failed:', err))
  )
})

// Click on notification — opens the app
self.addEventListener('notificationclick', (e) => {
  console.log('[SW] Notification clicked')
  e.notification.close()

  const url = e.notification.data?.url || '/'

  e.waitUntil(
    self.clients
      .matchAll({ type: 'window', includeUncontrolled: true })
      .then((clients) => {
        // If app already open, focus it
        for (const client of clients) {
          if (client.url.includes(self.location.origin)) {
            client.focus()
            return
          }
        }
        // Otherwise open new window
        return self.clients.openWindow(self.location.origin + url)
      })
  )
})