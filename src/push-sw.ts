/// <reference lib="webworker" />

interface NotificationPayload {
  title?: string
  body?: string
  url?: string
}

const serviceWorker = self as unknown as ServiceWorkerGlobalScope

function notificationPayload(event: PushEvent): NotificationPayload {
  try {
    const value: unknown = event.data?.json()
    if (typeof value !== 'object' || value === null) return {}
    const record = value as Record<string, unknown>
    return {
      title: typeof record.title === 'string' ? record.title : undefined,
      body: typeof record.body === 'string' ? record.body : undefined,
      url: typeof record.url === 'string' ? record.url : undefined,
    }
  } catch {
    return {}
  }
}

serviceWorker.addEventListener('push', (event) => {
  const data = notificationPayload(event)
  event.waitUntil(
    Promise.all([
      serviceWorker.registration.showNotification(data.title || 'Flixer', {
        body: data.body || '',
        icon: '/pwa-192x192.png',
        badge: '/favicon-48.png',
        data: { url: data.url || '/' },
      }),
      serviceWorker.clients.matchAll({ type: 'window' }).then((windows) =>
        windows.forEach((client) => client.postMessage({ type: 'flixer-notification' })),
      ),
    ]),
  )
})

serviceWorker.addEventListener('notificationclick', (event) => {
  event.notification.close()
  const raw: unknown = event.notification.data?.url
  const path = typeof raw === 'string' && raw.startsWith('/') && !raw.startsWith('//') ? raw : '/'
  event.waitUntil(
    serviceWorker.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((windows) => {
      for (const client of windows) {
        if ('focus' in client) {
          client.postMessage({ type: 'flixer-navigate', path })
          return client.focus()
        }
      }
      return serviceWorker.clients.openWindow(path)
    }),
  )
})
