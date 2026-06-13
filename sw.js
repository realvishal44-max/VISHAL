const CACHE_NAME = 'bca-store-cache-v3';

// Core assets to pre-cache immediately for rapid load
const PRECACHE_ASSETS = [
  '/',
  '/index.html',
  '/style.css',
  '/modern-theme.css',
  '/elite-plus.css',
  '/logo.png',
  '/script.js',
  '/modern-effects.js',
  '/manifest.json'
];

// Service Worker installation & assets precaching
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => cache.addAll(PRECACHE_ASSETS))
      .then(() => self.skipWaiting())
  );
});

// Cache activation & cleanup of old caches
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cache => {
          if (cache !== CACHE_NAME) {
            return caches.delete(cache);
          }
        })
      );
    }).then(() => self.clients.claim())
  );
});

// Stale-While-Revalidate Fetch Handler
self.addEventListener('fetch', event => {
  // Only intercept local GET requests
  if (event.request.method !== 'GET') return;
  
  const requestUrl = new URL(event.request.url);
  if (requestUrl.origin !== self.location.origin) return;

  event.respondWith(
    caches.open(CACHE_NAME).then(cache => {
      return cache.match(event.request).then(cachedResponse => {
        const fetchPromise = fetch(event.request).then(networkResponse => {
          // If successful response, cache it dynamically for future loads
          if (networkResponse && networkResponse.status === 200 && networkResponse.type === 'basic') {
            cache.put(event.request, networkResponse.clone());
          }
          return networkResponse;
        }).catch(() => {
          // Fallback offline handler: if cachedResponse doesn't exist, try returning generic HTML
          return cachedResponse;
        });

        // Return cached version immediately (speed boost) and update in background
        return cachedResponse || fetchPromise;
      });
    })
  );
});
