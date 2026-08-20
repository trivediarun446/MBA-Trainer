/* =====================================================================
   Prep Desk — service worker
   Bump CACHE_VERSION whenever you change any file, otherwise phones
   will keep serving the old cached copy.
   ===================================================================== */

const CACHE_VERSION = 'prepdesk-v1';

const LOCAL_ASSETS = [
  './',
  './index.html',
  './style.css',
  './quotes.js',
  './script.js',
  './manifest.json',
  './icon-192.png',
  './icon-512.png',
  './icon-maskable-512.png'
];

// Install: pre-cache the app shell
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_VERSION)
      .then(cache => cache.addAll(LOCAL_ASSETS))
      .then(() => self.skipWaiting())
  );
});

// Activate: drop caches from older versions
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys()
      .then(keys => Promise.all(keys.filter(k => k !== CACHE_VERSION).map(k => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

// Fetch: cache-first for our own files, network-first (with cache
// fallback) for the Tailwind CDN and Google Fonts, so the app still
// looks right when offline.
self.addEventListener('fetch', (event) => {
  const req = event.request;
  if (req.method !== 'GET') return;

  const sameOrigin = new URL(req.url).origin === self.location.origin;

  if (sameOrigin) {
    event.respondWith(
      caches.match(req).then(hit => hit || fetch(req).then(res => {
        const copy = res.clone();
        caches.open(CACHE_VERSION).then(c => c.put(req, copy)).catch(() => {});
        return res;
      }).catch(() => caches.match('./index.html')))
    );
    return;
  }

  event.respondWith(
    fetch(req).then(res => {
      const copy = res.clone();
      caches.open(CACHE_VERSION).then(c => c.put(req, copy)).catch(() => {});
      return res;
    }).catch(() => caches.match(req))
  );
});
