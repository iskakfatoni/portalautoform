const CACHE_NAME = 'portal-autoform-v1.0';
const STATIC_ASSETS = [
  './',
  './index.html',
  './autoform.html',
  './asset/pages/portal.html',
  './manifest.webmanifest',
  './asset/css/style.css',
  './asset/image/logo-smkn1jetis.webp',
  './asset/js/xlsx.full.min.js',
  './asset/js/firebase-config.js',
  './asset/js/login.js',
  './asset/js/app.js',
  './asset/js/modules/auth-manager.js',
  './asset/js/modules/excel-service.js',
  './asset/js/modules/firestore-service.js',
  './asset/js/modules/formatters.js',
  './asset/js/modules/initial-data.js',
  './asset/js/modules/schedule-resolver.js',
  './asset/js/modules/theme-manager.js',
  './asset/js/modules/ui-renderers.js'
];

// Install Event: Precaching static shell
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      console.log('[ServiceWorker] Precaching App Shell');
      return cache.addAll(STATIC_ASSETS).catch((err) => {
        console.warn('[ServiceWorker] Some assets failed to precache:', err);
      });
    }).then(() => self.skipWaiting())
  );
});

// Activate Event: Clean up old caches
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keyList) => {
      return Promise.all(
        keyList.map((key) => {
          if (key !== CACHE_NAME) {
            console.log('[ServiceWorker] Removing old cache:', key);
            return caches.delete(key);
          }
        })
      );
    }).then(() => self.clients.claim())
  );
});

// Fetch Event Strategy:
// - Firestore REST / API / Google Forms: Network only (never cache POST or dynamic API)
// - Static Fonts & Icons (Google Fonts / FontAwesome): Cache-First with Network Fallback
// - App Shell & Local Code: Stale-While-Revalidate
self.addEventListener('fetch', (event) => {
  const request = event.request;
  const url = new URL(request.url);

  // Jangan cache request non-GET atau protokol non-http/https (misal: file:// atau chrome-extension://)
  if (request.method !== 'GET' || !url.protocol.startsWith('http')) {
    return;
  }

  // Bypass Google Forms & Firestore direct calls dari cache SW agar data selalu terupdate
  if (
    url.hostname.includes('firestore.googleapis.com') ||
    url.hostname.includes('identitytoolkit.googleapis.com') ||
    url.hostname.includes('docs.google.com') ||
    url.hostname.includes('forms.gle')
  ) {
    return;
  }

  // Aset Eksternal: Google Fonts & FontAwesome CDN (Cache First)
  if (
    url.hostname.includes('fonts.googleapis.com') ||
    url.hostname.includes('fonts.gstatic.com') ||
    url.hostname.includes('cdnjs.cloudflare.com')
  ) {
    event.respondWith(
      caches.match(request).then((cachedResponse) => {
        if (cachedResponse) {
          return cachedResponse;
        }
        return fetch(request).then((networkResponse) => {
          if (networkResponse && networkResponse.status === 200) {
            const responseClone = networkResponse.clone();
            caches.open(CACHE_NAME).then((cache) => {
              cache.put(request, responseClone);
            });
          }
          return networkResponse;
        }).catch(() => cachedResponse);
      })
    );
    return;
  }

  // Aset Lokal Aplikasi (Stale-While-Revalidate)
  event.respondWith(
    caches.match(request).then((cachedResponse) => {
      const fetchPromise = fetch(request).then((networkResponse) => {
        if (networkResponse && networkResponse.status === 200) {
          const responseClone = networkResponse.clone();
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(request, responseClone);
          });
        }
        return networkResponse;
      }).catch((err) => {
        console.log('[ServiceWorker] Offline fallback for:', request.url);
        return cachedResponse;
      });

      return cachedResponse || fetchPromise;
    })
  );
});
