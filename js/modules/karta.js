/**
 * Revierkarte: Kartenbild der QField-Feldkarte (tools/karte_bauen.py → tiles/), Reviergrenzen,
 * Waldabteilungen (antippbar, Verjüngung hervorgehoben), Einrichtungen, Abschussorte, eigener Standort.
 * Einrichtungen werden über ein Fadenkreuz in der Kartenmitte eingetragen (einhändig bedienbar).
 */
var MapOffline = (function () {
  var CACHE = 'seona-karta-v3';
  // Team: tiles/ (QField-Karte mit Reviergrenzen) · Gäste: tiles_gast/ (dieselbe Karte ohne Grenzen)
  function prefix() { return App.isGost() ? 'tiles_gast' : 'tiles'; }
  // Flag hängt an der Kartenversion: neue Karte (neuer Cache) → wird automatisch neu gespeichert
  function flag() { return (App.isGost() ? 'mapSavedGast' : 'mapSaved') + ':' + CACHE; }
  async function status() {
    var saved = await DB.get(flag());
    return saved || null;
  }
  /** Alle Kacheln + Kartendaten in den Offline-Cache laden. onProgress(done, total). */
  async function download(onProgress) {
    var pre = prefix();
    var index = await (await fetch(pre + '/index.json', { cache: 'no-store' })).json();
    var meta = await (await fetch('map/meta.json', { cache: 'no-store' })).json();
    var urls = ['map/reviere.geojson', 'map/odjeli.geojson', 'map/namen.geojson', 'map/meta.json'].concat(index.map(function (p) { return pre + '/' + p + '.jpg'; }));
    var cache = await caches.open(CACHE);
    var done = 0, failed = 0, i = 0;
    async function worker() {
      while (i < urls.length) {
        var u = urls[i++];
        try {
          var hit = await cache.match(u);
          if (!hit) {
            var res = await fetch(u);
            if (!res.ok) throw new Error(res.status);
            await cache.put(u, res);
          }
        } catch (e) { failed++; }
        done++;
        if (onProgress && (done % 20 === 0 || done === urls.length)) onProgress(done, urls.length);
      }
    }
    await Promise.all([worker(), worker(), worker(), worker(), worker(), worker()]);
    if (!failed) await DB.set(flag(), { at: Date.now(), gebaut: meta.gebaut, tiles: index.length });
    return { total: urls.length, failed: failed };
  }
  return { status: status, download: download, prefix: prefix, CACHE: CACHE };
})();

/** Koordinate genau unter dem Fadenkreuz (statt map.getCenter(), das mit einer evtl. veralteten Kartengröße rechnet). */
function punktUnterFadenkreuz(map, root) {
  map.invalidateSize({ pan: false });
  var ch = root.querySelector('.crosshair');
  var c;
  if (ch) {
    var r = ch.getBoundingClientRect(), m = map.getContainer().getBoundingClientRect();
    c = map.containerPointToLatLng([r.left + r.width / 2 - m.left, r.top + r.height / 2 - m.top]);
  } else c = map.getCenter();
  return { lat: +c.lat.toFixed(6), lon: +c.lng.toFixed(6) };
}

/**
 * Das Kartenbild ist in HTRS96/TM (EPSG:3765) rechteckig zugeschnitten; in Web-Mercator (Nord oben) steht dieses Rechteck
 * im Osten Kroatiens um gut 1° schräg (Meridiankonvergenz). Damit der Rand gerade ist, deckt eine Fläche in Papierfarbe
 * alles außerhalb des größten geraden Rechtecks im Bild ab (meta.rahmen, ermittelt aus den Kacheln).
 */
/** Farbe für alles außerhalb der Karte: Hintergrund der App (hell/dunkel), damit klar ist „hier endet die Karte“. */
function kartenRandFarbe() {
  var c = '';
  try { c = getComputedStyle(document.documentElement).getPropertyValue('--map-out').trim(); } catch (e) {}
  return c || '#1b201c';
}

/**
 * Gemeinsame Kartenregeln für Revierkarte und Kartenauswahl:
 *  - kleinste Zoomstufe = alle drei Reviere passen gerade auf den Bildschirm (kein schwebendes Kartenrechteck),
 *  - Verschieben reicht weit über den Kartenrand hinaus, damit der eigene Standort auch am Rand mittig stehen kann,
 *  - ändert sich die Größe des Kartenfelds (Kopfzeile, Vollbild, Drehen, iPhone-Leisten), rechnet Leaflet sofort neu —
 *    sonst zentriert es mit einer veralteten Größe und der Punkt steht neben der Mitte.
 */
var KARTE_RAND = 0.6;
function kartenGrenzen(map, meta, onResize) {
  function minZoom() {
    var z = map.getBoundsZoom(meta.reviere, false, L.point(20, 20));
    map.setMinZoom(Math.max(meta.minZoom, Math.min(z, meta.maxNativeZoom)));
  }
  minZoom();
  var box = map.getContainer(), w = box.clientWidth, h = box.clientHeight;
  if (window.ResizeObserver) {
    var ro = new ResizeObserver(function () {
      if (!map._loaded && !map._size) return;
      if (box.clientWidth === w && box.clientHeight === h) return;
      w = box.clientWidth; h = box.clientHeight;
      if (!w || !h) return;
      map.invalidateSize({ pan: false });
      minZoom();
      if (onResize) onResize();
    });
    ro.observe(box);
    map.on('unload', function () { ro.disconnect(); });
  }
}

function rahmenMaske(map, meta) {
  if (!meta.rahmen) return;
  var s = meta.rahmen[0][0], w = meta.rahmen[0][1], n = meta.rahmen[1][0], e = meta.rahmen[1][1];
  // eigene Ebene direkt über den Kacheln, unter Reviergrenzen und Symbolen
  var pane = map.createPane('rahmen');
  pane.style.zIndex = 250; pane.style.pointerEvents = 'none';
  L.polygon([[[35, 5], [55, 5], [55, 30], [35, 30]], [[s, w], [n, w], [n, e], [s, e]]], {
    stroke: false, fillColor: kartenRandFarbe(), fillOpacity: 1, interactive: false, pane: 'rahmen'
  }).addTo(map);
}

var Karta = (function () {
  var esc = UI.esc, t = I18n.t;
  var map = null, layers = {}, watchId = null, meMarker = null, meCircle = null, mode = null, focusMarker = null;
  var show = { objekti: true, biljeske: true, odstrjel: false, odjeli: false };
  try { var saved = JSON.parse(localStorage.getItem('seona_map_layers') || 'null'); if (saved) show = Object.assign(show, saved); } catch (e) {}

  function saveLayers() { try { localStorage.setItem('seona_map_layers', JSON.stringify(show)); } catch (e) {} }

  // Gäste: nur Kartenbild (Namen, Wege, Gewässer, Relief) und eigener Standort.
  // Keine Reviergrenzen, Einrichtungen, Abschussorte, Abteilungen, Treffpunkte, kein Eintragen.
  function guest() { return App.isGost(); }

  function render(ctx) {
    var g = guest();
    return '<div class="map-wrap"><div id="map" aria-label="' + esc(t('navKarta')) + '"></div>' +
      (g ? '' : '<div class="map-top"><div class="chips" id="layer-chips">' +
      ['objekti', 'biljeske', 'odstrjel', 'odjeli'].map(function (k) {
        return '<button type="button" class="chip" data-layer="' + k + '" aria-pressed="' + show[k] + '">' + esc(t('layer_' + k)) + '</button>';
      }).join('') + '</div></div>') +
      '<div class="map-fab" id="map-fab">' +
      '<button type="button" class="fab" id="fab-locate" aria-label="' + esc(t('myLocation')) + '">' + ICONS.locate + '</button>' +
      (g ? '' : '<button type="button" class="fab primary" id="fab-add" aria-label="' + esc(t('addObjekt')) + '">' + ICONS.plus + '</button>') + '</div>' +
      '<button type="button" class="fab map-full-btn" id="fab-full" aria-label="' + esc(t('fullscreen')) + '">' + ICONS.expand + '</button>' +
      '<a class="map-wind" id="map-wind" href="#/wetter" hidden></a>' +
      '<div id="map-overlay"></div></div>';
  }

  /**
   * Wind oben rechts als runde Scheibe: in der Mitte die Stärke, am Rand eine Marke an der Seite, aus der der Wind kommt
   * (Fahne zeigt zur Mitte, wie der Wind weht). Kupferpunkt = Norden. Ist die Blickrichtung bekannt (nach „Mein Standort“),
   * dreht sich die Scheibe mit dem Handy: Marke oben = Wind von vorn, unten = von hinten.
   */
  function drawWind() {
    var box = document.getElementById('map-wind');
    var c = Wetter.current();
    if (!box) return;
    if (!c || c.wind_direction_10m == null) { box.hidden = true; return; }
    box.hidden = false;
    box.setAttribute('aria-label', t('windFrom', { d: Wetter.dirName(c.wind_direction_10m, I18n.lang()) }) + ', ' + Math.round(c.wind_speed_10m) + ' km/h');
    var striche = '';
    for (var d = 0; d < 360; d += 45) striche += '<path d="M28 ' + (d % 90 ? '3.4v2.2' : '3v3.2') + '" transform="rotate(' + d + ' 28 28)"/>';
    box.innerHTML = '<svg class="wind-compass" viewBox="0 0 56 56" aria-hidden="true"><circle cx="28" cy="28" r="26" class="wc-ring"/>' +
      '<g class="wc-rose"><g class="wc-ticks">' + striche + '</g><circle cx="28" cy="1.9" r="1.9" class="wc-n"/></g>' +
      '<g class="wc-from"><path d="M26.9 12.5L28 17.5l1.1-5z" class="wc-streak"/><path d="M28 13.2L22.6 4.6Q28 7 33.4 4.6z" class="wc-flag"/></g>' +
      '<text x="28" y="31.5" class="wc-v">' + Math.round(c.wind_speed_10m) + '</text><text x="28" y="40" class="wc-u">km/h</text></svg>';
    updateCompass();
  }
  function updateCompass() {
    var box = document.getElementById('map-wind'), c = Wetter.current();
    if (!box || !c || c.wind_direction_10m == null) return;
    var h = heading == null ? 0 : heading;
    var rose = box.querySelector('.wc-rose'), from = box.querySelector('.wc-from');
    if (rose) rose.setAttribute('transform', 'rotate(' + (-h).toFixed(1) + ' 28 28)');
    if (from) from.setAttribute('transform', 'rotate(' + (c.wind_direction_10m - h).toFixed(1) + ' 28 28)');
    box.classList.toggle('turning', heading != null);
  }

  /* ---------- Blickrichtung: Kegel am Standortpunkt und mitdrehender Wind-Kompass ---------- */
  // Missweisung in Slawonien 2026 ≈ 5° Ost; das iPhone liefert die magnetische Richtung (webkitCompassHeading)
  var DEKLINATION = 5;
  var heading = null, headingOn = false, headingRaf = false;
  function onOrient(e) {
    var h = null;
    if (typeof e.webkitCompassHeading === 'number' && !isNaN(e.webkitCompassHeading)) h = e.webkitCompassHeading + DEKLINATION;
    else if (e.absolute && e.alpha != null) h = 360 - e.alpha;
    if (h == null) return;
    var scr = (screen.orientation && screen.orientation.angle) || window.orientation || 0;
    h = ((h + scr) % 360 + 360) % 360;
    // sanft nachführen (auch über 0°/360° hinweg), damit Kegel und Rose nicht zittern
    if (heading == null) heading = h;
    else { var d = ((h - heading + 540) % 360) - 180; heading = (heading + d * 0.3 + 360) % 360; }
    if (!headingRaf) { headingRaf = true; requestAnimationFrame(function () { headingRaf = false; applyHeading(); }); }
  }
  /** Muss direkt aus einem Fingertipp kommen (iPhone fragt einmal nach Erlaubnis für Bewegung & Ausrichtung). */
  function startHeading() {
    if (headingOn || !window.DeviceOrientationEvent) return;
    var go = function () {
      headingOn = true;
      window.addEventListener('ondeviceorientationabsolute' in window ? 'deviceorientationabsolute' : 'deviceorientation', onOrient);
    };
    if (typeof DeviceOrientationEvent.requestPermission === 'function') {
      DeviceOrientationEvent.requestPermission().then(function (s) { if (s === 'granted') go(); }).catch(function () {});
    } else go();
  }
  function stopHeading() {
    window.removeEventListener('deviceorientationabsolute', onOrient);
    window.removeEventListener('deviceorientation', onOrient);
    headingOn = false; heading = null;
  }
  function applyHeading() {
    var cone = document.querySelector('.me-cone');
    if (cone) { cone.style.display = heading == null ? 'none' : ''; if (heading != null) cone.style.transform = 'rotate(' + heading.toFixed(1) + 'deg)'; }
    updateCompass();
  }
  Wetter.onChange(function () { if (map) drawWind(); });

  /* ---------- Vollbild: Android/Chrome echtes Vollbild, iPhone per CSS (Kopfzeile/Navigation ausgeblendet) ---------- */
  var usedApi = false;
  function isFull() { return document.body.classList.contains('map-full'); }
  function setFull(on) {
    var wrap = document.querySelector('.map-wrap');
    document.body.classList.toggle('map-full', on);
    var btn = document.getElementById('fab-full');
    if (btn) { btn.innerHTML = on ? ICONS.collapse : ICONS.expand; btn.setAttribute('aria-label', t(on ? 'fullscreenExit' : 'fullscreen')); }
    if (on && wrap && wrap.requestFullscreen && !document.fullscreenElement) {
      wrap.requestFullscreen().then(function () { usedApi = true; }).catch(function () { usedApi = false; });
    } else if (!on && document.fullscreenElement) {
      document.exitFullscreen().catch(function () {});
      usedApi = false;
    }
    setTimeout(function () { if (map) map.invalidateSize(); }, 260);
  }
  document.addEventListener('fullscreenchange', function () { if (!document.fullscreenElement && usedApi && isFull()) { usedApi = false; setFull(false); } });
  document.addEventListener('keydown', function (e) { if (e.key === 'Escape' && isFull() && !document.fullscreenElement) setFull(false); });

  /** Treffpunkte der kommenden Drückjagden (und einer ausdrücklich gewählten). */
  function drawMeet(ctx) {
    if (layers.meet) { map.removeLayer(layers.meet); layers.meet = null; }
    if (guest()) return; // Treffpunkte für Gäste erst mit der Drückjagd-Fassung (Welle 2)
    var focusId = ctx && ctx.query && ctx.query.meet;
    var today = UI.todayISO();
    var g = L.layerGroup();
    Store.lovovi().forEach(function (l) {
      if (!(Number(l.sastanakLat) && Number(l.sastanakLon))) return;
      if (String(l.datum).slice(0, 10) < today && l.id !== focusId) return;
      var m = L.marker([l.sastanakLat, l.sastanakLon], { icon: L.divIcon({ className: '', html: '<div class="meet-marker"></div>', iconSize: [30, 30], iconAnchor: [15, 30] }), zIndexOffset: 900, title: t('gMeeting') });
      m.on('click', function () { openMeet(l); });
      g.addLayer(m);
    });
    layers.meet = g.addTo(map);
  }

  function openMeet(l) {
    UI.openSheet('<div class="eyebrow-sm">' + esc(t('gMeeting')) + '</div><h2>' + esc(l.naziv || t('lovDefaultName')) + '</h2>' +
      '<p class="sheet-sub">' + esc(UI.fmtDate(String(l.datum).slice(0, 10), { weekday: 'long', day: 'numeric', month: 'long' })) + '</p>' +
      (l.sastanak ? '<p style="margin:0 0 12px">' + esc(l.sastanak) + '</p>' : '') +
      '<a class="btn primary block" target="_blank" rel="noopener" href="https://www.google.com/maps/dir/?api=1&destination=' + l.sastanakLat + ',' + l.sastanakLon + '">' + ICONS.pin + esc(t('gRoute')) + '</a>', null, { noFocus: true });
  }

  // Stehende Symbole (Hochsitz, Leiter, Bock, Fütterung …) sitzen mit den Füßen auf dem Punkt, nicht mit der Mitte —
  // sonst steht der Hochsitz optisch ein gutes Stück neben der Stelle, an die man ihn gesetzt hat.
  // Werte = unterster Punkt der Grafik im 24er-Raster der SVG (icons/objekti/); Bild 30 px, 2 px Rand.
  var FUSS = { kanzel: 21, leiter: 21, drueckjagdbock: 20, bodensitz: 18, fuetterung: 20 };
  // Unterhalb dieser Zoomstufe nur ruhige Punkte statt Symbole — sonst stapeln sich die Hochsitze zu einem Klumpen
  var PUNKT_BIS = 14;
  function objIcon(o, zoom) {
    var cls = 'obj-marker' + (o.stanje === 'uklonjen' ? ' removed' : '') + (o.stanje === 'popravak' || o.stanje === 'neupotrebljivo' ? ' bad' : '');
    if (zoom != null && zoom <= PUNKT_BIS) return L.divIcon({ className: '', html: '<div class="obj-dot' + (o.art === 'biljeska' ? ' note' : '') + (o.stanje === 'uklonjen' ? ' removed' : '') + '"></div>', iconSize: [12, 12], iconAnchor: [6, 6] });
    var art = ICONS.objekt[o.art] ? o.art : 'kanzel';
    var ay = FUSS[art] ? Math.round(2 + FUSS[art] * 26 / 24) : 15;
    return L.divIcon({ className: '', html: '<div class="' + cls + '" style="position:relative"><img alt="" src="' + ICONS.objekt[art] + '"></div>', iconSize: [30, 30], iconAnchor: [15, ay] });
  }

  function drawData(ctx) {
    if (!map) return;
    ['objekti', 'biljeske', 'odstrjel', 'lovFocus'].forEach(function (k) { if (layers[k]) { map.removeLayer(layers[k]); layers[k] = null; } });
    drawMeet(ctx);
    if (guest()) return;
    var lovFocus = ctx && ctx.query && ctx.query.lov ? Store.lovovi().filter(function (l) { return l.id === ctx.query.lov; })[0] : null;
    // Einrichtungen und Notizen sind getrennt ein- und ausblendbar
    var zeigeObj = show.objekti || !!lovFocus, zeigeNotiz = show.biljeske;
    if (zeigeObj || zeigeNotiz) {
      var g = L.layerGroup(), n = L.layerGroup();
      Store.objekti().forEach(function (o) {
        if (!(Number(o.lat) && Number(o.lon))) return;
        var notiz = o.art === 'biljeska';
        if (notiz ? !zeigeNotiz : !zeigeObj) return;
        var m = L.marker([o.lat, o.lon], { icon: objIcon(o, map.getZoom()), keyboard: true, title: notiz ? (o.naziv || I18n.objekt(o.art)) : I18n.objekt(o.art) + (o.broj ? ' ' + o.broj : '') });
        m.on('click', function () { Objekti.openDetail(o.id); });
        (notiz ? n : g).addLayer(m);
      });
      if (zeigeObj) layers.objekti = g.addTo(map);
      if (zeigeNotiz) layers.biljeske = n.addTo(map);
    }
    if (lovFocus && Array.isArray(lovFocus.stajalista)) {
      var ring = L.layerGroup(), pts = [];
      Store.objekti().forEach(function (o) {
        if (lovFocus.stajalista.indexOf(o.id) === -1) return;
        pts.push([o.lat, o.lon]);
        ring.addLayer(L.circleMarker([o.lat, o.lon], { radius: 20, color: '#471b28', weight: 3, fill: false, interactive: false }));
      });
      layers.lovFocus = ring.addTo(map);
      if (pts.length && !ctx._fitted) { map.fitBounds(pts, { padding: [60, 60], maxZoom: 16 }); ctx._fitted = true; }
    }
    if (show.odstrjel) {
      var k = L.layerGroup();
      Stats.inJJ(Store.strecke()).forEach(function (r) {
        if (!(Number(r.lat) && Number(r.lon))) return;
        // Strecke: kupferne Runde mit Wildart-Symbol (deutlich anders als die dunklen Einrichtungen); weit weg nur ein kupferner Punkt
        var nah = map.getZoom() > PUNKT_BIS;
        var m = L.marker([r.lat, r.lon], { icon: L.divIcon({ className: '', html: nah ? '<div class="kill-mark">' + ICONS.forSpecies(r.vrsta) + '</div>' : '<div class="kill-dot"></div>',
          iconSize: nah ? [30, 30] : [14, 14], iconAnchor: nah ? [15, 15] : [7, 7] }), title: Strecke.title(r), zIndexOffset: 500 });
        m.on('click', function () { Strecke.openDetail(r.id); });
        k.addLayer(m);
      });
      layers.odstrjel = k.addTo(map);
    }
  }

  async function drawOdjeli() {
    if (layers.odjeli) { map.removeLayer(layers.odjeli); layers.odjeli = null; }
    if (!show.odjeli || guest()) return;
    try {
      var fc = await Geo.loadGeo('odjeli');
      if (!map || !show.odjeli) return;
      layers.odjeli = L.geoJSON(fc, {
        style: function (f) {
          var v = f.properties.verj;
          return { color: '#2d6a2d', weight: 1, dashArray: '2 3', opacity: .8,
            fillColor: v === 'pomladak' ? '#dd985f' : v === 'oplodna' ? '#d9b400' : '#2d6a2d',
            fillOpacity: v ? .28 : .02 };
        },
        onEachFeature: function (f, layer) { layer.on('click', function () { markOdjel(layer); openOdjel(f.properties, layer); }); }
      }).addTo(map);
      if (layers.reviere) layers.reviere.bringToFront();
    } catch (e) { UI.toast(t('mapDataMissing')); }
  }

  // Angetippte Abteilung hervorheben, bis das Infofeld wieder zu ist
  var odjelSel = null;
  function unmarkOdjel(layer) {
    if (!layer || odjelSel !== layer) return;
    if (layers.odjeli) layers.odjeli.resetStyle(layer);
    odjelSel = null;
  }
  function markOdjel(layer) {
    if (odjelSel && odjelSel !== layer) unmarkOdjel(odjelSel);
    odjelSel = layer;
    layer.setStyle({ color: '#dd985f', weight: 4, opacity: 1, dashArray: null, fillColor: '#dd985f', fillOpacity: .3 });
    layer.bringToFront();
    if (layers.reviere) layers.reviere.bringToFront();
  }

  function openOdjel(p, layer) {
    var verj = p.verj === 'pomladak' ? t('verjPomladak') : p.verj === 'oplodna' ? t('verjOplodna') : '';
    var kv = [[t('odGj'), p.gj], [t('odOdjel'), (p.odjel || '') + (p.odsjek ? ' ' + p.odsjek : '')], [t('odHa'), p.ha != null ? p.ha + ' ha' : ''],
      [t('odRazred'), p.razred], [t('odStarost'), p.starost ? p.starost + ' ' + t('years') : ''], [t('odDobni'), p.dr ? p.dr + '.' : ''],
      [t('odSklop'), p.sklop], [t('odBonitet'), p.bonitet], [t('odUzgoj'), p.uzgoj], [t('odGodina'), p.godina]].filter(function (x) { return x[1]; });
    UI.openSheet('<h2>' + esc(t('odOdjel') + ' ' + (p.odjel || '') + (p.odsjek ? ' ' + p.odsjek : '')) + '</h2>' +
      '<p class="sheet-sub">' + esc(p.gj || '') + '</p>' +
      (verj ? '<p><span class="badge warn">' + esc(verj) + '</span></p>' : '') +
      '<dl class="kv">' + kv.map(function (x) { return '<dt>' + esc(x[0]) + '</dt><dd>' + esc(x[1]) + '</dd>'; }).join('') + '</dl>' +
      '<p class="source">' + esc(t('odSource')) + '</p>', null, { noFocus: true, onClose: function () { unmarkOdjel(layer); } });
    // Markierte Abteilung in den freien Teil über dem Infofeld schieben (nicht heranzoomen)
    if (layer && map) setTimeout(function () {
      var sh = document.querySelector('.sheet'); if (!sh || !map) return;
      // Endlage des Infofelds (es fährt gerade noch hoch): unten bündig, also Fensterhöhe minus eigene Höhe
      var mr = map.getContainer().getBoundingClientRect(), top = window.innerHeight - sh.offsetHeight;
      var unten = Math.max(0, mr.bottom - top) + 16;
      if (mr.height - unten < 120) return;
      map.fitBounds(layer.getBounds(), { paddingTopLeft: [16, 64], paddingBottomRight: [16, unten], maxZoom: map.getZoom(), animate: true });
    }, 60);
  }

  /**
   * Ortung wie bei Navigations-Apps: Knopf antippen → Karte folgt dem Standort (bleibt zentriert).
   * Verschiebt man die Karte von Hand, hört das Folgen auf (Punkt bleibt sichtbar); erneut antippen → folgt wieder.
   */
  var follow = false, grenzen = null;
  function setFollow(on) {
    follow = on;
    var f = document.getElementById('fab-locate');
    if (f) { f.classList.toggle('active', watchId !== null); f.classList.toggle('follow', on); }
    if (!map) return;
    // Beim Folgen zoomen Finger, Doppeltipp und Mausrad um die Bildmitte (= Standort), nicht um die Fingerposition —
    // sonst rutscht der Punkt beim Zoomen aus der Mitte, bis das GPS die nächste Position liefert.
    var mitte = on ? 'center' : true;
    map.options.touchZoom = mitte; map.options.doubleClickZoom = mitte; map.options.scrollWheelZoom = mitte;
    // Solange die Ortung läuft, keine Randbegrenzung: die Mitte darf überall liegen, auch am Kartenrand.
    map.setMaxBounds(watchId !== null ? null : grenzen);
  }
  function zentrieren() {
    if (follow && meMarker && map) map.setView(meMarker.getLatLng(), map.getZoom(), { animate: false });
  }
  function locate() {
    startHeading();
    if (!navigator.geolocation) { UI.toast(t('gpsFailed')); return; }
    if (watchId !== null) {
      setFollow(true);
      if (meMarker) map.setView(meMarker.getLatLng(), Math.max(map.getZoom(), 16));
      return;
    }
    var first = true;
    watchId = navigator.geolocation.watchPosition(function (p) {
      if (!map) return;
      var ll = [p.coords.latitude, p.coords.longitude];
      if (!meMarker) {
        meMarker = L.marker(ll, { icon: L.divIcon({ className: '', html: '<div class="me-wrap"><div class="me-cone" style="display:none"></div><div class="me-dot"></div></div>', iconSize: [72, 72], iconAnchor: [36, 36] }), interactive: false, zIndexOffset: 1000 }).addTo(map);
        applyHeading();
        meCircle = L.circle(ll, { radius: p.coords.accuracy, color: '#2f6fc0', weight: 1, fillOpacity: .08, interactive: false }).addTo(map);
      } else { meMarker.setLatLng(ll); meCircle.setLatLng(ll).setRadius(p.coords.accuracy); }
      if (!follow) return;
      map.invalidateSize({ pan: false });
      if (first) { map.setView(ll, Math.max(map.getZoom(), 16), { animate: false }); first = false; }
      else map.panTo(ll, { animate: true, duration: 0.5 });
    }, function (err) {
      UI.toast(err && err.code === 1 ? t('gpsDenied') : t('gpsFailed'));
      stopLocate();
    }, { enableHighAccuracy: true, maximumAge: 0, timeout: 30000 });
    setFollow(true);
  }
  function stopLocate() {
    if (watchId !== null) navigator.geolocation.clearWatch(watchId);
    watchId = null;
    setFollow(false);
  }

  /** Platzierungsmodus: Fadenkreuz in der Mitte, Leiste unten. onPlace(latlng). */
  function placeMode(text, onPlace) {
    mode = 'place';
    var ov = document.getElementById('map-overlay');
    document.getElementById('map-fab').hidden = true;
    ov.innerHTML = '<svg class="crosshair" viewBox="0 0 48 48" fill="none" stroke="currentColor" stroke-width="2.4"><circle cx="24" cy="24" r="10"/><path d="M24 2v12M24 34v12M2 24h12M34 24h12"/></svg>' +
      '<div class="place-bar"><p>' + esc(text) + '</p><div class="btn-row">' +
      '<button type="button" class="btn small" data-gps>' + ICONS.locate + esc(t('myLocation')) + '</button>' +
      '<button type="button" class="btn small ghost" data-cancel>' + esc(t('cancel')) + '</button>' +
      '<button type="button" class="btn small primary" data-place>' + esc(t('placeHere')) + '</button></div></div>';
    ov.querySelector('[data-cancel]').onclick = endPlace;
    ov.querySelector('[data-gps]').onclick = async function () {
      try { var p = await Geo.precise(); map.setView([p.lat, p.lon], Math.max(map.getZoom(), 17)); UI.toast(t('gpsAcc', { m: p.acc })); }
      catch (e) { UI.toast(e && e.code === 1 ? t('gpsDenied') : t('gpsFailed')); }
    };
    ov.querySelector('[data-place]').onclick = function () { var p = punktUnterFadenkreuz(map, ov); endPlace(); onPlace(p); };
  }
  function endPlace() {
    mode = null;
    var ov = document.getElementById('map-overlay'); if (ov) ov.innerHTML = '';
    var fab = document.getElementById('map-fab'); if (fab) fab.hidden = false;
  }

  async function offlineBanner() {
    var st = await MapOffline.status();
    if (st || !map) return;
    var ov = document.getElementById('map-overlay');
    if (!ov || mode) return;
    var b = document.createElement('div');
    b.className = 'map-banner';
    b.innerHTML = '<span>' + esc(t('mapNotSaved')) + '</span><button type="button" class="btn small dark">' + esc(t('saveMap')) + '</button>';
    ov.appendChild(b);
    b.querySelector('button').onclick = async function () {
      var btn = this; btn.disabled = true;
      var span = b.querySelector('span');
      try {
        var res = await MapOffline.download(function (d, n) { span.textContent = t('savingMap', { p: Math.round(d / n * 100) }); });
        if (res.failed) { span.textContent = t('saveMapPartial', { n: res.failed }); btn.disabled = false; }
        else { b.remove(); UI.toast(t('mapSaved')); }
      } catch (e) { span.textContent = t('saveMapFailed'); btn.disabled = false; }
    };
  }

  async function mount(el, ctx) {
    var meta;
    try { meta = await (await fetch('map/meta.json')).json(); }
    catch (e) { el.querySelector('#map').innerHTML = UI.emptyState('map', t('mapDataMissing'), t('mapDataMissingText')); return; }
    if (!document.getElementById('map')) return; // inzwischen weiter navigiert
    grenzen = L.latLngBounds(meta.bounds).pad(KARTE_RAND);
    map = L.map('map', { zoomControl: false, attributionControl: true, minZoom: meta.minZoom, maxZoom: 18, maxBounds: grenzen, maxBoundsViscosity: 0.6, preferCanvas: true });
    kartenGrenzen(map, meta, zentrieren);
    rahmenMaske(map, meta);
    L.tileLayer(MapOffline.prefix() + '/{z}/{x}/{y}.jpg', {
      minZoom: meta.minZoom, maxZoom: 18, maxNativeZoom: meta.maxNativeZoom, bounds: meta.bounds,
      attribution: 'Seona Eko · QField-karta (DGU, OSM, HŠ)'
    }).addTo(map);
    L.control.zoom({ position: 'bottomleft' }).addTo(map);

    var view = null;
    try { view = JSON.parse(sessionStorage.getItem('seona_map_view') || 'null'); } catch (e) {}
    if (ctx.query.lat && ctx.query.lon) {
      var ll = [Number(ctx.query.lat), Number(ctx.query.lon)];
      map.setView(ll, 16);
      focusMarker = L.circleMarker(ll, { radius: 16, color: '#471b28', weight: 3, fill: false }).addTo(map);
    } else if (view) map.setView(view.c, view.z);
    else map.fitBounds(meta.reviere, { padding: [20, 20] });
    map.on('moveend', function () { try { sessionStorage.setItem('seona_map_view', JSON.stringify({ c: map.getCenter(), z: map.getZoom() })); } catch (e) {} });

    if (!guest()) try {
      var rev = await Geo.loadGeo('reviere');
      layers.reviere = L.geoJSON(rev, { interactive: false, style: function (f) { return { color: f.properties.boja, weight: 3, opacity: .9, fillOpacity: 0 }; } }).addTo(map);
    } catch (e) {}
    drawOdjeli();
    drawData(ctx);

    UI.$$('#layer-chips .chip', el).forEach(function (b) {
      b.onclick = function () {
        var k = b.getAttribute('data-layer');
        show[k] = !show[k]; saveLayers();
        b.setAttribute('aria-pressed', String(show[k]));
        if (k === 'odjeli') drawOdjeli(); else drawData(ctx);
        if (k === 'odjeli' && show.odjeli) UI.toast(t('odjeliLegend'), { timeout: 6000 });
      };
    });
    drawWind();
    Wetter.refresh();
    el.querySelector('#fab-locate').onclick = function () { locate(); };
    map.on('dragstart', function () { if (follow) setFollow(false); });
    map.on('zoomend', function () {
      zentrieren();
      // Symbole ↔ Punkte nur neu zeichnen, wenn die Schwelle überschritten wird
      var punkte = map.getZoom() <= PUNKT_BIS;
      if (punkte !== map._punkte) { map._punkte = punkte; if (mode !== 'place') drawData({ query: {} }); }
    });
    map._punkte = map.getZoom() <= PUNKT_BIS;
    el.querySelector('#fab-full').onclick = function () { setFull(!isFull()); };
    var add = el.querySelector('#fab-add');
    if (add) add.onclick = function () { startAdd(); };
    if (ctx.query.meet) focusMeet(ctx.query.meet);
    if (guest()) { offlineBanner(); return; }
    if (ctx.query.add) startAdd();
    if (ctx.query.move) startMove(ctx.query.move);
    offlineBanner();
  }

  /** Treffpunkt zeigen; fehlt er und ist das Team angemeldet: per Fadenkreuz setzen. */
  function focusMeet(id) {
    var l = Store.lovovi().filter(function (x) { return x.id === id; })[0];
    if (!l || !map) return;
    if (Number(l.sastanakLat) && Number(l.sastanakLon)) { map.setView([l.sastanakLat, l.sastanakLon], 16); return; }
    if (!App.isUprava()) return;
    placeMode(t('meetPlaceHint'), async function (pos) {
      await Store.queueUpsert('lov', { id: l.id, sastanakLat: pos.lat, sastanakLon: pos.lon });
      App.syncNow({ quiet: true });
      UI.toast(t('meetSaved'));
      drawMeet({ query: { meet: l.id } });
    });
  }

  function startAdd() {
    if (!map) return;
    // Beim Eintragen alles zeigen, was man gerade anlegen kann (Einrichtungen und Notizen)
    if (!show.objekti || !show.biljeske) {
      show.objekti = true; show.biljeske = true; saveLayers(); drawData({ query: {} });
      ['objekti', 'biljeske'].forEach(function (k) { var c = document.querySelector('[data-layer="' + k + '"]'); if (c) c.setAttribute('aria-pressed', 'true'); });
    }
    placeMode(t('placeHint'), function (pos) { Objekti.openForm({ lat: pos.lat, lon: pos.lon }); });
  }

  function startMove(id) {
    var o = Store.objekti().filter(function (x) { return x.id === id; })[0];
    if (!o || !map) return;
    map.setView([o.lat, o.lon], Math.max(map.getZoom(), 17));
    placeMode(t('moveHint', { name: I18n.objekt(o.art) + (o.broj ? ' ' + o.broj : '') }), async function (pos) {
      var lok = await Geo.lovisteAt(pos.lat, pos.lon);
      await Store.queueUpsert('objekt', { id: o.id, lat: pos.lat, lon: pos.lon, lokacija: lok || o.lokacija });
      App.syncNow({ quiet: true });
      UI.toast(t('moved'));
    });
  }

  function unmount() {
    if (isFull()) setFull(false);
    stopLocate();
    stopHeading();
    if (map) { map.remove(); map = null; }
    layers = {}; meMarker = null; meCircle = null; mode = null; focusMarker = null; follow = false; grenzen = null;
  }

  App.route('karta', {
    nav: 'karta', full: true, live: false,
    render: render, mount: mount, unmount: unmount,
    onData: function () { if (map && mode !== 'place') drawData({ query: {} }); }
  });

  return { startMove: startMove, isOpen: function () { return !!map; }, objIcon: objIcon };
})();

/**
 * Kartenauswahl für Formulare (z. B. Abschussort, wenn erst an der Kühlzelle gemeldet wird):
 * Vollbild-Karte mit Fadenkreuz → MapPicker.open({ lat, lon }) liefert { lat, lon } oder null (abgebrochen).
 */
var MapPicker = (function () {
  var esc = UI.esc, t = I18n.t;
  function open(start) {
    return new Promise(async function (resolve) {
      var meta;
      try { meta = await (await fetch('map/meta.json')).json(); } catch (e) { UI.toast(t('mapDataMissing')); return resolve(null); }
      var ov = document.createElement('div');
      ov.className = 'picker';
      ov.innerHTML = '<div class="picker-map" id="picker-map"></div>' +
        '<svg class="crosshair" viewBox="0 0 48 48" fill="none" stroke="currentColor" stroke-width="2.4"><circle cx="24" cy="24" r="10"/><path d="M24 2v12M24 34v12M2 24h12M34 24h12"/></svg>' +
        '<div class="place-bar"><p>' + esc(t('pickHint')) + '</p><div class="btn-row">' +
        '<button type="button" class="btn small" data-gps>' + ICONS.locate + esc(t('myLocation')) + '</button>' +
        '<button type="button" class="btn small ghost" data-cancel>' + esc(t('cancel')) + '</button>' +
        '<button type="button" class="btn small primary" data-ok>' + esc(t('placeHere')) + '</button></div></div>';
      document.body.appendChild(ov);
      document.body.classList.add('picker-open');
      var map = L.map('picker-map', { zoomControl: false, minZoom: meta.minZoom, maxZoom: 18, maxBounds: L.latLngBounds(meta.bounds).pad(KARTE_RAND), maxBoundsViscosity: 0.6, attributionControl: false });
      kartenGrenzen(map, meta);
      L.tileLayer(MapOffline.prefix() + '/{z}/{x}/{y}.jpg', { minZoom: meta.minZoom, maxZoom: 18, maxNativeZoom: meta.maxNativeZoom, bounds: meta.bounds }).addTo(map);
      rahmenMaske(map, meta);
      L.control.zoom({ position: 'topright' }).addTo(map);
      // Hochsitze & Co. zur Orientierung (nicht antippbar — getippt wird nur mit dem Fadenkreuz)
      if (!App.isGost()) Store.objekti().forEach(function (o) {
        if (o.stanje === 'uklonjen' || !(Number(o.lat) && Number(o.lon))) return;
        L.marker([o.lat, o.lon], { icon: Karta.objIcon(o, 15), interactive: false, keyboard: false }).addTo(map);
      });
      if (start && Number(start.lat) && Number(start.lon)) map.setView([start.lat, start.lon], 16);
      else map.fitBounds(meta.reviere, { padding: [20, 20] });
      setTimeout(function () { map.invalidateSize(); }, 50);
      function done(v) { map.remove(); ov.remove(); document.body.classList.remove('picker-open'); resolve(v); }
      ov.querySelector('[data-cancel]').onclick = function () { done(null); };
      ov.querySelector('[data-ok]').onclick = function () { done(punktUnterFadenkreuz(map, ov)); };
      ov.querySelector('[data-gps]').onclick = async function () {
        try { var p = await Geo.precise(); map.setView([p.lat, p.lon], Math.max(map.getZoom(), 17)); UI.toast(t('gpsAcc', { m: p.acc })); }
        catch (e) { UI.toast(e && e.code === 1 ? t('gpsDenied') : t('gpsFailed')); }
      };
    });
  }
  return { open: open };
})();
