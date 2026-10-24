// Imported by the generated service worker (see workbox.importScripts in vite.config.ts).
self.addEventListener('push', (event) => {
  let data = {}
  try {
    data = event.data ? event.data.json() : {}
  } catch {
    data = {}
  }
  event.waitUntil(
    Promise.all([
      self.registration.showNotification(data.title || 'Flixer', {
        body: data.body || '',
        icon: '/pwa-192x192.png',
        badge: '/favicon-48.png',
        data: { url: typeof data.url === 'string' ? data.url : '/' },
      }),
      self.clients.matchAll({ type: 'window' }).then((windows) => windows.forEach((client) => client.postMessage({ type: 'flixer-notification' }))),
    ]),
  )
})

self.addEventListener('notificationclick', (event) => {
  event.notification.close()
  const raw = event.notification.data && event.notification.data.url
  // Only paths inside the app are opened.
  const path = typeof raw === 'string' && raw.startsWith('/') && !raw.startsWith('//') ? raw : '/'
  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((windows) => {
      for (const client of windows) {
        if ('focus' in client) {
          client.postMessage({ type: 'flixer-navigate', path })
          return client.focus()
        }
      }
      return self.clients.openWindow(path)
    }),
  )
})
