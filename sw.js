/* Hare Health service worker.
 *
 * The app is a single HTML file holding a person's blood-pressure history, so
 * the thing that matters is that it opens with no signal — in a waiting room,
 * on a plane, on hotel wifi that resolves nothing. Readings themselves live in
 * localStorage and were always offline-capable; it was the page delivering
 * them that needed a network round trip.
 *
 * Bump CACHE_VERSION on release. Old caches are dropped on activate.
 */
var CACHE_VERSION = 'hare-health-v1';
var CORE = [
  './',
  './index.html',
  './manifest.webmanifest',
  './icon-192.png',
  './icon-512.png',
  './icon-maskable-512.png',
  './apple-touch-icon.png'
];

self.addEventListener('install', function (event) {
  event.waitUntil(
    caches.open(CACHE_VERSION).then(function (cache) {
      // addAll is all-or-nothing; one 404 would leave the app with no cache at
      // all, so each entry is allowed to fail independently.
      return Promise.all(CORE.map(function (url) {
        return cache.add(new Request(url, { cache: 'reload' })).catch(function () {});
      }));
    }).then(function () { return self.skipWaiting(); })
  );
});

self.addEventListener('activate', function (event) {
  event.waitUntil(
    caches.keys().then(function (keys) {
      return Promise.all(keys.map(function (k) {
        return k === CACHE_VERSION ? null : caches.delete(k);
      }));
    }).then(function () { return self.clients.claim(); })
  );
});

self.addEventListener('fetch', function (event) {
  var req = event.request;
  if (req.method !== 'GET') return;

  var url;
  try { url = new URL(req.url); } catch (e) { return; }

  // Navigations: network first, so a deployed update is picked up immediately,
  // falling back to the cached shell when there is no network. Cache-first here
  // would pin users to an old build until the cache version changed.
  if (req.mode === 'navigate') {
    event.respondWith(
      fetch(req).then(function (res) {
        var copy = res.clone();
        caches.open(CACHE_VERSION).then(function (c) { c.put('./index.html', copy); }).catch(function () {});
        return res;
      }).catch(function () {
        return caches.match('./index.html').then(function (hit) {
          return hit || caches.match('./') || Response.error();
        });
      })
    );
    return;
  }

  // Same-origin assets: serve from cache, refresh in the background.
  if (url.origin === self.location.origin) {
    event.respondWith(
      caches.match(req).then(function (hit) {
        var net = fetch(req).then(function (res) {
          if (res && res.status === 200) {
            var copy = res.clone();
            caches.open(CACHE_VERSION).then(function (c) { c.put(req, copy); }).catch(function () {});
          }
          return res;
        }).catch(function () { return hit; });
        return hit || net;
      })
    );
    return;
  }

  // Third party (fonts, the EmailJS CDN): try the network, fall back to
  // whatever was cached on a previous online visit. Never fail hard — the app
  // is built to run without any of these.
  event.respondWith(
    fetch(req).then(function (res) {
      if (res && (res.status === 200 || res.type === 'opaque')) {
        var copy = res.clone();
        caches.open(CACHE_VERSION).then(function (c) { c.put(req, copy); }).catch(function () {});
      }
      return res;
    }).catch(function () {
      return caches.match(req).then(function (hit) { return hit || new Response('', { status: 504 }); });
    })
  );
});
