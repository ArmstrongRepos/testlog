// Keeps the app shell on the phone so it opens with no signal, and sends notes saved offline.
// The test log itself loads live from Google whenever there is a connection.
importScripts('queue.js');

const CACHE = 'test-log-shell-v5';
const SHELL = ['./', 'index.html', 'queue.js', 'manifest.webmanifest', 'icons/icon-192.png', 'icons/icon-512.png',
  'icons/maskable-512.png', 'icons/apple-touch-icon.png', 'icons/favicon-48.png', 'icons/wordmark.png'];

self.addEventListener('install', (e) => {
  e.waitUntil(caches.open(CACHE).then((c) => c.addAll(SHELL)).then(() => self.skipWaiting()));
});

self.addEventListener('activate', (e) => {
  e.waitUntil(caches.keys()
    .then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k))))
    .then(() => self.clients.claim()));
});

self.addEventListener('fetch', (e) => {
  const url = new URL(e.request.url);
  if (url.origin !== location.origin || e.request.method !== 'GET') return;   // Google's pages go straight to the network
  if (e.request.mode === 'navigate') {                       // network first, cached shell when offline
    e.respondWith(fetch(e.request).catch(() => caches.match('index.html')));
    return;
  }
  e.respondWith(caches.match(e.request, { ignoreSearch: true }).then((hit) => hit || fetch(e.request)));
});

// Android: sends saved notes as soon as signal returns, even if the app is closed.
self.addEventListener('sync', (e) => {
  if (e.tag !== 'tl-outbox') return;
  e.waitUntil(self.TLQueue.flush().then(async (left) => {
    const clients = await self.clients.matchAll();
    clients.forEach((c) => c.postMessage({ type: 'tl-sent' }));
    if (left) throw new Error('Some notes still waiting');   // asks the phone to try again later
  }));
});
