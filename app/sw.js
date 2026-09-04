const CACHE = 'abc-wort-v7';

const CORE_FILES = [
  '/app/',
  '/app/index.html',
  '/app/konjugator.html',
  '/app/dict.js',
  '/app/offline.html',
  '/app/manifest_de.json',
  '/app/data/diktat_de.json',
  '/app/data/grammatik_de.json',
  '/icon-192.png',
  '/icon-512.png',
  '/icon-512-maskable.png',
];

self.addEventListener('install', e => {
  e.waitUntil(
    caches.open(CACHE)
      .then(c => c.addAll(CORE_FILES))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys()
      .then(keys => Promise.all(
        keys.filter(k => k !== CACHE).map(k => caches.delete(k))
      ))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', e => {
  const url = e.request.url;

  if (!url.startsWith(self.location.origin)) {
    e.respondWith(fetch(e.request).catch(() => new Response('', { status: 503 })));
    return;
  }

  e.respondWith(
    caches.match(e.request).then(cached => {
      if (cached) return cached;
      return fetch(e.request).then(response => {
        if (response && response.status === 200 && response.type === 'basic') {
          caches.open(CACHE).then(c => c.put(e.request, response.clone()));
        }
        return response;
      }).catch(() => {
        if (e.request.destination === 'document') {
          return caches.match('/app/offline.html');
        }
        if (url.endsWith('.json')) {
          return new Response('{}', { headers: { 'Content-Type': 'application/json' } });
        }
      });
    })
  );
});
