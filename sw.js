const CACHE = 'abc-wort-v3';

const CORE_FILES = [
  '/ABC-Wort/',
  '/ABC-Wort/index.html',
  '/ABC-Wort/manifest.json',
  '/ABC-Wort/icon-192.png',
  '/ABC-Wort/icon-512.png',
  '/ABC-Wort/dict.js',
  // Deutsche App
  '/ABC-Wort/app/',
  '/ABC-Wort/app/index.html',
  // Externe Grammatik/Diktat-Daten für Deutsch
  '/ABC-Wort/app/data/diktat_de.json',
  '/ABC-Wort/app/data/grammatik_de.json',
];

// Install – Core-Dateien cachen
self.addEventListener('install', e => {
  e.waitUntil(
    caches.open(CACHE)
      .then(c => c.addAll(CORE_FILES))
      .then(() => self.skipWaiting())
  );
});

// Activate – alten Cache löschen
self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys()
      .then(keys => Promise.all(
        keys.filter(k => k !== CACHE).map(k => caches.delete(k))
      ))
      .then(() => self.clients.claim())
  );
});

// Fetch – Cache first, dann Network
self.addEventListener('fetch', e => {
  const url = e.request.url;

  // Externe APIs (MyMemory, mymemory.translated.net etc.) immer live
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
        // nur gültige Antworten dynamisch cachen
        if (response && response.status === 200 && response.type === 'basic') {
          const clone = response.clone();
          caches.open(CACHE).then(c => c.put(e.request, clone));
        }
        return response;
      }).catch(() => {
        // Offline-Fallback für HTML-Seiten → deutsche App
        if (e.request.destination === 'document') {
          return caches.match('/ABC-Wort/app/index.html');
        }
        // Offline-Fallback für JSON → leeres Array
        if (url.endsWith('.json')) {
          return new Response('{}', { headers: { 'Content-Type': 'application/json' } });
        }
      });
    })
  );
});
