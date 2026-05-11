/* eslint-disable no-undef */
self.addEventListener('push', (event) => {
  let payload = {
    title: 'Suporte Imagem CRM',
    body: 'Nova notificação',
    url: '/whatsapp',
    tag: 'crm-push',
  };
  try {
    if (event.data) {
      const parsed = event.data.json();
      payload = { ...payload, ...parsed };
    }
  } catch (_) {
    try {
      const t = event.data?.text();
      if (t) payload = { ...payload, body: t };
    } catch (_) {}
  }

  const title = payload.title || 'Suporte Imagem CRM';
  const fullUrl = new URL(payload.url || '/whatsapp', self.location.origin).href;

  event.waitUntil(
    self.registration.showNotification(title, {
      body: payload.body || '',
      icon: '/icon.png',
      badge: '/icon.png',
      tag: payload.tag || 'crm-push',
      renotify: true,
      data: { url: fullUrl },
    }),
  );
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const urlToOpen =
    event.notification?.data?.url ||
    new URL('/whatsapp', self.location.origin).href;

  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
      for (const client of clientList) {
        if (client.url.startsWith(self.location.origin) && 'focus' in client) {
          if ('navigate' in client && typeof client.navigate === 'function') {
            return client.navigate(urlToOpen).then(() => client.focus());
          }
          return client.focus();
        }
      }
      if (self.clients.openWindow) {
        return self.clients.openWindow(urlToOpen);
      }
    }),
  );
});
