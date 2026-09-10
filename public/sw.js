/* Times Quest service worker — offline-first app shell */
const CACHE = 'times-quest-v68';
const CAMP_3D = ['./camp-v2-scene.js','./camp-world-details.js','./vendor/three/three.module.min.js','./vendor/three/three.core.min.js'];
const CORE = [
  './',
  './index.html',
  './camp-v2.js',
  './camp-v2.css',
  './camp-content.js',
  './math-visuals.js',
  './math-visuals.css',
  './learning-journey.js',
  './journey-ui.js',
  './journey.css',
  './manifest.webmanifest',
  './icons/icon-192.png',
  './icons/icon-512.png',
  './icons/icon-maskable-512.png',
  './icons/apple-touch-icon.png',
  './art/climber.png',
  './art/map/bg-adventure-map.png',
  './art/camp/bg-camp-dusk.png',
];
const OPTIONAL = [
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
  './art/avatar/profile-13.png',
  './art/avatar/profile-14.png',
  './art/avatar/profile-15.png',
  './art/avatar/profile-16.png',
  './art/avatar/profile-17.png',
  './art/avatar/profile-18.png',
  './art/avatar/profile-19.png',
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
  './art/mon/mon-01.png',
  './art/mon/mon-02.png',
  './art/mon/mon-03.png',
  './art/mon/mon-04.png',
  './art/mon/mon-05.png',
  './art/mon/mon-06.png',
  './art/mon/mon-07.png',
  './art/mon/mon-08.png',
  './art/mon/mon-09.png',
  './art/mon/mon-10.png',
  './art/mon/mon-11.png',
  './art/mon/mon-12.png',
  './art/mon/mon-13.png',
  './art/mon/mon-14.png',
  './art/mon/mon-15.png',
  './art/mon/mon-16.png',
  './art/mon/mon-17.png',
  './art/mon/mon-18.png',
  './art/mon/mon-19.png',
  './art/mon/mon-20.png',
  './art/mon/mon-21.png',
  './art/mon/mon-22.png',
  './art/mon/mon-23.png',
  './art/mon/mon-24.png',
  './art/mon/mon-25.png',
  './art/mon/mon-26.png',
  './art/mon/mon-27.png',
  './art/mon/mon-28.png',
  './art/mon/mon-29.png',
  './art/mon/mon-30.png',
  './art/mon/mon-31.png',
  './art/mon/mon-32.png',
  './art/mon/mon-33.png',
  './art/mon/mon-34.png',
  './art/mon/mon-35.png',
  './art/mon/mon-36.png',
  './art/mon/mon-37.png',
  './art/mon/mon-38.png',
  './art/mon/mon-39.png',
  './art/mon/mon-40.png',
  './art/mon/mon-41.png',
  './art/mon/mon-42.png',
  './art/mon/mon-43.png',
  './art/mon/mon-44.png',
  './art/mon/mon-45.png',
  './art/mon/mon-46.png',
  './art/mon/mon-47.png',
  './art/mon/mon-48.png',
  './art/mon/mon-49.png',
  './art/mon/mon-50.png',
  './art/mon/mon-51.png',
  './art/mon/mon-52.png',
  './art/mon/mon-53.png',
  './art/mon/mon-54.png',
  './art/mon/mon-55.png',
  './art/mon/mon-56.png',
  './art/mon/mon-57.png',
  './art/mon/mon-58.png',
  './art/mon/mon-59.png',
  './art/mon/mon-60.png',
  './art/mon/mon-61.png',
  './art/mon/mon-62.png',
  './art/mon/mon-63.png',
  './art/mon/mon-64.png',
  './art/mon/mon-65.png',
  './art/mon/mon-66.png',
  './art/mon/mon-67.png',
  './art/mon/mon-68.png',
  './art/mon/mon-69.png',
  './art/mon/mon-70.png',
  './art/mon/mon-71.png',
  './art/mon/mon-72.png',
  './art/mon/mon-73.png',
  './art/mon/mon-74.png',
  './art/mon/mon-75.png',
  './art/mon/mon-76.png',
  './art/mon/mon-77.png',
  './art/mon/mon-78.png',
  './art/boss/boss-0.png',
  './art/boss/boss-1.png',
  './art/boss/boss-2.png',
  './art/boss/boss-2-attack.webp',
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
  './art/battle/bg-battle-x0-portrait.webp',
  './art/battle/bg-battle-x1-portrait.webp',
  './art/battle/bg-battle-x2-portrait.webp',
  './art/battle/bg-battle-x3-portrait.webp',
  './art/battle/bg-battle-x4-portrait.webp',
  './art/battle/bg-battle-x5-portrait.webp',
  './art/battle/bg-battle-x6-portrait.webp',
  './art/battle/bg-battle-x7-portrait.webp',
  './art/battle/bg-battle-x8-portrait.webp',
  './art/battle/bg-battle-x9-portrait.webp',
  './art/battle/bg-battle-x10-portrait.webp',
  './art/battle/bg-battle-x11-portrait.webp',
  './art/battle/bg-battle-x12-portrait.webp',
  './art/battle/bg-battle-camp-siege-portrait.webp',
  './art/camp/bg-camp-dusk.png',
  './art/camp/bg-camp-morning.png',
  './art/camp/bg-camp-autumn.png',
  './art/camp/bg-camp-moonlit.png',
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
].filter((path) => !CORE.includes(path));

self.addEventListener('install', (e) => {
  // Make the app usable as soon as the compact shell is ready. The larger art
  // library warms in small batches after first paint instead of competing with
  // startup for bandwidth and memory.
  e.waitUntil(caches.open(CACHE).then((c) => c.addAll(CORE)));
});

async function warmOptionalCache(source) {
  const cache = await caches.open(CACHE);
  let failed=0;
  for (let i = 0; i < OPTIONAL.length; i += 12) {
    const batch = OPTIONAL.slice(i, i + 12);
    const outcomes=await Promise.allSettled(batch.map(async (path) => {
      if (!(await cache.match(path))) await cache.add(path);
    }));
    failed+=outcomes.filter(r=>r.status==='rejected').length;
    source?.postMessage({type:'OFFLINE_PROGRESS',count:Math.min(i+12,OPTIONAL.length),total:OPTIONAL.length,done:i+12>=OPTIONAL.length,failed});
  }
}

self.addEventListener('message', (e) => {
  if (e.data && e.data.type === 'SKIP_WAITING') self.skipWaiting();
  if (e.data && e.data.type === 'WARM_OPTIONAL') e.waitUntil(warmOptionalCache(e.source));
  if(e.data?.type==='WARM_REALM'&&Number.isInteger(e.data.family)&&e.data.family>=0&&e.data.family<=12){
    const f=e.data.family,assets=[`./art/realm/pet-${f}.png`,`./art/boss/boss-${f}.png`,`./art/battle/bg-battle-x${f}-portrait.webp`];
    e.waitUntil(caches.open(CACHE).then(cache=>Promise.allSettled(assets.map(async path=>{if(!(await cache.match(path)))await cache.add(path);})))) ;
  }
  if (e.data && e.data.type === 'CACHE_CAMP_3D') e.waitUntil(caches.open(CACHE).then(cache=>Promise.all(CAMP_3D.map(async path=>{if(!(await cache.match(path)))await cache.add(path);}))).catch(()=>{}));
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
        }).catch(() => (e.request.mode === 'navigate' ? caches.match('./index.html') : Response.error()))
      )
    );
    return;
  }

  // Cross-origin (Google Fonts): stale-while-revalidate so the app still loads offline
  if (url.hostname.includes('fonts.googleapis.com') || url.hostname.includes('fonts.gstatic.com')) {
    e.respondWith(
      caches.match(e.request).then((hit) => {
        const net = fetch(e.request).then((res) => {
          if (res.ok) {
            const copy = res.clone();
            caches.open(CACHE).then((c) => c.put(e.request, copy));
          }
          return res;
        }).catch(() => hit);
        return hit || net;
      })
    );
  }
});
