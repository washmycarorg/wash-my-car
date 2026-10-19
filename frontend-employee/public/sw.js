// Service Worker for Browser Web Push Notifications - Wash My Car Employee App
self.addEventListener('install', function(event) {
  self.skipWaiting();
});

self.addEventListener('activate', function(event) {
  event.waitUntil(self.clients.claim());
});

self.addEventListener('push', function(event) {
  let data = {
    title: 'Wash My Car - Technician',
    body: 'New job update assigned to you!',
    icon: '/logo.png',
    badge: '/favicon.ico',
    url: '/schedule'
  };

  if (event.data) {
    try {
      data = event.data.json();
    } catch (e) {
      data.body = event.data.text();
    }
  }

  const options = {
    body: data.body || '',
    icon: data.icon || '/logo.png',
    badge: data.badge || '/favicon.ico',
    data: {
      url: data.url || '/schedule'
    },
    vibrate: [200, 100, 200],
    tag: data.tag || 'employee-job-assignment',
    renotify: true
  };

  event.waitUntil(
    self.registration.showNotification(data.title || 'Wash My Car - Technician', options)
  );
});

self.addEventListener('notificationclick', function(event) {
  event.notification.close();
  const targetUrl = event.notification.data?.url || '/schedule';

  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then(function(clientList) {
      for (let i = 0; i < clientList.length; i++) {
        const client = clientList[i];
        if ('focus' in client) {
          client.navigate(targetUrl);
          return client.focus();
        }
      }
      if (clients.openWindow) {
        return clients.openWindow(targetUrl);
      }
    })
  );
});
