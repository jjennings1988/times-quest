/* Times Quest service worker — offline-first app shell */
const CACHE = 'times-quest-v10';
const SHELL = [
  './',
  './index.html',
  './manifest.webmanifest',
  './icons/icon-192.png',
  './icons/icon-512.png',
  './icons/icon-maskable-512.png',
  './icons/apple-touch-icon.png',
  './art/camp/bg-camp-dusk.png',
  './art/camp/camp-shelter-t1.png',
  './art/camp/camp-shelter-t2.png',
  './art/camp/camp-fire-t1.png',
  './art/camp/camp-fire-t2-strip3.png',
  './art/camp/camp-light-t1.png',
  './art/camp/camp-seating-t1.png',
  './art/camp/camp-garden-t1.png',
  './art/camp/camp-lookout-t1.png',
  './art/camp/camp-ground-stone-path.png',
  './art/camp/camp-trophy-x0.png',
];

self.addEventListener('install', (e) => {
  e.waitUntil(caches.open(CACHE).then((c) => c.addAll(SHELL)));
  self.skipWaiting();
});

self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k)))
    ).then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (e) => {
  const url = new URL(e.request.url);

  // App shell + same-origin: cache-first, fall back to network, then to cached index for navigations
  if (url.origin === location.origin) {
    e.respondWith(
      caches.match(e.request).then((hit) =>
        hit ||
        fetch(e.request).then((res) => {
          // Do not poison the offline cache with expected 404s for art batches
          // that have not shipped yet. A later batch must be able to appear.
          if (res.ok) {
            const copy = res.clone();
            caches.open(CACHE).then((c) => c.put(e.request, copy));
          }
          return res;
        }).catch(() => (e.request.mode === 'navigate' ? caches.match('./index.html') : undefined))
      )
    );
    return;
  }

  // Cross-origin (Google Fonts): stale-while-revalidate so the app still loads offline
  if (url.hostname.includes('fonts.googleapis.com') || url.hostname.includes('fonts.gstatic.com')) {
    e.respondWith(
      caches.match(e.request).then((hit) => {
        const net = fetch(e.request).then((res) => {
          const copy = res.clone();
          caches.open(CACHE).then((c) => c.put(e.request, copy));
          return res;
        }).catch(() => hit);
        return hit || net;
      })
    );
  }
});
