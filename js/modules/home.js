/** Startseite: „Was ist heute los im Revier?" — Schnellaktionen und die wichtigsten Kennzahlen. */
(function () {
  var esc = UI.esc, t = I18n.t;
  var CENTER = [45.452, 17.957]; // Mitte der drei Lovišta (map/meta.json)

  function coldStats() {
    var wb = Store.wildbret();
    var list = Object.keys(wb).map(function (k) { return wb[k]; }).filter(function (w) { return w.hladnjacaOd && !w.predanoDatum; });
    var old = list.filter(function (w) { return UI.daysSince(String(w.hladnjacaOd).slice(0, 10)) >= 7; }).length;
    var pos = list.filter(function (w) { return w.aspNalaz === 'pozitivan'; }).length;
    var byId = {}; Store.strecke().forEach(function (r) { byId[r.id] = r; });
    var notSent = 0, sent = 0;
    list.forEach(function (w) { var s = Hladnjaca.stage(w, byId[w.id]).key; if (s === 'noSample' || s === 'notSent') notSent++; if (s === 'sent') sent++; });
    return { n: list.length, old: old, pos: pos, notSent: notSent, sent: sent };
  }

  /** Je Wildart: was heute offen ist (alle Klassen → „alles“). Wildarten ohne offene Klasse fallen weg. */
  function openToday() {
    var today = UI.todayISO();
    var out = [];
    LOVOSTAJ.groups.forEach(function (g) {
      if (g.vrsta === 'Ostalo') return;
      var rows = g.rows.filter(function (r) { return Lovostaj.isOpen(r, today); });
      if (rows.length) out.push({ g: g, rows: rows, all: rows.length === g.rows.length });
    });
    return out;
  }

  /** Nächster Ansitz-Termin eines Gastes (ab heute); sonst der nächste ankommende Gast. */
  function nextGast() {
    var today = UI.todayISO();
    var gosti = Store.gosti();
    function byId(id) { return gosti.filter(function (g) { return g.id === id; })[0]; }
    var a = Store.ansitzi().filter(function (x) { return String(x.datum).slice(0, 10) >= today && byId(x.gostId); })
      .sort(function (x, y) { return String(x.datum).localeCompare(String(y.datum)); })[0];
    if (a) return { g: byId(a.gostId), sub: [UI.fmtDay(String(a.datum).slice(0, 10)), a.polazak, a.ceka].filter(Boolean).join(' · ') };
    var g = gosti.filter(function (x) { return String(x.od || '').slice(0, 10) >= today; })
      .sort(function (x, y) { return String(x.od).localeCompare(String(y.od)); })[0];
    return g ? { g: g, sub: UI.fmtDay(String(g.od).slice(0, 10)) + (g.do ? ' – ' + UI.fmtDay(String(g.do).slice(0, 10)) : '') } : null;
  }

  App.route('home', {
    nav: 'home',
    render: function () {
      var today = new Date();
      var sun = Geo.sunTimes(today, CENTER[0], CENTER[1]);
      var s = Stats.summary('all');
      var c = coldStats();
      var open = openToday();
      var jj = Store.jagdjahr();
      var next = Store.lovovi().filter(function (l) { return String(l.datum).slice(0, 10) >= UI.todayISO(); })[0];
      var recent = s.list.slice(0, 3);
      var errors = Store.outbox().filter(function (e) { return e.status === 'error'; }).length;
      // Seit über einem Tag nicht gesendet (z. B. Handy nie mit Netz geöffnet) — nicht nur oben rechts klein anzeigen
      var stale = Store.outbox().filter(function (e) { return e.status !== 'error' && Date.now() - e.createdAt > 864e5; }).length;
      var gast = nextGast();
      // SLE: Wildmarken binnen 7 Tagen austragen — Hinweis, solange etwas offen ist (dringend ab 1 Tag Rest)
      var sle = App.isUprava() ? Strecke.sleOpen(Stats.inJJ(Store.strecke())) : [];
      var sleMin = sle.length ? Strecke.sleInfo(sle[0]).left : null;

      var pct = function (a, b) { return b ? Math.min(100, Math.round(a / b * 100)) : 0; };

      return '<div class="page-head"><div class="eyebrow">' + esc(UI.fmtLong(today)) + ' · ' + esc(t('huntYear')) + ' ' + esc(jj.label) + '</div>' +
        '<h1>' + esc(t('homeTitle')) + '</h1>' +
        '<p>' + WetterUI.sun(today) + '</p></div>' +

        (errors ? '<a class="panel" href="#/vise?sync=1" style="display:flex;gap:10px;align-items:center;border-color:var(--warn);background:var(--warn-soft);text-decoration:none;color:inherit;margin-bottom:12px">' +
          ICONS.alert.replace('<svg', '<svg style="width:24px;height:24px;color:var(--warn);flex:none"') + '<span><b>' + esc(t('homeErrors', { n: errors })) + '</b><br><span class="hint">' + esc(t('homeErrorsHint')) + '</span></span></a>' : '') +
        (stale ? '<a class="panel" href="#/vise?sync=1" style="display:flex;gap:10px;align-items:center;border-color:var(--warn);background:var(--warn-soft);text-decoration:none;color:inherit;margin-bottom:12px">' +
          ICONS.sync.replace('<svg', '<svg style="width:24px;height:24px;color:var(--warn);flex:none"') + '<span><b>' + esc(t('homeStale', { n: stale })) + '</b><br><span class="hint">' + esc(t('homeStaleHint')) + '</span></span></a>' : '') +

        (sle.length ? '<a class="panel" href="#/odstrjel?tab=popis&sle=1" style="display:flex;gap:10px;align-items:center;text-decoration:none;color:inherit;margin-bottom:12px' +
          (sleMin <= 1 ? ';border-color:var(--warn);background:var(--warn-soft)' : '') + '">' +
          ICONS.list.replace('<svg', '<svg style="width:24px;height:24px;flex:none' + (sleMin <= 1 ? ';color:var(--warn)' : '') + '"') + '<span><b>' + esc(t('homeSle', { n: sle.length })) + '</b><br><span class="hint">' +
          esc(sleMin > 0 ? t('homeSleHint', { n: sleMin }) : sleMin === 0 ? t('homeSleToday') : t('homeSleLate')) + '</span></span></a>' : '') +

        '<div class="quick">' +
        '<a class="primary" href="#/odstrjel/novi">' + ICONS.plus + '<span><b>' + esc(t('newOdstrjel')) + '</b></span></a>' +
        '<a class="secondary" href="#/karta?add=1">' + ICONS.pin + '<span>' + esc(t('quickObjekt')) + '</span></a>' +
        '<a class="secondary" href="#/lovostaj">' + ICONS.calendar + '<span>' + esc(t('quickLovostaj')) + '</span></a>' +
        '</div>' +

        '<div style="margin-top:12px">' + WetterUI.tile() + '</div>' +
        '<div class="grid-2" style="margin-top:12px">' +
        '<a class="tile" href="#/odstrjel"><div class="t-label">' + ICONS.list + esc(t('tileStrecke')) + '</div>' +
        '<div class="t-value">' + s.ist + ' <small>/ ' + s.soll + '</small></div>' +
        '<div class="bar"><span style="width:' + pct(s.ist, s.soll) + '%"></span></div>' +
        '<div class="t-sub">' + esc(s.pending ? t('pendingN', { n: s.pending }) : t('tileStreckeSub')) + '</div></a>' +
        '<a class="tile' + (c.old || c.pos ? ' warn' : '') + '" href="#/hladnjaca"><div class="t-label">' + ICONS.cold + esc(t('tileCold')) + '</div>' +
        '<div class="t-value">' + c.n + '</div>' +
        '<div class="t-sub">' + esc(c.pos ? t('aspPositiveShort') : c.old ? t('coldOld', { n: c.old }) : (c.notSent || c.sent) ? t('aspTileLine', { a: c.notSent, b: c.sent }) : t('tileColdSub')) + '</div></a>' +
        '</div>' +

        '<div class="section-title"><h2>' + esc(t('openToday')) + '</h2><a href="#/lovostaj">' + esc(t('allSeasons')) + '</a></div>' +
        (open.length ? '<div class="panel flush"><ul class="list open-list">' + open.map(function (o) {
          return '<li><div class="row"><span class="r-icon">' + ICONS.forSpecies(o.g.vrsta) + '</span><span class="r-main"><span class="r-title">' + esc(t(o.g.key)) + '</span></span>' +
            '<span class="open-what">' + esc(o.all ? t('openAll') : o.rows.map(function (r) { return t(r.key); }).join(' · ')) + '</span></div></li>';
        }).join('') + '</ul></div>' : '<div class="panel"><span class="hint">' + esc(t('nothingOpen')) + '</span></div>') +

        // Nächste Drückjagd und nächster Gast — nur, wenn etwas ansteht
        (next ? '<div class="section-title"><h2>' + esc(t('nextLov')) + '</h2><a href="#/lovovi">' + esc(t('all')) + '</a></div>' +
          '<div class="panel flush"><ul class="list"><li><a class="row" href="#/lov/' + esc(next.id) + '"><span class="r-icon">' + ICONS.group + '</span>' +
          '<span class="r-main"><span class="r-title">' + esc(next.naziv || t('lovDefaultName')) + '</span><span class="r-sub">' + esc(UI.fmtDay(next.datum) + ' · ' + Strecke.shortLov(next.lokacija)) + '</span></span>' + ICONS.chevron.replace('<svg', '<svg class="chev"') + '</a></li></ul></div>' : '') +
        (gast ? '<div class="section-title"><h2>' + esc(t('nextGuest')) + '</h2><a href="#/gosti">' + esc(t('all')) + '</a></div>' +
          '<div class="panel flush"><ul class="list"><li><a class="row" href="#/gosti/' + encodeURIComponent(gast.g.id) + '"><span class="r-icon">' + ICONS.qr + '</span>' +
          '<span class="r-main"><span class="r-title">' + esc(gast.g.ime) + '</span><span class="r-sub">' + esc(gast.sub) + '</span></span>' + ICONS.chevron.replace('<svg', '<svg class="chev"') + '</a></li></ul></div>' : '') +

        (recent.length ? '<div class="section-title"><h2>' + esc(t('recent')) + '</h2><a href="#/odstrjel">' + esc(t('all')) + '</a></div>' +
          '<div class="panel flush"><ul class="list">' + recent.map(Strecke.rowHtml).join('') + '</ul></div>' : '');
    },
    mount: function (el) {
      UI.$$('.row[data-id]', el).forEach(function (b) { b.onclick = function () { Strecke.openDetail(b.getAttribute('data-id')); }; });
      Wetter.refresh();
    }
  });
})();
