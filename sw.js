// sw.js — RiftGauge Service Worker
// Caches all app shell files for offline use, plus Google Fonts.

const CACHE = 'riftgauge-v4'; // bump this version string on any deploy that changes cached files

const APP_SHELL = [
  './',
  './index.html',
  './style.css',
  './app.js',
  './picker-modal.js',
  './legend-picker.js',
  './battlefield-picker.js',
  './data/domains.js',
  './data/legends.js',
  './data/champions.js',
  './data/battlefields.js',
  './manifest.json',
  './icons/icon.svg',
  './icons/apple-touch-icon.svg',
];

const FONT_URLS = [
  'https://fonts.googleapis.com/css2?family=Cinzel:wght@400;600;700;900&family=Crimson+Pro:ital,wght@0,300;0,400;0,600;1,300&display=swap',
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE)
      .then((cache) => cache.addAll([...APP_SHELL, ...FONT_URLS]).catch(() => {
        // Cross-origin font requests can be opaque/CORS-restricted in some
        // browsers — fail silently rather than blocking install.
      }))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (event) => {
  const url = event.request.url;

  // Cache-first for Google Fonts
  if (url.includes('fonts.googleapis') || url.includes('fonts.gstatic')) {
    event.respondWith(
      caches.match(event.request).then((cached) => cached || fetch(event.request).then((res) => {
        caches.open(CACHE).then((cache) => cache.put(event.request, res.clone()));
        return res;
      }))
    );
    return;
  }

  // Cache-first with network fallback for same-origin app shell files
  if (url.startsWith(self.location.origin)) {
    event.respondWith(
      caches.match(event.request).then((cached) => cached || fetch(event.request))
    );
  }
});
