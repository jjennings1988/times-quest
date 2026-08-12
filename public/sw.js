/* Times Quest service worker — offline-first app shell */
const CACHE = 'times-quest-v26';
const SHELL = [
  './',
  './index.html',
  './manifest.webmanifest',
  './icons/icon-192.png',
  './icons/icon-512.png',
  './icons/icon-maskable-512.png',
  './icons/apple-touch-icon.png',
  './art/climber.png',
  './art/avatar/profile-1.png',
  './art/avatar/profile-2.png',
  './art/avatar/profile-3.png',
  './art/avatar/profile-4.png',
  './art/avatar/profile-5.png',
  './art/avatar/profile-6.png',
  './art/avatar/profile-7.png',
  './art/avatar/profile-8.png',
  './art/avatar/profile-9.png',
  './art/avatar/profile-10.png',
  './art/avatar/profile-11.png',
  './art/avatar/profile-12.png',
  './art/map/bg-adventure-map.png',
  './art/buddy/cat.png',
  './art/buddy/dog.png',
  './art/buddy/unicorn.png',
  './art/realm/pet-0.png',
  './art/realm/pet-1.png',
  './art/realm/pet-2.png',
  './art/realm/pet-3.png',
  './art/realm/pet-4.png',
  './art/realm/pet-5.png',
  './art/realm/pet-6.png',
  './art/realm/pet-7.png',
  './art/realm/pet-8.png',
  './art/realm/pet-9.png',
  './art/realm/pet-10.png',
  './art/realm/pet-11.png',
  './art/realm/pet-12.png',
  './art/boss/boss-0.png',
  './art/boss/boss-1.png',
  './art/boss/boss-2.png',
  './art/boss/boss-3.png',
  './art/boss/boss-4.png',
  './art/boss/boss-5.png',
  './art/boss/boss-6.png',
  './art/boss/boss-7.png',
  './art/boss/boss-8.png',
  './art/boss/boss-9.png',
  './art/boss/boss-10.png',
  './art/boss/boss-11.png',
  './art/boss/boss-12.png',
  './art/camp/bg-camp-dusk.png',
  './art/camp/camp-shelter-t1.png',
  './art/camp/camp-shelter-t2.png',
  './art/camp/camp-shelter-t3.png',
  './art/camp/camp-shelter-t4.png',
  './art/camp/camp-shelter-t5.png',
  './art/camp/camp-fire-t1.png',
  './art/camp/camp-fire-t2-strip3.png',
  './art/camp/camp-fire-t3-strip3.png',
  './art/camp/camp-fire-t4-strip3.png',
  './art/camp/camp-light-t1.png',
  './art/camp/camp-light-t2.png',
  './art/camp/camp-light-t3-strip3.png',
  './art/camp/camp-seating-t1.png',
  './art/camp/camp-seating-t2.png',
  './art/camp/camp-seating-t3.png',
  './art/camp/camp-kitchen-t1.png',
  './art/camp/camp-kitchen-t2.png',
  './art/camp/camp-kitchen-t3.png',
  './art/camp/camp-water-t1.png',
  './art/camp/camp-water-t2.png',
  './art/camp/camp-water-t3-strip3.png',
  './art/camp/camp-garden-t1.png',
  './art/camp/camp-garden-t2.png',
  './art/camp/camp-garden-t3.png',
  './art/camp/camp-garden-t4.png',
  './art/camp/camp-storage-t1.png',
  './art/camp/camp-storage-t2.png',
  './art/camp/camp-storage-t3.png',
  './art/camp/camp-lookout-t1.png',
  './art/camp/camp-lookout-t2.png',
  './art/camp/camp-lookout-t3.png',
  './art/camp/camp-banner-t1-strip3.png',
  './art/camp/camp-banner-t2-strip3.png',
  './art/camp/camp-banner-t3-strip3.png',
  './art/camp/camp-ground-stone-path.png',
  './art/camp/camp-ground-wood-deck.png',
  './art/camp/camp-life-bird-feeder.png',
  './art/camp/camp-life-beehive.png',
  './art/camp/camp-activity-kite-strip3.png',
  './art/camp/camp-activity-rope-swing.png',
  './art/camp/camp-activity-zipline.png',
  './art/camp/camp-trophy-x0.png',
  './art/camp/camp-trophy-x1.png',
  './art/camp/camp-trophy-x2.png',
  './art/camp/camp-trophy-x3.png',
  './art/camp/camp-trophy-x4.png',
  './art/camp/camp-trophy-x5.png',
  './art/camp/camp-trophy-x6.png',
  './art/camp/camp-trophy-x7.png',
  './art/camp/camp-trophy-x8.png',
  './art/camp/camp-trophy-x9.png',
  './art/camp/camp-trophy-x10.png',
  './art/camp/camp-trophy-x11.png',
  './art/camp/camp-trophy-x12.png',
  './art/camp/camp-trophy-summit.png',
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
