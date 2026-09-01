/**
 * Bütçe App — basit Service Worker
 * Stratejisi: aynı kaynaktan (same-origin) gelen GET isteklerinde
 * "stale-while-revalidate" (önce önbellekten göster, arka planda güncelle).
 * Google Apps Script'e giden POST istekleri ve harici kaynaklar (fontlar vb.)
 * hiçbir zaman önbelleğe alınmaz veya müdahale edilmez.
 */
const CACHE_NAME = 'butce-app-v1';
const CORE_ASSETS = ['./', './index.html', './manifest.webmanifest'];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => cache.addAll(CORE_ASSETS))
      .catch(() => { /* ilk yükleme başarısız olsa da kurulum devam etsin */ })
  );
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k)))
    )
  );
  self.clients.claim();
});

self.addEventListener('fetch', (event) => {
  const req = event.request;
  if (req.method !== 'GET') return;

  const url = new URL(req.url);
  if (url.origin !== self.location.origin) return;

  event.respondWith(
    caches.match(req).then((cached) => {
      const networkFetch = fetch(req)
        .then((res) => {
          if (res && res.ok) {
            const clone = res.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(req, clone));
          }
          return res;
        })
        .catch(() => cached);
      return cached || networkFetch;
    })
  );
});
