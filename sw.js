/**
 * Service Worker: hält die App offline verfügbar.
 *  - App-Shell (Dateien unten) wird beim Installieren gecacht, cache-first.
 *  - Kartenkacheln und Kartendaten: eigener Cache (seona-karta-v3), gefüllt über
 *    „Karte offline speichern" oder beim Anschauen; cache-first.
 *  - Aufrufe der Apps-Script-API (andere Domain, POST) werden nie gecacht.
 * Bei jeder Änderung an App-Dateien CACHE_VERSION hochzählen — sonst sehen installierte Handys
 * die neue Version nicht. Die App zeigt dann „Dostupna je nova verzija — Osvježi".
 */
var CACHE_VERSION = 'seona-v80';
var MAP_CACHE = 'seona-karta-v3';
var SHELL = [
  './', 'index.html', 'styles.css', 'config.js', 'manifest.webmanifest',
  'vendor/leaflet/leaflet.js', 'vendor/leaflet/leaflet.css', 'vendor/qrcode/qrcode.min.js',
  'fonts/oswald-latin.woff2', 'fonts/oswald-latin-ext.woff2', 'fonts/worksans-latin.woff2', 'fonts/worksans-latin-ext.woff2',
  'js/core/i18n.js', 'js/core/db.js', 'js/core/api.js', 'js/core/sync.js', 'js/core/store.js', 'js/core/ui.js', 'js/core/geo.js', 'js/core/wetter.js', 'js/core/qrscan.js', 'js/core/app.js', 'vendor/jsqr/jsQR.min.js',
  'js/data/icons.js', 'js/data/lovostaj.js', 'js/data/plan.js',
  'js/modules/home.js', 'js/modules/odstrjel.js', 'js/modules/strecke.js', 'js/modules/karta.js', 'js/modules/objekti.js',
  'js/modules/lovovi.js', 'js/modules/hladnjaca.js', 'js/modules/lovostaj.js', 'js/modules/vise.js', 'js/modules/gost.js', 'js/modules/gosti.js', 'js/modules/wetter.js', 'js/modules/tutorial.js',
  'map/meta.json', 'map/reviere.geojson', 'map/namen.geojson',
  'icons/icon-192.png', 'icons/icon-512.png', 'icons/icon-maskable-512.png', 'icons/apple-touch-icon.png',
  'icons/objekti/hochsitz_kanzel.svg', 'icons/objekti/hochsitz_leiter.svg', 'icons/objekti/drueckjagdbock.svg', 'icons/objekti/bodensitz.svg',
  'icons/objekti/kirrung.svg', 'icons/objekti/salzlecke.svg', 'icons/objekti/suhle.svg', 'icons/objekti/fuetterung.svg',
  'icons/objekti/schranke.svg', 'icons/objekti/kamera.svg', 'icons/objekti/zentrale.svg', 'icons/objekti/jagdhuette.svg'
];

self.addEventListener('install', function (event) {
  // cache: 'reload' = am Browser-Zwischenspeicher vorbei (GitHub Pages erlaubt 10 min) — sonst mischt das Update alte Dateien hinein
  event.waitUntil(caches.open(CACHE_VERSION).then(function (cache) {
    return cache.addAll(SHELL.map(function (u) { return new Request(u, { cache: 'reload' }); }));
  }));
});

self.addEventListener('activate', function (event) {
  event.waitUntil(
    caches.keys().then(function (keys) {
      return Promise.all(keys.filter(function (k) { return k !== CACHE_VERSION && k !== MAP_CACHE; })
        .map(function (k) { return caches.delete(k); }));
    }).then(function () { return self.clients.claim(); })
  );
});

self.addEventListener('message', function (event) {
  if (event.data === 'skipWaiting') self.skipWaiting();
});

function isMapAsset(path) { return /\/tiles(_gast)?\/\d+\/\d+\/\d+\.jpg$/.test(path) || /\/map\/odjeli\.geojson$/.test(path); }

self.addEventListener('fetch', function (event) {
  var req = event.request;
  if (req.method !== 'GET') return;
  var url = new URL(req.url);
  if (url.origin !== self.location.origin) return;

  if (req.mode === 'navigate') {
    event.respondWith(caches.match('index.html').then(function (hit) { return hit || fetch(req); }));
    return;
  }
  if (isMapAsset(url.pathname)) {
    // Kacheln: aus dem Kartencache; sonst laden und dort ablegen (einmal angesehen = offline da)
    event.respondWith(caches.open(MAP_CACHE).then(function (cache) {
      var key = url.pathname.replace(/^.*?\/(tiles_gast|tiles|map)\//, '$1/');
      return cache.match(key).then(function (hit) {
        if (hit) return hit;
        return fetch(req).then(function (res) {
          if (res.ok) cache.put(key, res.clone());
          return res;
        });
      });
    }));
    return;
  }
  // tiles/index.json immer frisch (für „Karte speichern"), sonst cache-first
  if (/\/tiles(_gast)?\/index\.json$/.test(url.pathname)) return;
  event.respondWith(caches.match(req, { ignoreSearch: true }).then(function (hit) { return hit || fetch(req); }));
});
