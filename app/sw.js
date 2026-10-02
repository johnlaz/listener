// Listener Pro AI — Service Worker (PWABuilder Workbox base, validated)
// Strategy: StaleWhileRevalidate for app shell, network-first for APIs

const CACHE = "listener-pro-v5";
const CACHE_PREFIX = "listener-pro-"; // only ever touch our own caches (origin is shared with other LAZLAB apps)

importScripts('https://storage.googleapis.com/workbox-cdn/releases/5.1.2/workbox-sw.js');

const offlineFallbackPage = "index.html";

// ── MESSAGE: force update ─────────────────────────────────────────────────────
self.addEventListener("message", (event) => {
  if (event.data && event.data.type === "SKIP_WAITING") {
    self.skipWaiting();
  }
  // Also support plain string used by our app code
  if (event.data === 'skipWaiting') {
    self.skipWaiting();
  }
});

// ── INSTALL: cache offline fallback ──────────────────────────────────────────
self.addEventListener('install', async (event) => {
  event.waitUntil(
    caches.open(CACHE).then((cache) => cache.add(offlineFallbackPage))
  );
});

// ── ACTIVATE: claim clients ───────────────────────────────────────────────────
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k.startsWith(CACHE_PREFIX) && k !== CACHE).map(k => caches.delete(k)))
    ).then(() => self.clients.claim())
  );
});

// ── NAVIGATION PRELOAD ────────────────────────────────────────────────────────
if (workbox.navigationPreload.isSupported()) {
  workbox.navigationPreload.enable();
}

// ── ROUTING: pass API calls straight to network ───────────────────────────────
workbox.routing.registerRoute(
  ({ url }) =>
    url.hostname === 'api.groq.com' ||
    url.hostname === 'api.allorigins.win' ||
    url.hostname === 'fonts.gstatic.com',
  new workbox.strategies.NetworkOnly()
);

// ── ROUTING: Google Fonts CSS — network first, cache fallback ─────────────────
workbox.routing.registerRoute(
  ({ url }) => url.hostname === 'fonts.googleapis.com',
  new workbox.strategies.NetworkFirst({ cacheName: CACHE })
);

// ── ROUTING: app shell — StaleWhileRevalidate ─────────────────────────────────
workbox.routing.registerRoute(
  new RegExp('/*'),
  new workbox.strategies.StaleWhileRevalidate({ cacheName: CACHE })
);

// ── FETCH: navigation requests with preload support ───────────────────────────
self.addEventListener('fetch', (event) => {
  if (event.request.mode === 'navigate') {
    event.respondWith((async () => {
      try {
        const preloadResp = await event.preloadResponse;
        if (preloadResp) return preloadResp;
        return await fetch(event.request);
      } catch (error) {
        const cache = await caches.open(CACHE);
        const cachedResp = await cache.match(offlineFallbackPage);
        return cachedResp;
      }
    })());
  }
});

// ── PUSH ──────────────────────────────────────────────────────────────────────
self.addEventListener('push', (event) => {
  const data = event.data?.json() ?? { title: 'Listener Pro', body: 'Update available.' };
  event.waitUntil(
    self.registration.showNotification(data.title ?? 'Listener Pro', {
      body: data.body ?? '',
      icon: './icon-192x192.png',
      badge: './icon-96x96.png',
      tag: 'listener-pro-push'
    })
  );
});

// ── NOTIFICATION CLICK ────────────────────────────────────────────────────────
self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then(list => {
      for (const client of list) {
        if ('focus' in client) return client.focus();
      }
      return clients.openWindow('./');
    })
  );
});
