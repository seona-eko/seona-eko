/**
 * Hinweise: was andere im Revier geändert haben (neues Stück, Entnahme, Gast-Termin, Objekt neu/verschoben,
 * Drückjagd). Eigene Änderungen stehen schon im alten Stand → kein Hinweis. Gäste bekommen keine.
 *
 * - Banner: oben unter der Statusleiste, 5 s, kein Ton. Antippen öffnet den Eintrag, nach oben wischen schließt.
 *   Mehrere auf einmal → ein Sammel-Banner, Antippen öffnet die Mitteilungen.
 * - Mitteilungen (Glocke oben rechts, Kupferpunkt = ungelesen): letzte 7 Tage, bleiben ungelesen, bis man sie
 *   antippt, zur Seite wischt oder „Alle gelesen“ drückt. Gespeichert nur auf diesem Gerät (DB 'hinweise').
 * - Neue App-Version: eigenes Banner, bleibt stehen bis Antippen (aktualisiert) oder Wegwischen.
 */
var Hinweis = (function () {
  var esc = function (s) { return UI.esc(s); };
  var t = function (k, p) { return I18n.t(k, p); };
  var TAGE = 7, MAX = 60;
  var liste = [];           // gespeicherte Mitteilungen, neueste zuerst
  var geladen = null;
  var el = null, timer = null;

  function byId(list) { var m = {}; (list || []).forEach(function (r) { m[r.id] = r; }); return m; }
  function wer(rec) { return String(rec && rec.updatedBy || '').replace(/^Aplikacija\s*·?\s*/, '').trim(); }
  function zeitText(ts) {
    if (!ts) return '';
    var min = Math.round((Date.now() - ts) / 60000);
    if (min < 2) return t('hwJetzt');
    if (min < 60) return t('hwMin', { n: min });
    return UI.fmtStamp(ts);
  }
  function frisch(d) { var n = UI.daysSince(String(d || '').slice(0, 10)); return n == null || n <= 14; }
  function objName(o) { return I18n.objekt(o.art) + (o.broj ? ' ' + o.broj : '') + (o.naziv ? ' · ' + o.naziv : ''); }
  function stueck(r) { return Strecke.title(r) + (r.tezina ? ', ' + r.tezina + ' kg' : ''); }

  /** Änderungen zwischen zwei Abrufen (prev = alter Stand) als speicherbare Mitteilungen. */
  function aenderungen(prev, next) {
    var out = [], jetzt = Date.now();
    if (!prev || !next) return out;
    var pS = byId(prev.strecke), pW = byId(prev.wildbret), pA = byId(prev.ansitzi), pO = byId(prev.objekti), pL = byId(prev.lovovi);
    var nS = byId(next.strecke);
    function add(h) { h.at = Number(h.ts) || jetzt; out.push(h); }
    (next.strecke || []).forEach(function (r) {
      if (pS[r.id] || r.deleted || !frisch(r.datum)) return;
      add({ id: 'odstrjel:' + r.id, icon: ICONS.forSpecies(r.vrsta), kat: t('hwStrecke'), wer: r.lovac || wer(r), ts: r.updatedAt,
        titel: t('hwNeu', { t: stueck(r) }), sub: [Strecke.shortLov(r.lokacija), I18n.nacin(r.nacinLova)].filter(Boolean).join(' · '),
        ziel: { go: '#/odstrjel', strecke: r.id } });
    });
    (next.wildbret || []).forEach(function (w) {
      var alt = pW[w.id];
      if (!w.predanoDatum || !alt || alt.predanoDatum) return;
      var r = nS[w.id];
      add({ id: 'izlaz:' + w.id, icon: ICONS.cold, kat: t('hwKuehl'), wer: wer(w), ts: w.updatedAt,
        titel: t('hwOut', { t: r ? stueck(r) : t('unknownPiece') }), sub: [w.izlaz ? t('izlaz_' + w.izlaz) : '', w.kupac].filter(Boolean).join(' · '),
        ziel: { go: '#/hladnjaca' } });
    });
    var gosti = byId(next.gosti);
    (next.ansitzi || []).forEach(function (a) {
      if (pA[a.id] || a.deleted) return;
      var g = gosti[a.gostId];
      add({ id: 'ansitz:' + a.id, icon: ICONS.calendar, kat: t('hwGaeste'), wer: wer(a), ts: a.updatedAt,
        titel: t('hwTermin', { n: g ? g.ime : '' }).replace(/:\s*$/, ''), sub: [UI.fmtDay(a.datum), a.ceka].filter(Boolean).join(' · '),
        ziel: { go: g ? '#/gosti/' + encodeURIComponent(g.id) : '#/gosti' } });
    });
    (next.objekti || []).forEach(function (o) {
      if (o.deleted) return;
      var alt = pO[o.id], ziel = { go: '#/karta?lat=' + o.lat + '&lon=' + o.lon };
      if (!alt) {
        add({ id: 'objekt:' + o.id, icon: ICONS.seat, kat: t('hwKarte'), wer: wer(o), ts: o.updatedAt, titel: t('hwObjNeu', { o: objName(o) }), sub: Strecke.shortLov(o.lokacija), ziel: ziel });
        return;
      }
      var m = Math.hypot((Number(o.lat) - Number(alt.lat)) * 111320, (Number(o.lon) - Number(alt.lon)) * 111320 * Math.cos(Number(o.lat) * Math.PI / 180));
      if (Number(alt.lat) && Number(o.lat) && m >= 5) {
        add({ id: 'objekt:' + o.id + ':' + o.lat + ',' + o.lon, icon: ICONS.seat, kat: t('hwKarte'), wer: wer(o), ts: o.updatedAt,
          titel: t('hwObjMove', { o: objName(o) }), sub: t('hwObjMoveSub', { m: Math.round(m) }), ziel: ziel });
      }
    });
    (next.lovovi || []).forEach(function (l) {
      if (pL[l.id] || l.deleted) return;
      add({ id: 'lov:' + l.id, icon: ICONS.group, kat: t('hwLovovi'), wer: wer(l), ts: l.updatedAt,
        titel: t('hwLov', { n: l.naziv || UI.fmtDay(l.datum) }), sub: Strecke.shortLov(l.lokacija),
        ziel: { go: '#/lov/' + encodeURIComponent(l.id) } });
    });
    return out;
  }

  /* ---------------- Speicher ---------------- */

  function laden() {
    if (!geladen) geladen = DB.get('hinweise').then(function (l) { liste = Array.isArray(l) ? l : []; aufraeumen(); }).catch(function () { liste = []; });
    return geladen;
  }
  function aufraeumen() {
    var grenze = Date.now() - TAGE * 864e5;
    liste = liste.filter(function (h) { return h.at >= grenze; }).sort(function (a, b) { return b.at - a.at; }).slice(0, MAX);
  }
  function speichern() { aufraeumen(); glocke(); return DB.set('hinweise', liste).catch(function () {}); }
  function ungelesen() { return liste.filter(function (h) { return !h.gelesen; }).length; }
  function markieren(ids) {
    var m = {}; ids.forEach(function (id) { m[id] = 1; });
    liste.forEach(function (h) { if (m[h.id]) h.gelesen = true; });
    return speichern();
  }

  /* ---------------- Glocke oben ---------------- */

  /** Alle Glocken (Kopfzeile breit, Startseite am Handy) auf den Stand bringen. */
  function glocke() {
    if (!document.querySelectorAll) return;
    var team = typeof App !== 'undefined' && App.role && App.role() && App.role() !== 'gost';
    var n = ungelesen();
    Array.prototype.forEach.call(document.querySelectorAll('.hw-glocke'), function (b) {
      b.hidden = !team;
      b.classList.toggle('neu', n > 0);
      b.setAttribute('aria-label', t('hwCenter') + (n ? ' · ' + n : ''));
    });
  }

  /* ---------------- Anzeige ---------------- */

  function karteHtml(h) {
    return '<span class="hw-icon">' + h.icon + '</span><span class="hw-text">' +
      '<span class="hw-kopf"><span>' + esc([h.wer, h.kat].filter(Boolean).join(' · ')) + '</span><span>' + esc(h.zeitText != null ? h.zeitText : zeitText(h.ts || h.at)) + '</span></span>' +
      '<b>' + esc(h.titel) + '</b>' + (h.sub ? '<span class="hw-sub">' + esc(h.sub) + '</span>' : '') + '</span>';
  }

  function oeffnen(h) {
    if (typeof h.ziel === 'function') { h.ziel(); return; }
    var z = h.ziel || {};
    if (z.go) App.go(z.go);
    if (z.strecke) setTimeout(function () { Strecke.openDetail(z.strecke); }, 350);
  }

  /** Mitteilungen: Liste der letzten 7 Tage; wischen = gelesen, antippen = gelesen + öffnen. */
  function center() {
    laden().then(function () {
      var html = '<div class="hw-center-kopf"><h2>' + esc(t('hwCenter')) + '</h2>' +
        (ungelesen() ? '<button type="button" class="link" data-alle>' + esc(t('hwAlleGelesen')) + '</button>' : '') + '</div>' +
        (liste.length ? '<p class="sheet-sub">' + esc(t('hwCenterHint')) + '</p><div class="panel flush"><ul class="list hw-liste">' + liste.map(function (h, i) {
          return '<li><button type="button" class="row hw-row' + (h.gelesen ? ' gelesen' : '') + '" data-i="' + i + '"><i class="hw-punkt" aria-hidden="true"></i>' + karteHtml(h) + '</button></li>';
        }).join('') + '</ul></div>'
          : '<div class="panel">' + UI.emptyState('check', t('hwLeer'), t('hwLeerText')) + '</div>');
      UI.openSheet(html, function (sheet, api) {
        var alle = sheet.querySelector('[data-alle]');
        if (alle) alle.onclick = function () {
          markieren(liste.map(function (h) { return h.id; }));
          UI.$$('.hw-row', sheet).forEach(function (r) { r.classList.add('gelesen'); });
          alle.remove();
        };
        UI.$$('.hw-row', sheet).forEach(function (row) {
          var h = liste[Number(row.getAttribute('data-i'))];
          var x0 = null, y0 = null, dx = 0, quer = null;
          row.addEventListener('touchstart', function (e) { x0 = e.touches[0].clientX; y0 = e.touches[0].clientY; dx = 0; quer = null; row.style.transition = 'none'; }, { passive: true });
          row.addEventListener('touchmove', function (e) {
            if (x0 == null) return;
            var mx = e.touches[0].clientX - x0, my = e.touches[0].clientY - y0;
            if (quer == null && (Math.abs(mx) > 8 || Math.abs(my) > 8)) quer = Math.abs(mx) > Math.abs(my);
            if (!quer) return;
            dx = mx; row.style.transform = 'translateX(' + dx + 'px)';
          }, { passive: true });
          row.addEventListener('touchend', function () {
            x0 = null;
            row.style.transition = 'transform .3s cubic-bezier(.22,1,.36,1)';
            row.style.transform = '';
            if (quer && Math.abs(dx) > 70 && !h.gelesen) { row.classList.add('gelesen'); markieren([h.id]); UI.haptic && UI.haptic(8); }
          });
          row.onclick = function () {
            if (quer && Math.abs(dx) > 8) return;
            markieren([h.id]); api.close(); setTimeout(function () { oeffnen(h); }, 260);
          };
        });
      }, { noFocus: true });
    });
  }

  function weg() {
    clearTimeout(timer);
    if (!el) return;
    var e = el; el = null;
    e.classList.remove('an');
    setTimeout(function () { if (e.parentNode) e.parentNode.removeChild(e); }, 450);
  }

  function banner(h, opts) {
    opts = opts || {};
    if (!document.body || !document.createElement) return;
    weg();
    var b = document.createElement('button');
    b.type = 'button'; b.className = 'hw-banner' + (opts.sticky ? ' sticky' : ''); b.setAttribute('role', 'status');
    b.innerHTML = karteHtml(h);
    document.body.appendChild(b);
    el = b;
    requestAnimationFrame(function () { requestAnimationFrame(function () { b.classList.add('an'); }); });
    var startY = null, dy = 0;
    b.addEventListener('touchstart', function (e) { startY = e.touches[0].clientY; dy = 0; clearTimeout(timer); b.style.transition = 'none'; }, { passive: true });
    b.addEventListener('touchmove', function (e) { if (startY == null) return; dy = Math.min(0, e.touches[0].clientY - startY); b.style.transform = 'translateY(' + dy + 'px)'; }, { passive: true });
    b.addEventListener('touchend', function () {
      b.style.transition = ''; b.style.transform = '';
      startY = null;
      if (dy < -25) { weg(); return; }
      if (!opts.sticky) timer = setTimeout(weg, 4000);
    });
    b.onclick = function () { if (dy < -5) return; weg(); opts.onTap(); };
    if (!opts.sticky) timer = setTimeout(weg, 5000);
  }

  /** Von Store nach jedem Abruf aufgerufen. */
  function vergleich(prev, next) {
    try {
      if (typeof App === 'undefined' || !App.role || !App.role() || App.role() === 'gost') return;
      var neu = aenderungen(prev, next);
      if (!neu.length) return;
      laden().then(function () {
        var da = byId(liste);
        neu = neu.filter(function (h) { return !da[h.id]; });
        if (!neu.length) return;
        liste = neu.concat(liste);
        speichern();
        if (neu.length === 1) {
          banner(neu[0], { onTap: function () { markieren([neu[0].id]); oeffnen(neu[0]); } });
        } else {
          banner({ icon: ICONS.bell, kat: '', wer: t('hwSammelWer'), zeitText: '', titel: t('hwSammel', { n: neu.length }),
            sub: neu.slice(0, 2).map(function (x) { return x.titel; }).join(' · ') + (neu.length > 2 ? ' …' : '') }, { onTap: center });
        }
      });
    } catch (e) { if (window.console) console.error(e); }
  }

  /** Neue App-Version bereit: bleibt stehen, bis man tippt (aktualisiert) oder nach oben wischt. */
  function update(onTap) {
    banner({ icon: ICONS.sync, kat: '', wer: 'Seona Eko', zeitText: '', titel: t('hwUpdate'), sub: t('hwUpdateSub') }, { sticky: true, onTap: onTap });
  }

  /** Beim Start: Glocke verdrahten, Stand laden. */
  function start() {
    document.addEventListener('click', function (e) { if (e.target.closest && e.target.closest('.hw-glocke')) center(); });
    var kopf = document.getElementById('hw-glocke');
    if (kopf) kopf.innerHTML = ICONS.bell + '<i aria-hidden="true"></i>';
    laden().then(glocke);
  }

  return { vergleich: vergleich, aenderungen: aenderungen, update: update, center: center, glocke: glocke, start: start };
})();
