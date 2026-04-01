// public/sw.js — WULA Reports Service Worker v1
const CACHE_NAME = 'wula-v1'

self.addEventListener('install', (e) => {
  console.log('[SW] Installing...')
  self.skipWaiting()
})

self.addEventListener('activate', (e) => {
  console.log('[SW] Activating...')
  e.waitUntil(self.clients.claim())
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