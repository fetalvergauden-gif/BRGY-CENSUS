const CACHE_NAME = 'barangay-census-static-v2';
const STATIC_FILES = ['/', '/index.html', '/manifest.json', '/barangay-logo.svg'];

self.addEventListener('install', (event) => {
  event.waitUntil(caches.open(CACHE_NAME).then((cache) => cache.addAll(STATIC_FILES)));
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((names) => Promise.all(
      names.filter((name) => name !== CACHE_NAME)
        .map((name) => caches.delete(name)),
    )),
  );
  self.clients.claim();
});

self.addEventListener('fetch', (event) => {
  const request = event.request;
  const url = new URL(request.url);
  // Never cache API responses or cross-origin requests. MySQL remains the source of truth.
  if (request.method !== 'GET' || url.origin !== self.location.origin || url.pathname.startsWith('/api/')) return;
  if (request.destination === 'document' || ['script', 'style', 'image', 'font'].includes(request.destination)) {
    event.respondWith(fetch(request).catch(() => caches.match(request)));
  }
});
