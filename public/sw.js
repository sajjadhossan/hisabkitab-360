/**
 * HisabKitab 360 - Service Worker
 * --------------------------------
 * Enterprise Offline Caching & Background Sync
 */

const CACHE_NAME = 'hisabkitab-360-v2';
const STATIC_ASSETS = [
  './',
  './index.html',
  './manifest.json',
  './favicon.ico'
];

// 1. Install & Cache App Shell
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(STATIC_ASSETS).catch((err) => {
        console.warn('[SW] Caching assets warning:', err);
      });
    }).then(() => self.skipWaiting())
  );
});

// 2. Activate & Purge Stale Caches
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys.map((key) => {
          if (key !== CACHE_NAME) {
            return caches.delete(key);
          }
        })
      );
    }).then(() => self.clients.claim())
  );
});

// 3. Stale-While-Revalidate & Cache Strategy
self.addEventListener('fetch', (event) => {
  const request = event.request;

  // Don't intercept Supabase REST/GraphQL or non-GET requests
  if (request.method !== 'GET' || request.url.includes('/rest/v1/') || request.url.includes('/auth/v1/')) {
    return;
  }

  event.respondWith(
    caches.match(request).then((cachedResponse) => {
      const fetchPromise = fetch(request).then((networkResponse) => {
        if (networkResponse && networkResponse.status === 200) {
          const responseToCache = networkResponse.clone();
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(request, responseToCache);
          });
        }
        return networkResponse;
      }).catch(() => {
        // Fallback to cache if network fails
        return cachedResponse;
      });

      return cachedResponse || fetchPromise;
    })
  );
});

// 4. Background Sync API
self.addEventListener('sync', (event) => {
  if (event.tag === 'sync-offline-queue') {
    event.waitUntil(
      self.clients.matchAll().then((clients) => {
        clients.forEach((client) => {
          client.postMessage({
            type: 'TRIGGER_BACKGROUND_SYNC',
            timestamp: Date.now()
          });
        });
      })
    );
  }
});

// 5. Push Notifications
self.addEventListener('push', (event) => {
  let data = { title: 'হিসাবকিতাব ৩৬০', body: 'নতুন বার্তা বা নোটিফিকেশন এসেছে।' };
  try {
    if (event.data) {
      data = event.data.json();
    }
  } catch {
    if (event.data) data.body = event.data.text();
  }

  const options = {
    body: data.body,
    icon: '/favicon.ico',
    badge: '/favicon.ico',
    vibrate: [100, 50, 100],
    data: data.url || '/'
  };

  event.waitUntil(
    self.registration.showNotification(data.title || 'হিসাবকিতাব ৩৬০', options)
  );
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
      for (const client of clientList) {
        if (client.url === '/' && 'focus' in client) {
          return client.focus();
        }
      }
      if (self.clients.openWindow) {
        return self.clients.openWindow(event.notification.data || '/');
      }
    })
  );
});
