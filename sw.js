/**
 * Service Worker — estratégia stale-while-revalidate para o app shell.
 * Para publicar uma nova versão: aumente CACHE_VERSION (ex.: v1.0.1).
 * Assim o cache antigo é removido no activate.
 */
const CACHE_VERSION = 'bitelo-v1.0.1';

const APP_SHELL = [
  './',
  './index.html',
  './manifest.webmanifest',
  './css/app.css',
  './js/main.js',
  './js/constants/plan.js',
  './js/utils/dates.js',
  './js/utils/dom.js',
  './js/ui/toast.js',
  './js/ui/tabs.js',
  './js/services/storage.js',
  './js/state/store.js',
  './js/features/dashboard.js',
  './js/features/checkin.js',
  './js/features/workout.js',
  './js/features/weight.js',
  './js/features/settings.js',
  './vendor/chart.umd.js',
  './assets/icons/icon-192.png',
  './assets/icons/icon-512.png',
  './assets/icons/icon-maskable-512.png',
  './assets/icons/apple-touch-icon.png',
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches
      .open(CACHE_VERSION)
      .then((cache) => cache.addAll(APP_SHELL.map((url) => new Request(url, { cache: 'reload' }))))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) => Promise.all(keys.filter((k) => k !== CACHE_VERSION).map((k) => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (event) => {
  const { request } = event;
  if (request.method !== 'GET') return;

  const url = new URL(request.url);
  if (url.origin !== self.location.origin) return; // não interceptar terceiros

  event.respondWith(
    caches.open(CACHE_VERSION).then(async (cache) => {
      const cached = await cache.match(request, { ignoreSearch: true });

      const network = fetch(request)
        .then((response) => {
          if (response.ok) cache.put(request, response.clone());
          return response;
        })
        .catch(() => undefined);

      if (cached) {
        event.waitUntil(network); // atualiza em background
        return cached;
      }

      const fresh = await network;
      if (fresh) return fresh;

      if (request.mode === 'navigate') {
        return (await cache.match('./index.html')) ?? Response.error();
      }
      return Response.error();
    })
  );
});
