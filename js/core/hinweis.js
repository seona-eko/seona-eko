/**
 * Hinweis-Banner: zeigt nach einem Abruf, was andere im Revier geändert haben (neues Stück, Entnahme,
 * Gast-Termin, Objekt neu/verschoben, Drückjagd). Eigene Änderungen stehen schon im alten Stand → kein Banner.
 * Ruhig: oben unter der Statusleiste, 5 s, kein Ton. Antippen öffnet den Eintrag, nach oben wischen schließt.
 * Mehrere Änderungen auf einmal → ein Sammel-Banner; Antippen zeigt die Liste.
 * Gäste bekommen keine Banner.
 */
var Hinweis = (function () {
  var esc = function (s) { return UI.esc(s); };
  var t = function (k, p) { return I18n.t(k, p); };
  var el = null, timer = null;

  function byId(list) { var m = {}; (list || []).forEach(function (r) { m[r.id] = r; }); return m; }
  function wer(rec) { return String(rec && rec.updatedBy || '').replace(/^Aplikacija\s*·?\s*/, '').trim(); }
  function zeit(rec) {
    var ts = Number(rec && rec.updatedAt);
    if (!ts) return '';
    var min = Math.round((Date.now() - ts) / 60000);
    return min < 2 ? t('hwJetzt') : min < 60 ? t('hwMin', { n: min }) : '';
  }
  function frisch(d) { var n = UI.daysSince(String(d || '').slice(0, 10)); return n == null || n <= 14; }
  function objName(o) { return I18n.objekt(o.art) + (o.broj ? ' ' + o.broj : '') + (o.naziv ? ' · ' + o.naziv : ''); }

  /** Liste der Änderungen zwischen zwei Abrufen (prev = alter Stand). */
  function aenderungen(prev, next) {
    var out = [];
    if (!prev || !next) return out;
    var pS = byId(prev.strecke), pW = byId(prev.wildbret), pA = byId(prev.ansitzi), pO = byId(prev.objekti), pL = byId(prev.lovovi);
    var nS = byId(next.strecke);
    (next.strecke || []).forEach(function (r) {
      if (pS[r.id] || r.deleted || !frisch(r.datum)) return;
      out.push({ icon: ICONS.forSpecies(r.vrsta), kat: t('hwStrecke'), wer: r.lovac || wer(r), zeit: zeit(r),
        titel: t('hwNeu', { t: Strecke.title(r) + (r.tezina ? ', ' + r.tezina + ' kg' : '') }),
        sub: [Strecke.shortLov(r.lokacija), I18n.nacin(r.nacinLova)].filter(Boolean).join(' · '),
        ziel: function () { App.go('#/odstrjel'); setTimeout(function () { Strecke.openDetail(r.id); }, 350); } });
    });
    (next.wildbret || []).forEach(function (w) {
      var alt = pW[w.id];
      if (!w.predanoDatum || (alt && alt.predanoDatum) || !alt) return;
      var r = nS[w.id];
      out.push({ icon: ICONS.cold, kat: t('hwKuehl'), wer: wer(w), zeit: zeit(w),
        titel: t('hwOut', { t: r ? Strecke.title(r) + (r.tezina ? ', ' + r.tezina + ' kg' : '') : t('unknownPiece') }),
        sub: [w.izlaz ? t('izlaz_' + w.izlaz) : '', w.kupac].filter(Boolean).join(' · '),
        ziel: function () { App.go('#/hladnjaca'); } });
    });
    var gosti = byId(next.gosti);
    (next.ansitzi || []).forEach(function (a) {
      if (pA[a.id] || a.deleted) return;
      var g = gosti[a.gostId];
      out.push({ icon: ICONS.calendar, kat: t('hwGaeste'), wer: wer(a), zeit: zeit(a),
        titel: t('hwTermin', { n: g ? g.ime : '' }).replace(/:\s*$/, ''),
        sub: [UI.fmtDay ? UI.fmtDay(a.datum) : a.datum, a.ceka].filter(Boolean).join(' · '),
        ziel: function () { App.go(g ? '#/gosti/' + encodeURIComponent(g.id) : '#/gosti'); } });
    });
    (next.objekti || []).forEach(function (o) {
      if (o.deleted) return;
      var alt = pO[o.id];
      var ziel = function () { App.go('#/karta?lat=' + o.lat + '&lon=' + o.lon); };
      if (!alt) {
        out.push({ icon: ICONS.seat, kat: t('hwKarte'), wer: wer(o), zeit: zeit(o), titel: t('hwObjNeu', { o: objName(o) }), sub: Strecke.shortLov(o.lokacija), ziel: ziel });
        return;
      }
      var m = Math.hypot((Number(o.lat) - Number(alt.lat)) * 111320, (Number(o.lon) - Number(alt.lon)) * 111320 * Math.cos(Number(o.lat) * Math.PI / 180));
      if (Number(alt.lat) && Number(o.lat) && m >= 5) {
        out.push({ icon: ICONS.seat, kat: t('hwKarte'), wer: wer(o), zeit: zeit(o), titel: t('hwObjMove', { o: objName(o) }), sub: t('hwObjMoveSub', { m: Math.round(m) }), ziel: ziel });
      }
    });
    (next.lovovi || []).forEach(function (l) {
      if (pL[l.id] || l.deleted) return;
      out.push({ icon: ICONS.group, kat: t('hwLovovi'), wer: wer(l), zeit: zeit(l),
        titel: t('hwLov', { n: l.naziv || UI.fmtDay(l.datum) }), sub: Strecke.shortLov(l.lokacija),
        ziel: function () { App.go('#/lov/' + encodeURIComponent(l.id)); } });
    });
    return out;
  }

  function karteHtml(h) {
    return '<span class="hw-icon">' + h.icon + '</span><span class="hw-text">' +
      '<span class="hw-kopf"><span>' + esc([h.wer, h.kat].filter(Boolean).join(' · ')) + '</span><span>' + esc(h.zeit || '') + '</span></span>' +
      '<b>' + esc(h.titel) + '</b>' + (h.sub ? '<span class="hw-sub">' + esc(h.sub) + '</span>' : '') + '</span>';
  }

  function weg() {
    clearTimeout(timer);
    if (!el) return;
    var e = el; el = null;
    e.classList.remove('an');
    setTimeout(function () { if (e.parentNode) e.parentNode.removeChild(e); }, 450);
  }

  function liste(items) {
    UI.openSheet('<h2>' + esc(t('hwSammel', { n: items.length })) + '</h2><div class="panel flush"><ul class="list">' +
      items.map(function (h, i) { return '<li><button type="button" class="row hw-row" data-i="' + i + '">' + karteHtml(h) + '</button></li>'; }).join('') +
      '</ul></div>', function (sheet, api) {
      UI.$$('[data-i]', sheet).forEach(function (b) {
        b.onclick = function () { api.close(); var h = items[Number(b.getAttribute('data-i'))]; setTimeout(h.ziel, 260); };
      });
    }, { noFocus: true });
  }

  function zeigen(items, opts) {
    opts = opts || {};
    if (!items.length || !document.body || !document.createElement) return;
    weg();
    var h = items.length === 1 ? items[0] : {
      icon: ICONS.list, kat: '', wer: t('hwSammelWer'), zeit: '', titel: t('hwSammel', { n: items.length }),
      sub: items.slice(0, 2).map(function (x) { return x.titel; }).join(' · ') + (items.length > 2 ? ' …' : ''),
      ziel: function () { liste(items); }
    };
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
    b.onclick = function () { if (dy < -5) return; weg(); h.ziel(); };
    if (!opts.sticky) timer = setTimeout(weg, 5000);
  }

  /** Von Store nach jedem Abruf aufgerufen. */
  function vergleich(prev, next) {
    try {
      if (typeof App === 'undefined' || !App.role || App.role() === 'gost' || !App.role()) return;
      zeigen(aenderungen(prev, next));
    } catch (e) { if (window.console) console.error(e); }
  }

  /** Neue App-Version bereit: bleibt stehen, bis man tippt (aktualisiert) oder nach oben wischt. */
  function update(onTap) {
    zeigen([{ icon: ICONS.sync, kat: '', wer: 'Seona Eko', zeit: '', titel: t('hwUpdate'), sub: t('hwUpdateSub'), ziel: onTap }], { sticky: true });
  }

  return { vergleich: vergleich, aenderungen: aenderungen, update: update };
})();
