/* Hisab Khata service worker — hand-written, no build step.
 *
 * - App shell (index.html, manifest, icons) is pre-cached on install.
 * - Navigations: network-first, falling back to the cached index.html when offline.
 * - Same-origin static assets (Vite's hashed /assets/*, icons, fonts, images):
 *   cache-first, filled lazily on first fetch.
 * - /api/* is NEVER cached or intercepted: it carries user data and auth cookies.
 *
 * Bump CACHE_VERSION whenever this file's caching behaviour changes; old caches
 * are deleted on activate.
 */
const CACHE_VERSION = 'v1';
const CACHE_NAME = `hisab-shell-${CACHE_VERSION}`;
const SHELL_URL = '/index.html';

const PRECACHE_URLS = [
  SHELL_URL,
  '/manifest.json',
  '/favicon.svg',
  '/icons/icon-192.png',
  '/icons/icon-512.png',
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches
      .open(CACHE_NAME)
      .then((cache) => cache.addAll(PRECACHE_URLS))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(
          keys
            .filter((key) => key.startsWith('hisab-shell-') && key !== CACHE_NAME)
            .map((key) => caches.delete(key))
        )
      )
      .then(() => self.clients.claim())
  );
});

function isApiRequest(url) {
  return url.pathname === '/api' || url.pathname.startsWith('/api/');
}

function isStaticAsset(request, url) {
  if (url.pathname.startsWith('/assets/') || url.pathname.startsWith('/icons/')) return true;
  return ['script', 'style', 'font', 'image', 'manifest'].includes(request.destination);
}

function isCacheable(response) {
  return response && response.ok && response.type === 'basic';
}

async function networkFirstNavigation(request) {
  const cache = await caches.open(CACHE_NAME);
  try {
    const response = await fetch(request);
    // Every SPA route serves index.html; keep the latest copy as the offline shell
    if (isCacheable(response)) {
      cache.put(SHELL_URL, response.clone());
    }
    return response;
  } catch (err) {
    const cached = await cache.match(SHELL_URL);
    if (cached) return cached;
    throw err;
  }
}

async function cacheFirst(request) {
  const cache = await caches.open(CACHE_NAME);
  const cached = await cache.match(request);
  if (cached) return cached;
  const response = await fetch(request);
  if (isCacheable(response)) {
    cache.put(request, response.clone());
  }
  return response;
}

self.addEventListener('fetch', (event) => {
  const { request } = event;
  if (request.method !== 'GET') return;

  const url = new URL(request.url);
  // Cross-origin (e.g. Google Fonts) and API traffic go straight to the network
  if (url.origin !== self.location.origin) return;
  if (isApiRequest(url)) return;

  if (request.mode === 'navigate') {
    event.respondWith(networkFirstNavigation(request));
    return;
  }

  if (isStaticAsset(request, url)) {
    event.respondWith(cacheFirst(request));
  }
});
