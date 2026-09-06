const CACHE_NAME = 'alkaromah-v2';
const AUDIO_CACHE = 'alkaromah-audio-v1';
const STATIC_ASSETS = [
  '/',
  '/index.html',
  '/profil',
  '/jadwal-sholat',
  '/kegiatan',
  '/layanan',
  '/artikel',
  '/artikel-sunnah',
  '/quran',
  '/zakat',
  '/donasi',
  '/media',
  '/kontak',
  '/saran',
  '/live',
  '/css/style.css',
  '/css/components.css',
  '/css/quran.css',
  '/js/utils.js',
  '/js/main.js',
  '/js/quran.js',
  '/js/quran-player.js',
  '/js/quran-bookmark.js',
  '/manifest.json',
  '/favicon.svg',
  '/robots.txt',
  '/sitemap.xml'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(STATIC_ASSETS);
    })
  );
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames
          .filter((name) => name !== CACHE_NAME && name !== AUDIO_CACHE)
          .map((name) => caches.delete(name))
      );
    })
  );
  self.clients.claim();
});

self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);
  
  if (url.hostname === 'cdn.islamic.network' && request.destination === 'audio') {
    event.respondWith(
      caches.open(AUDIO_CACHE).then((cache) => {
        return cache.match(request).then((cached) => {
          if (cached) return cached;
          return fetch(request).then((response) => {
            if (response.ok) {
              cache.put(request, response.clone());
            }
            return response;
          }).catch(() => new Response('', { status: 503 }));
        });
      })
    );
    return;
  }
  
  if (url.origin !== location.origin) {
    event.respondWith(
      fetch(request)
        .then((response) => {
          if (response.ok && request.method === 'GET') {
            const clone = response.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(request, clone));
          }
          return response;
        })
        .catch(() => caches.match(request))
    );
    return;
  }
  
  event.respondWith(
    caches.match(request).then((cached) => {
      const fetchPromise = fetch(request).then((response) => {
        if (response.ok) {
          const clone = response.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(request, clone));
        }
        return response;
      }).catch(() => {});
      
      return cached || fetchPromise;
    })
  );
});

self.addEventListener('message', (event) => {
  if (event.data === 'skipWaiting') {
    self.skipWaiting();
  }
  if (event.data === 'clearAudioCache') {
    caches.delete(AUDIO_CACHE).then(() => {
      event.ports[0].postMessage({ success: true });
    });
  }
});
