const CACHE = 'abc-wort-v4';

const CORE_FILES = [
  '/ABC-Wort/',
  '/ABC-Wort/index.html',
  '/ABC-Wort/offline.html',
  '/ABC-Wort/manifest.json',
  '/ABC-Wort/icon-192.png',
  '/ABC-Wort/icon-512.png',
  '/ABC-Wort/dict.js',
  '/ABC-Wort/app/',
  '/ABC-Wort/app/index.html',
  '/ABC-Wort/app/data/diktat_de.json',
  '/ABC-Wort/app/data/grammatik_de.json',
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
    e.respondWith(
      fetch(e.request).catch(() => new Response('', { status: 503 }))
    );
    return;
  }

  e.respondWith(
    caches.match(e.request).then(cached => {
      if (cached) return cached;
      return fetch(e.request).then(response => {
        if (response && response.status === 200 && response.type === 'basic') {
          const clone = response.clone();
          caches.open(CACHE).then(c => c.put(e.request, clone));
        }
        return response;
      }).catch(() => {
        if (e.request.destination === 'document') {
          return caches.match('/ABC-Wort/offline.html');
        }
        if (url.endsWith('.json')) {
          return new Response('{}', { headers: { 'Content-Type': 'application/json' } });
        }
      });
    })
  );
});
