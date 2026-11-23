/**
 * Revierkarte: Kartenbild der QField-Feldkarte (tools/karte_bauen.py → tiles/), Reviergrenzen,
 * Waldabteilungen (antippbar, Verjüngung hervorgehoben), Einrichtungen, Abschussorte, eigener Standort.
 * Einrichtungen werden über ein Fadenkreuz in der Kartenmitte eingetragen (einhändig bedienbar).
 */
var MapOffline = (function () {
  var CACHE = 'seona-karta-v4';
  // Alle nutzen tiles_gast/ (QField-Karte ohne eingebrannte Reviergrenzen). Die Grenzen zeichnet die App fürs Team selbst
  // (Farben passend zur App, siehe REVIER_FARBE). tiles/ (mit Grenzen in QField-Farben) bleibt nur als Reserve liegen.
  function prefix() { return 'tiles_gast'; }
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
// Quellenzeile ohne „Leaflet“-Link: ein Tipp darauf öffnete in der Home-Bildschirm-App Safari
if (window.L && L.Control && L.Control.Attribution) L.Control.Attribution.prototype.options.prefix = false;
/**
 * Safari am Mac meldet das Zusammenziehen auf dem Touchpad als „gesture“-Ereignisse statt als Mausrad mit Strg —
 * die kennt Leaflet nicht (Chrome/Firefox gehen über das Mausrad). Nur auf Geräten ohne Touchscreen,
 * sonst würde am iPhone/iPad doppelt gezoomt.
 */
function touchpadPinch(map) {
  if (navigator.maxTouchPoints > 0) return;
  var box = map.getContainer(), z0 = null, punkt = null, aktiv = false, ende = null;
  /* Zoomen wie beim Zusammenziehen am Handy (Leaflet TouchZoom): während der Bewegung wird das vorhandene Kartenbild nur
     skaliert (_move mit pinch), neue Kacheln lädt die Karte erst, wenn die Finger kurz stillstehen (_moveEnd).
     Vorher wurde bei jedem kleinen Schritt neu gezoomt → Kacheln luden ständig nach, die Karte flackerte und wurde blass. */
  function zoomUm(cp, z) {
    z = Math.max(map.getMinZoom(), Math.min(map.getMaxZoom(), z));
    if (!aktiv) { map._stop(); map._moveStart(true, false); aktiv = true; }
    var halb = map.getSize().divideBy(2), scale = map.getZoomScale(z);
    var mitte = map.containerPointToLatLng(halb.add(cp.subtract(halb).multiplyBy(1 - 1 / scale)));
    map._move(mitte, z, { pinch: true, round: false });
    clearTimeout(ende);
    ende = setTimeout(function () { aktiv = false; map._moveEnd(true); }, 160);
  }
  // Chrome/Firefox/Edge: Zusammenziehen kommt als Mausrad mit Strg in vielen kleinen Schritten. Normales Mausrad bleibt bei Leaflet.
  box.addEventListener('wheel', function (e) {
    if (!e.ctrlKey) return;
    e.preventDefault(); e.stopPropagation();
    var dy = e.deltaMode === 1 ? e.deltaY * 16 : e.deltaY;
    zoomUm(map.mouseEventToContainerPoint(e), map.getZoom() - dy * 0.02);
  }, { capture: true, passive: false });
  if (!('ongesturestart' in window)) return;
  // Safari am Mac: eigene gesture-Ereignisse mit Maßstab seit Beginn
  box.addEventListener('gesturestart', function (e) { e.preventDefault(); z0 = map.getZoom(); punkt = map.mouseEventToContainerPoint(e); });
  box.addEventListener('gesturechange', function (e) {
    e.preventDefault();
    if (z0 == null) return;
    zoomUm(punkt, z0 + Math.log2(e.scale));
  });
  box.addEventListener('gestureend', function (e) { e.preventDefault(); z0 = null; });
}
/** Markierungsfarbe auf der Karte = Hauptaktion: hell Weinrot, dunkel Kupfer. */
function akzentFarbe() { return (getComputedStyle(document.documentElement).getPropertyValue('--primary') || '').trim() || '#dd985f'; }
var KARTE_RAND = 0.6;
function kartenGrenzen(map, meta, onResize) {
  function minZoom() {
    // Zwischenstufen (zoomSnap 0, stufenlos): sonst rundet Leaflet auf ganze Stufen ab und die Reviere füllen nur die halbe Breite
    var z = map.getBoundsZoom(meta.reviere, false, L.point(0, 0));
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
    stroke: false, fillColor: kartenRandFarbe(), fillOpacity: 1, interactive: false, pane: 'rahmen',
    // eigene Zeichenfläche, die weit über den Bildschirm hinausreicht — sonst blitzt beim Zoomen der helle Kartenrand durch
    renderer: L.svg({ padding: 2, pane: 'rahmen' })
  }).addTo(map);
}

/** Reviergrenzen in Farben der App (statt Standard-Orange/Rot/Blau): Kupfer · Sand · Rost. */
var REVIER_FARBE = { 'XIV/189': '#e0995c', 'XIV/191': '#f0e2bd', 'XIV/192': '#c9685a' };
function revierFarbe(p) { return REVIER_FARBE[p && p.broj] || (p && p.boja) || '#e0995c'; }

var EBENEN_ICON = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linejoin="round" aria-hidden="true"><path d="M12 4l8 4-8 4-8-4zM4 12l8 4 8-4M4 16l8 4 8-4"/></svg>';

var Karta = (function () {
  var esc = UI.esc, t = I18n.t;
  var aktCtx = null; // Kontext der geöffneten Karte (z. B. ?lov=… für die Stände einer Drückjagd)
  var map = null, layers = {}, watchId = null, meMarker = null, meCircle = null, mode = null, focusMarker = null;
  // Beim Öffnen der Karte immer nur die Einrichtungen; Notizen, Strecke und Abteilungen schaltet man bei Bedarf dazu
  var SHOW_START = { objekti: true, biljeske: false, odstrjel: false, odjeli: false };
  var show = Object.assign({}, SHOW_START);

  function saveLayers() {}

  // Gäste: nur Kartenbild (Namen, Wege, Gewässer, Relief) und eigener Standort.
  // Keine Reviergrenzen, Einrichtungen, Abschussorte, Abteilungen, Treffpunkte, kein Eintragen.
  function guest() { return App.isGost(); }

  function render(ctx) {
    var g = guest(), jagd = ctx && ctx.jagd, jl = jagd ? lovNow(ctx.query.lov) : null;
    // Einheitliche Glas-Knöpfe: rechts oben eine Säule (Ebenen · Ortung · Vollbild), links oben der Wind als Plakette,
    // unten rechts nur die eine farbige Hauptaktion „+“. Zoomen mit zwei Fingern (keine +/−-Knöpfe).
    return '<div class="map-wrap' + (jagd ? ' jagdkarte' : '') + '"><div id="map" aria-label="' + esc(t('navKarta')) + '"></div>' +
      (jagd ? '<a class="map-zurueck glass" href="#/lov/' + encodeURIComponent(ctx.query.lov) + '">' + ICONS.back + '<span>' + esc(jl ? (jl.naziv || t('lovDefaultName')) : t('lovoviTitle')) + '</span></a>' : '') +
      '<a class="map-wind glass" id="map-wind" href="#/wetter" hidden></a>' +
      '<div class="map-tools">' +
      (g || jagd ? '' : '<button type="button" class="fab glass" id="fab-layers" aria-label="' + esc(t('mapLayers')) + '">' + EBENEN_ICON + '</button>') +
      '<button type="button" class="fab glass" id="fab-locate" aria-label="' + esc(t('myLocation')) + '">' + ICONS.locate + '</button>' +
      '<button type="button" class="fab glass" id="fab-measure" aria-label="' + esc(t('measure')) + '">' + ICONS.ruler + '</button>' +
      '<button type="button" class="fab glass map-full-btn" id="fab-full" aria-label="' + esc(t('fullscreen')) + '">' + ICONS.expand + '</button></div>' +
      '<div class="map-fab" id="map-fab">' +
      (g || jagd ? '' : '<button type="button" class="fab primary" id="fab-add" aria-label="' + esc(t('addObjekt')) + '">' + ICONS.plus + '</button>') + '</div>' +
      '<div id="map-overlay"></div></div>';
  }

  /**
   * Wind oben rechts als runde Scheibe: in der Mitte die Stärke, am Rand eine Marke an der Seite, aus der der Wind kommt
   * (Fahne zeigt zur Mitte, wie der Wind weht). Kupferpunkt = Norden. Ist die Blickrichtung bekannt (nach „Mein Standort“),
   * dreht sich die Scheibe mit dem Handy: Marke oben = Wind von vorn, unten = von hinten.
   */
  /**
   * Wind als kleine Glas-Plakette oben links: Pfeil zeigt, wohin der Wind weht, daneben Stärke und Richtung.
   * Ist die Blickrichtung bekannt (nach „Mein Standort“), dreht sich der Pfeil mit dem Handy (oben = weht von dir weg).
   */
  function drawWind() {
    var box = document.getElementById('map-wind');
    var c = Wetter.current();
    if (!box) return;
    if (!c || c.wind_direction_10m == null) { box.hidden = true; return; }
    box.hidden = false;
    var von = Wetter.dirName(c.wind_direction_10m, I18n.lang());
    box.setAttribute('aria-label', t('windFrom', { d: von }) + ', ' + Math.round(c.wind_speed_10m) + ' km/h');
    box.innerHTML = '<span class="wind-pfeil"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M12 19V5M7 10l5-5 5 5"/></svg></span>' +
      '<span class="wind-txt"><b>' + Math.round(c.wind_speed_10m) + '</b> km/h<small>' + esc(t('windFrom', { d: von })) + '</small></span>';
    updateCompass();
  }
  function updateCompass() {
    var box = document.getElementById('map-wind'), c = Wetter.current();
    if (!box || !c || c.wind_direction_10m == null) return;
    var h = heading == null ? 0 : heading;
    var pf = box.querySelector('.wind-pfeil svg');
    if (pf) pf.style.transform = 'rotate(' + ((c.wind_direction_10m + 180 - h) % 360).toFixed(1) + 'deg)';
    box.classList.toggle('turning', heading != null);
  }

  /** Ebenen ein- und ausblenden — als Glas-Blatt mit Schaltern (statt abgeschnittener Schalterleiste oben). */
  function openLayers(ctx) {
    var keys = ['objekti', 'biljeske', 'odstrjel', 'odjeli'];
    UI.openSheet('<h2>' + esc(t('mapLayers')) + '</h2><div class="layer-list">' + keys.map(function (k) {
      return '<label class="switch-row"><span>' + esc(t('layer_' + k)) + '</span><input type="checkbox" class="switch" data-layer="' + k + '"' + (show[k] ? ' checked' : '') + '></label>';
    }).join('') + '</div><p class="hint" style="margin:14px 2px 0">' + esc(t('mapSourceLine')) + '</p>', function (el) {
      UI.$$('input[data-layer]', el).forEach(function (inp) {
        inp.onchange = function () {
          var k = inp.getAttribute('data-layer');
          show[k] = inp.checked; saveLayers();
          if (k === 'odjeli') drawOdjeli(); else drawData(ctx);
          if (k === 'odjeli' && show.odjeli) UI.toast(t('odjeliLegend'), { timeout: 6000 });
          ebenenMarke();
        };
      });
    }, { noFocus: true });
  }
  /** Ebenen-Knopf zeigt einen Punkt, wenn etwas außer den Einrichtungen eingeblendet ist. */
  function ebenenMarke() {
    var b = document.getElementById('fab-layers');
    if (b) b.classList.toggle('marked', !!(show.odstrjel || show.odjeli || !show.objekti || show.biljeske));
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
    var jagdId = ctx && ctx.jagd ? ctx.query.lov : null;
    if (!guest() && !jagdId) return; // allgemeine Karte des Teams: keine Treffpunkte (die gehören auf die Jagdkarte)
    var today = UI.todayISO();
    var g = L.layerGroup();
    Store.lovovi().forEach(function (l) {
      if (!(Number(l.sastanakLat) && Number(l.sastanakLon))) return;
      if (jagdId ? l.id !== jagdId : String(l.datum).slice(0, 10) < today) return;
      var m = L.marker([l.sastanakLat, l.sastanakLon], { icon: L.divIcon({ className: '', html: '<div class="meet-marker"></div>', iconSize: [30, 30], iconAnchor: [15, 30] }), zIndexOffset: 900, title: t('gMeeting') });
      m.on('click', function () { if (mode === 'messen') return; openMeet(l); });
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
  var FUSS = { kanzel: 21, leiter: 21, drueckjagdbock: 21, bodensitz: 18, fuetterung: 20, kirrung: 20 };
  // Unterhalb dieser Zoomstufe nur ruhige Punkte statt Symbole — sonst stapeln sich die Hochsitze zu einem Klumpen
  var PUNKT_BIS = 11.5; // Symbole fast immer (klein beim Herauszoomen); Punkte nur in der ganz weiten Übersicht
  function objIcon(o, zoom) {
    var cls = 'obj-marker' + (o.stanje === 'uklonjen' ? ' removed' : '') + (o.stanje === 'popravak' || o.stanje === 'neupotrebljivo' ? ' bad' : '');
    if (zoom != null && zoom <= PUNKT_BIS) return L.divIcon({ className: '', html: '<div class="obj-dot' + (o.art === 'biljeska' ? ' note' : '') + (o.stanje === 'uklonjen' ? ' removed' : '') + '"></div>', iconSize: [12, 12], iconAnchor: [6, 6] });
    var art = ICONS.objekt[o.art] ? o.art : 'kanzel';
    var ay = FUSS[art] ? Math.round(2 + FUSS[art] * 30 / 24) : 17;
    var fussProz = Math.round((ay - 2) / 30 * 100); // Symbol schrumpft zum Standpunkt hin, nicht zur Mitte
    return L.divIcon({ className: '', html: '<div class="' + cls + '" style="position:relative"><img alt="" src="' + ICONS.objekt[art] + '" style="transform-origin:50% ' + fussProz + '%"></div>', iconSize: [34, 34], iconAnchor: [17, ay] });
  }
  /** Symbole werden beim Herauszoomen kleiner statt gleich groß zu bleiben (Zoom 16 → volle Größe, Zoom 13 → 70 %). */
  function symbolGroesse() {
    if (!map) return;
    var z = map.getZoom(), f = Math.max(0, Math.min(1, (z - 12) / 4));
    map.getContainer().style.setProperty('--obj-s', (0.6 + 0.4 * f).toFixed(3));
  }

  function drawData(ctx) {
    if (!map) return;
    ['objekti', 'biljeske', 'odstrjel', 'lovFocus'].forEach(function (k) { if (layers[k]) { map.removeLayer(layers[k]); layers[k] = null; } });
    drawMeet(ctx);
    if (guest()) { drawGastStaende(ctx); return; }
    if (ctx && ctx.jagd) { var jl = lovNow(ctx.query.lov); if (jl) drawStaende(jl, ctx); return; }
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
        m.on('click', function () { if (mode === 'messen') return; Objekti.openDetail(o.id); });
        (notiz ? n : g).addLayer(m);
      });
      if (zeigeObj) layers.objekti = g.addTo(map);
      if (zeigeNotiz) layers.biljeske = n.addTo(map);
    }
    if (lovFocus) drawStaende(lovFocus, ctx);
    if (show.odstrjel) {
      var k = L.layerGroup();
      Stats.inJJ(Store.strecke()).forEach(function (r) {
        if (!(Number(r.lat) && Number(r.lon))) return;
        // Strecke: kupferne Runde mit Wildart-Symbol (deutlich anders als die dunklen Einrichtungen); weit weg nur ein kupferner Punkt
        var nah = map.getZoom() > PUNKT_BIS;
        var m = L.marker([r.lat, r.lon], { icon: L.divIcon({ className: '', html: nah ? '<div class="kill-mark">' + ICONS.forSpecies(r.vrsta) + '</div>' : '<div class="kill-dot"></div>',
          iconSize: nah ? [30, 30] : [14, 14], iconAnchor: nah ? [15, 15] : [7, 7] }), title: Strecke.title(r), zIndexOffset: 500 });
        m.on('click', function () { if (mode === 'messen') return; Strecke.openDetail(r.id); });
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
        onEachFeature: function (f, layer) { layer.on('click', function () { if (mode === 'messen') return; markOdjel(layer); openOdjel(f.properties, layer); }); }
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
    layer.setStyle({ color: akzentFarbe(), weight: 4, opacity: 1, dashArray: null, fillColor: akzentFarbe(), fillOpacity: .3 });
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

  /**
   * Entfernung messen: Fadenkreuz in der Mitte, eine gestrichelte Linie folgt vom letzten Punkt zum Fadenkreuz
   * (Entfernung live beim Verschieben). Punkte nur über „Punkt setzen“ am Fadenkreuz (Antippen der Karte setzt keinen, damit nichts versehentlich dazukommt);
   * mehrere Punkte ergeben einen Weg. Läuft die Ortung, beginnt die Messung am eigenen Standort.
   * Ab drei Punkten schließt ein Punkt am ersten Punkt (Fadenkreuz dort) die Fläche: dann zeigt die
   * Leiste die Fläche (m² bzw. ha) und den Umfang. Zurück öffnet die Fläche wieder.
   */
  var mess = null;
  function fmtDist(m) {
    if (m < 1000) return Math.round(m) + ' m';
    return (m / 1000).toFixed(m < 10000 ? 2 : 1).replace('.', I18n.lang() === 'en' ? '.' : ',') + ' km';
  }
  /** Fläche eines Polygons auf der Kugel (m²) — für Revierflächen genau genug (wie Leaflet.draw). */
  function flaecheM2(pts) {
    var R = 6371008.8, a = 0, rad = Math.PI / 180;
    for (var i = 0; i < pts.length; i++) {
      var p1 = pts[i], p2 = pts[(i + 1) % pts.length];
      a += (p2.lng - p1.lng) * rad * (2 + Math.sin(p1.lat * rad) + Math.sin(p2.lat * rad));
    }
    return Math.abs(a * R * R / 2);
  }
  function fmtFlaeche(m2) {
    var dez = I18n.lang() === 'en' ? '.' : ',';
    if (m2 < 10000) return String(Math.round(m2 / 10) * 10).replace(/\B(?=(\d{3})+(?!\d))/g, I18n.lang() === 'en' ? ',' : '.') + ' m²';
    return (m2 / 10000).toFixed(m2 < 1e6 ? 2 : 1).replace('.', dez) + ' ha';
  }
  function fadenLL() {
    var ov = document.getElementById('map-overlay');
    var p = punktUnterFadenkreuz(map, ov);
    return L.latLng(p.lat, p.lon);
  }
  /* Während des Zoomens (Pinch, Touchpad) skaliert Leaflet die Zeichenfläche nur per CSS; neu zeichnen würde
     dann an der falschen Stelle landen. Deshalb Linien erst nach dem Zoom neu setzen, solange nur die Zahl. */
  function messZoomStart() { if (mess) { mess.zoomt = true; mess.gummi.setStyle({ opacity: 0 }); } }
  function messZoomEnde() { if (mess) { mess.zoomt = false; mess.gummi.setStyle({ opacity: .9 }); messZeichnen(); } }
  function messZeichnen() {
    if (!mess || !map) return;
    if (mess.zoomt) return;
    var pts = mess.punkte, ziel = fadenLL();
    var summe = 0;
    for (var i = 1; i < pts.length; i++) summe += map.distance(pts[i - 1], pts[i]);
    var gross = document.getElementById('mess-gross'), klein = document.getElementById('mess-klein');
    var add = document.querySelector('[data-mess-add]'); if (add) add.disabled = !!mess.zu;
    var u = document.querySelector('[data-mess-undo]'); if (u) u.disabled = !pts.length;
    if (mess.zu) {
      var umfang = summe + map.distance(pts[pts.length - 1], pts[0]);
      mess.linie.setLatLngs(pts.concat([pts[0]]));
      mess.gummi.setLatLngs([]);
      mess.flaeche.setLatLngs(pts);
      if (gross) { gross.textContent = fmtFlaeche(flaecheM2(pts)); klein.textContent = t('measurePerimeter', { d: fmtDist(umfang), n: pts.length }); }
      return;
    }
    mess.flaeche.setLatLngs([]);
    mess.linie.setLatLngs(pts);
    var letzter = pts[pts.length - 1];
    var live = letzter ? map.distance(letzter, ziel) : 0;
    mess.gummi.setLatLngs(letzter ? [letzter, ziel] : []);
    if (!gross) return;
    if (!pts.length) { gross.textContent = '—'; klein.textContent = t('measureStart'); }
    else {
      gross.textContent = fmtDist(summe + live);
      klein.textContent = pts.length > 2 ? t('measureClose') : pts.length > 1 ? t('measureLeg', { d: fmtDist(live), n: pts.length - 1 }) : t('measureFrom', { w: mess.vonMir ? t('measureMe') : t('measurePoint') });
    }
  }
  function messPunkt(ll) {
    if (!mess || mess.zu) return;
    ll = L.latLng(ll);
    // Ab drei Punkten: Punkt nahe dem ersten (≤ 24 px) schließt die Fläche
    if (mess.punkte.length >= 3 && map.latLngToContainerPoint(ll).distanceTo(map.latLngToContainerPoint(mess.punkte[0])) <= 24) {
      mess.zu = true;
      UI.haptic && UI.haptic(14);
      messZeichnen();
      return;
    }
    mess.punkte.push(ll);
    // Erster Punkt wird ab drei Punkten größer — Hinweis: hier schließen
    var erster = mess.kreise.getLayers()[0];
    if (erster && mess.punkte.length >= 3) erster.setRadius(9);
    mess.kreise.addLayer(L.circleMarker(ll, { renderer: mess.renderer, radius: 5, color: '#fff', weight: 2, fillColor: mess.farbe, fillOpacity: 1, interactive: false }));
    UI.haptic && UI.haptic(8);
    messZeichnen();
  }
  function startMessen() {
    if (!map || mode) return;
    mode = 'messen';
    document.body.classList.add('messen');
    var ov = document.getElementById('map-overlay');
    document.getElementById('map-fab').hidden = true;
    var mb = document.getElementById('fab-measure'); if (mb) mb.classList.add('active');
    var messRenderer = L.svg({ padding: 0.5 });
    // Farbe wie die Hauptaktion: hell Weinrot, dunkel Kupfer
    var farbe = akzentFarbe();
    mess = {
      punkte: [], vonMir: false, zoomt: false, renderer: messRenderer, farbe: farbe,
      linie: L.polyline([], { renderer: messRenderer, color: farbe, weight: 3, opacity: 1, interactive: false }).addTo(map),
      gummi: L.polyline([], { renderer: messRenderer, color: farbe, weight: 2, opacity: .9, dashArray: '6 7', interactive: false }).addTo(map),
      kreise: L.layerGroup().addTo(map),
      flaeche: L.polygon([], { renderer: messRenderer, stroke: false, fillColor: farbe, fillOpacity: .2, interactive: false }).addTo(map),
      zu: false
    };
    ov.innerHTML = '<svg class="crosshair" viewBox="0 0 48 48" fill="none" stroke="currentColor" stroke-width="2.4"><circle cx="24" cy="24" r="10"/><path d="M24 2v12M24 34v12M2 24h12M34 24h12"/></svg>' +
      '<div class="mess-bar glass" role="status" aria-live="polite"><div class="mess-wert"><b id="mess-gross">—</b><span id="mess-klein"></span></div>' +
      '<div class="mess-knoepfe">' +
      '<button type="button" class="mess-k" data-mess-undo aria-label="' + esc(t('measureUndo')) + '">' + ICONS.back + '</button>' +
      '<button type="button" class="mess-k haupt" data-mess-add>' + ICONS.plus + '<span>' + esc(t('measureAdd')) + '</span></button>' +
      '<button type="button" class="mess-k" data-mess-end aria-label="' + esc(t('close')) + '">' + ICONS.close + '</button></div></div>';
    // Punkte nur über das Fadenkreuz. Steht es auf einer Einrichtung (≤ 22 px), genau deren Ort nehmen.
    ov.querySelector('[data-mess-add]').onclick = function () {
      var ll = fadenLL(), p = map.latLngToContainerPoint(ll), best = null, bestD = 22;
      ['objekti', 'biljeske', 'odstrjel', 'lovFocus'].forEach(function (k) {
        if (!layers[k] || !layers[k].eachLayer) return;
        layers[k].eachLayer(function (m) {
          if (!m.getLatLng) return;
          var d = map.latLngToContainerPoint(m.getLatLng()).distanceTo(p);
          if (d < bestD) { bestD = d; best = m.getLatLng(); }
        });
      });
      messPunkt(best || ll);
    };
    ov.querySelector('[data-mess-undo]').onclick = function () {
      if (!mess.punkte.length) return;
      if (mess.zu) { mess.zu = false; messZeichnen(); return; }
      mess.punkte.pop();
      var ls = mess.kreise.getLayers(); if (ls.length) mess.kreise.removeLayer(ls[ls.length - 1]);
      if (ls.length && mess.punkte.length < 3) ls[0].setRadius(5);
      if (!mess.punkte.length) mess.vonMir = false;
      messZeichnen();
    };
    ov.querySelector('[data-mess-end]').onclick = endeMessen;
    map.on('move', messZeichnen);
    map.on('zoomstart', messZoomStart);
    map.on('zoomend', messZoomEnde);
    if (meMarker) { mess.vonMir = true; messPunkt(meMarker.getLatLng()); }
    messZeichnen();
  }
  function endeMessen() {
    if (map && mess) { map.off('move', messZeichnen); map.off('zoomstart', messZoomStart); map.off('zoomend', messZoomEnde); map.removeLayer(mess.linie); map.removeLayer(mess.gummi); map.removeLayer(mess.kreise); map.removeLayer(mess.flaeche); }
    mess = null;
    document.body.classList.remove('messen');
    var mb = document.getElementById('fab-measure'); if (mb) mb.classList.remove('active');
    endPlace();
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
    aktCtx = ctx;
    show = Object.assign({}, SHOW_START);
    if (ctx && ctx.query && ctx.query.lat) show.biljeske = true; // Sprung zu einem Ort (z. B. aus einer Mitteilung): Notizen dort nicht verstecken
    var meta;
    try { meta = await (await fetch('map/meta.json')).json(); }
    catch (e) { el.querySelector('#map').innerHTML = UI.emptyState('map', t('mapDataMissing'), t('mapDataMissingText')); return; }
    if (!document.getElementById('map')) return; // inzwischen weiter navigiert
    grenzen = L.latLngBounds(meta.bounds).pad(KARTE_RAND);
    map = L.map('map', { zoomControl: false, attributionControl: true, zoomSnap: 0, wheelPxPerZoomLevel: 45, wheelDebounceTime: 10, bounceAtZoomLimits: false, minZoom: meta.minZoom, maxZoom: 18, maxBounds: grenzen, maxBoundsViscosity: 0.6, preferCanvas: true });
    kartenGrenzen(map, meta, zentrieren);
    rahmenMaske(map, meta);
    L.tileLayer(MapOffline.prefix() + '/{z}/{x}/{y}.jpg', {
      minZoom: meta.minZoom, maxZoom: 18, maxNativeZoom: meta.maxNativeZoom, bounds: meta.bounds,
      attribution: 'Seona Eko · QField-karta (DGU, OSM, HŠ)'
    }).addTo(map);
    // keine +/−-Knöpfe: Zoomen mit zwei Fingern (wie in Karten-Apps)
    // Quellenzeile links unten, damit sie nie den Plus-Knopf (rechts unten) verdeckt
    if (map.attributionControl) map.attributionControl.setPosition('bottomleft');
    touchpadPinch(map);

    var view = null;
    try { view = JSON.parse(sessionStorage.getItem('seona_map_view') || 'null'); } catch (e) {}
    if (ctx.query.lat && ctx.query.lon) {
      var ll = [Number(ctx.query.lat), Number(ctx.query.lon)];
      map.setView(ll, 16);
      focusMarker = L.circleMarker(ll, { radius: 16, color: akzentFarbe(), weight: 3, fill: false }).addTo(map);
    } else if (view) map.setView(view.c, view.z);
    else map.fitBounds(meta.reviere, { padding: [0, 0] });
    map.on('moveend', function () { try { sessionStorage.setItem('seona_map_view', JSON.stringify({ c: map.getCenter(), z: map.getZoom() })); } catch (e) {} });

    if (!guest()) try {
      var rev = await Geo.loadGeo('reviere');
      // dunkle Unterlage + Linie in Revierfarbe: auf heller wie dunkler Karte klar lesbar
      L.geoJSON(rev, { interactive: false, style: { color: '#14110d', weight: 6, opacity: .35, fillOpacity: 0 } }).addTo(map);
      layers.reviere = L.geoJSON(rev, { interactive: false, style: function (f) { return { color: revierFarbe(f.properties), weight: 3, opacity: .95, fillOpacity: 0 }; } }).addTo(map);
    } catch (e) {}
    drawOdjeli();
    drawData(ctx);

    var eb = el.querySelector('#fab-layers');
    if (eb) eb.onclick = function () { openLayers(ctx); };
    ebenenMarke();
    document.body.classList.add('auf-karte');
    drawWind();
    Wetter.refresh();
    el.querySelector('#fab-locate').onclick = function () { locate(); };
    el.querySelector('#fab-measure').onclick = function () { if (mode === 'messen') endeMessen(); else startMessen(); };
    map.on('dragstart', function () { if (follow) setFollow(false); });
    map.on('zoomend', function () {
      zentrieren();
      // Symbole ↔ Punkte nur neu zeichnen, wenn die Schwelle überschritten wird
      var punkte = map.getZoom() <= PUNKT_BIS;
      if (punkte !== map._punkte) { map._punkte = punkte; if (mode !== 'place') drawData(aktCtx || { query: {} }); }
    });
    map._punkte = map.getZoom() <= PUNKT_BIS;
    map.on('zoom', symbolGroesse);
    symbolGroesse();
    el.querySelector('#fab-full').onclick = function () { setFull(!isFull()); };
    var add = el.querySelector('#fab-add');
    if (add) add.onclick = function () { startAdd(); };
    if (ctx.query.meet) focusMeet(ctx.query.meet);
    if (guest()) { offlineBanner(); return; }
    if (ctx.jagd && App.isUprava()) {
      staendeModus(ctx.query.lov);
      if (ctx.query.meet) UI.toast(t('meetPlaceHint'), { timeout: 6000 });
    }
    if (ctx.query.add) startAdd();
    if (ctx.query.move) startMove(ctx.query.move);
    offlineBanner();
  }

  /* ---------------- Drückjagd: Stände ----------------
   * Stände sind eigene Punkte der Jagd (lov.staende: id, nr, lat, lon, strijelac, gostId) — keine Einrichtungen.
   * Team sieht Nummer + Namen; die Jagdleitung setzt Stände mit dem Fadenkreuz und weist per Antippen zu.
   * Gäste bekommen vom Server nur Nummer und Ort (moj = eigener Stand) — keine Namen. */
  function standIcon(nr, cls, label) {
    return L.divIcon({ className: '', iconSize: [30, 30], iconAnchor: [15, 15],
      html: '<div class="stand-pin' + (cls ? ' ' + cls : '') + '">' + esc(String(nr)) + (label ? '<span class="stand-name">' + esc(label) + '</span>' : '') + '</div>' });
  }
  function drawStaende(l, ctx) {
    var g = L.layerGroup(), pts = [];
    LovStaende(l).forEach(function (st) {
      if (!(Number(st.lat) && Number(st.lon))) return;
      pts.push([st.lat, st.lon]);
      var m = L.marker([st.lat, st.lon], { icon: standIcon(st.nr, st.strijelac ? '' : 'frei', st.strijelac || ''), zIndexOffset: 800, title: t('standN', { n: st.nr }) });
      m.on('click', function () { if (mode === 'messen') return; openStand(l.id, st.id); });
      g.addLayer(m);
    });
    layers.lovFocus = g.addTo(map);
    if (Number(l.sastanakLat)) pts.push([l.sastanakLat, l.sastanakLon]);
    if (pts.length && !ctx._fitted) { map.fitBounds(pts, { padding: [70, 70], maxZoom: 16 }); ctx._fitted = true; }
  }
  function drawGastStaende(ctx) {
    if (layers.lovFocus) { map.removeLayer(layers.lovFocus); layers.lovFocus = null; }
    var g = L.layerGroup(), mein = null, heute = UI.todayISO();
    Store.lovovi().forEach(function (l) {
      if (String(l.datum).slice(0, 10) < heute && (!ctx.query || ctx.query.lov !== l.id)) return;
      (l.staende || []).forEach(function (st) {
        if (!(Number(st.lat) && Number(st.lon))) return;
        var m = L.marker([st.lat, st.lon], { icon: standIcon(st.nr, st.moj ? 'mein' : 'frei', st.moj ? t('gYourStand', { n: st.nr }) : ''), zIndexOffset: st.moj ? 950 : 700, interactive: false });
        if (st.moj) mein = [st.lat, st.lon];
        g.addLayer(m);
      });
    });
    layers.lovFocus = g.addTo(map);
    if (mein && ctx.query && ctx.query.lov && !ctx._fitted) { map.setView(mein, 16); ctx._fitted = true; }
  }
  function lovNow(id) { return Store.lovovi().filter(function (x) { return x.id === id; })[0]; }
  async function speichereStaende(l, liste) {
    await Store.queueUpsert('lov', { id: l.id, staende: liste });
    App.syncNow({ quiet: true });
  }
  /** Jagdleitung: Stände mit dem Fadenkreuz setzen (fortlaufend nummeriert). */
  function staendeModus(id) {
    var l = lovNow(id);
    if (!l || !map) return;
    mode = 'staende';
    document.body.classList.add('messen');
    var ov = document.getElementById('map-overlay');
    document.getElementById('map-fab').hidden = true;
    function naechsteNr() { return LovStaende(lovNow(id)).reduce(function (a, x) { return Math.max(a, Number(x.nr) || 0); }, 0) + 1; }
    function leiste() {
      var akt = lovNow(id), list = LovStaende(akt), besetzt = list.filter(function (x) { return x.strijelac; }).length;
      ov.querySelector('[data-st-add] span').textContent = t('standN', { n: naechsteNr() });
      ov.querySelector('#st-info').textContent = (akt.naziv || t('lovDefaultName')) + ' · ' + (list.length ? t('standsSummary', { n: list.length, b: besetzt }) : t('standHint'));
    }
    ov.innerHTML = '<svg class="crosshair" viewBox="0 0 48 48" fill="none" stroke="currentColor" stroke-width="2.4"><circle cx="24" cy="24" r="10"/><path d="M24 2v12M24 34v12M2 24h12M34 24h12"/></svg>' +
      '<div class="mess-bar glass"><div class="mess-wert"><span id="st-info"></span></div><div class="mess-knoepfe">' +
      '<button type="button" class="mess-k haupt" data-st-add>' + ICONS.plus + '<span></span></button>' +
      '<button type="button" class="mess-k" data-st-meet aria-label="' + esc(t('meetSet')) + '" title="' + esc(t('meetSet')) + '">' + ICONS.pin + '</button>' +
      '<button type="button" class="mess-k" data-st-done>' + esc(t('standDone')) + '</button></div></div>';
    ov.querySelector('[data-st-add]').onclick = async function () {
      var p = punktUnterFadenkreuz(map, ov), akt = lovNow(id);
      var liste = LovStaende(akt).concat([{ id: Store.uuid(), nr: naechsteNr(), lat: Math.round(p.lat * 1e6) / 1e6, lon: Math.round(p.lon * 1e6) / 1e6, strijelac: '', gostId: '' }]);
      await speichereStaende(akt, liste);
      UI.haptic && UI.haptic(8);
      leiste();
    };
    ov.querySelector('[data-st-done]').onclick = function () { App.go('#/lov/' + encodeURIComponent(id)); };
    // Treffpunkt: Fadenkreuz auf die Stelle, Stecknadel antippen
    ov.querySelector('[data-st-meet]').onclick = async function () {
      var p = punktUnterFadenkreuz(map, ov);
      await Store.queueUpsert('lov', { id: id, sastanakLat: Math.round(p.lat * 1e6) / 1e6, sastanakLon: Math.round(p.lon * 1e6) / 1e6 });
      App.syncNow({ quiet: true });
      UI.haptic && UI.haptic(8);
      UI.toast(t('meetSaved'));
    };
    leiste();
    Store.onChange && Store.onChange(function () { if (mode === 'staende' && document.getElementById('st-info')) leiste(); });
  }
  /** Stand antippen: gemeinsames Blatt aus lovovi.js (Schütze/Gast zuweisen, Strecke des Stands). */
  function openStand(lovId, standId) { LovStand.open(lovId, standId, { karte: true }); }

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
      ebenenMarke();
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
    document.body.classList.remove('auf-karte');
    if (mode === 'messen') endeMessen();
    if (mode === 'staende') document.body.classList.remove('messen');
    aktCtx = null;
    if (isFull()) setFull(false);
    stopLocate();
    stopHeading();
    if (map) { map.remove(); map = null; }
    layers = {}; meMarker = null; meCircle = null; mode = null; focusMarker = null; follow = false; grenzen = null;
  }

  /** Eigene Karte einer Drückjagd (#/lovkarta/<id>): nur Stände und Treffpunkt, Zurück führt zur Jagd. */
  function jagdCtx(ctx) { ctx.jagd = true; ctx.query = Object.assign({}, ctx.query, { lov: decodeURIComponent(ctx.params[0] || '') }); return ctx; }
  App.route('lovkarta', {
    nav: 'lovovi', full: true, live: false,
    render: function (ctx) { return render(jagdCtx(ctx)); },
    mount: function (el, ctx) { return mount(el, ctx.jagd ? ctx : jagdCtx(ctx)); },
    unmount: unmount,
    onData: function () { if (map && mode !== 'place') drawData(aktCtx || { query: {} }); }
  });

  App.route('karta', {
    nav: 'karta', full: true, live: false,
    render: render, mount: mount, unmount: unmount,
    onData: function () { if (map && mode !== 'place') drawData(aktCtx || { query: {} }); }
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
      var map = L.map('picker-map', { zoomControl: false, zoomSnap: 0, wheelPxPerZoomLevel: 45, wheelDebounceTime: 10, bounceAtZoomLimits: false, minZoom: meta.minZoom, maxZoom: 18, maxBounds: L.latLngBounds(meta.bounds).pad(KARTE_RAND), maxBoundsViscosity: 0.6, attributionControl: false });
      touchpadPinch(map);
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
      else map.fitBounds(meta.reviere, { padding: [0, 0] });
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
