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
  console.log('[SW] Push received:', e.data?.text())
  
  let data = { title: 'WULA Reports', body: 'You have a new notification', url: '/', icon: '/icon-192.png' }
  
  try {
    if (e.data) data = { ...data, ...e.data.json() }
  } catch (err) {
    data.body = e.data?.text() || data.body
  }

  e.waitUntil(
    self.registration.showNotification(data.title, {
      body: data.body,
      icon: data.icon || '/icon-192.png',
      badge: '/icon-192.png',
      vibrate: [200, 100, 200, 100, 200],
      tag: 'wula-notification',
      renotify: true,
      data: { url: data.url || '/' },
    })
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