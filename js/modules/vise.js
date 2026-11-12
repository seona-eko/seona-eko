/** Više: Werkzeuge, Sync-Warteschlange, Karte offline, Einstellungen, Rechtliches. */
(function () {
  var esc = UI.esc, t = I18n.t;

  function entryLabel(e) {
    var d = e.data || {};
    if (e.entity === 'odstrjel') return (e.kind === 'submit' ? t('qNewOdstrjel') : d.storno ? t('qStorno') : t('qEditOdstrjel')) + ': ' + (d.vrsta ? I18n.species(d.vrsta) : '') + (d.brojMarkice ? ' #' + d.brojMarkice : '');
    if (e.entity === 'objekt') return t('qObjekt') + (d.art ? ': ' + I18n.objekt(d.art) + (d.broj ? ' ' + d.broj : '') : '') + (d.deleted ? ' (' + t('delete') + ')' : '');
    if (e.entity === 'lov') return t('qLov') + (d.datum ? ': ' + UI.fmtDate(d.datum) : '');
    if (e.entity === 'wildbret') return t('qWildbret');
    return e.key;
  }

  /** QR-Code zum Einrichten eines Team-Handys (enthält den Team-Code → nur persönlich zeigen). */
  async function openTeamQr() {
    var code = (await DB.get('code')) || '';
    var base = location.origin + location.pathname;
    var url = base + '#/start?c=' + encodeURIComponent(code) + '&r=uprava&l=' + encodeURIComponent(I18n.lang());
    UI.openSheet('<h2>' + esc(t('teamQrTitle')) + '</h2><p class="sheet-sub">' + esc(t('teamQrHint')) + '</p>' +
      '<div class="qr-panel"><div class="qr">' + Gosti.qrSvg(url) + '</div></div>' +
      '<p class="warn-text" style="text-align:center;margin:10px 0">' + esc(t('teamQrWarn')) + '</p>' +
      '<p class="hint" style="margin:0 0 4px">' + esc(t('teamCodeLbl')) + '</p><p class="code-big">' + esc(code) + '</p>' +
      // Kollege am PC/Laptop: Link ohne Code schicken, den Code gibt er beim ersten Öffnen ein (Code nie per Nachricht)
      '<p class="code-inline" style="margin:18px 0 10px;word-break:break-all">' + esc(base) + '</p>' +
      '<button type="button" class="btn small" data-copy-addr>' + esc(t('btnCopyAddr')) + '</button>', function (el) {
      function copy(text, msg) {
        if (navigator.clipboard) navigator.clipboard.writeText(text).then(function () { UI.toast(msg, { timeout: 6000 }); }, function () { UI.toast(text, { timeout: 15000 }); });
        else UI.toast(text, { timeout: 15000 });
      }
      el.querySelector('[data-copy-addr]').onclick = function () { copy(base, t('copiedAddr')); };
    }, { noFocus: true });
  }

  /** Kopie von Datenstand und wartenden Einträgen als Datei — falls der Server wegfällt, gehen die Daten nicht verloren. */
  async function exportBackup() {
    var pull = await DB.get('pull'), outbox = await DB.outboxAll();
    if (!pull && !outbox.length) { UI.toast(t('backupNone')); return; }
    var name = 'seona-eko-' + new Date().toISOString().slice(0, 10) + '.json';
    var file = new File([JSON.stringify({ app: 'seona-eko', version: APP_CONFIG.VERSION, exportedAt: Date.now(), pull: pull, outbox: outbox })], name, { type: 'application/json' });
    if (navigator.canShare && navigator.canShare({ files: [file] })) {
      try { await navigator.share({ files: [file], title: name }); return; } catch (e) { if (e && e.name === 'AbortError') return; }
    }
    var a = document.createElement('a');
    a.href = URL.createObjectURL(file); a.download = name;
    document.body.appendChild(a); a.click(); a.remove();
    setTimeout(function () { URL.revokeObjectURL(a.href); }, 10000);
  }

  App.route('vise', {
    nav: 'vise',
    render: function (ctx) {
      var ob = Store.outbox();
      var role = App.role();
      return '<div class="page-head"><h1>' + esc(t('navVise')) + '</h1></div>' +
        '<div class="panel flush"><ul class="list">' +
        '<li><a class="row" href="#/lovostaj"><span class="r-icon">' + ICONS.calendar + '</span><span class="r-main"><span class="r-title">' + esc(t('quickLovostaj')) + '</span><span class="r-sub">' + esc(t('viseLovostajSub')) + '</span></span>' + ICONS.chevron.replace('<svg', '<svg class="chev"') + '</a></li>' +
        '<li><a class="row" href="#/wetter"><span class="r-icon">' + ICONS.wPartly + '</span><span class="r-main"><span class="r-title">' + esc(t('weatherTitle')) + '</span><span class="r-sub">' + esc(t('next24h')) + '</span></span>' + ICONS.chevron.replace('<svg', '<svg class="chev"') + '</a></li>' +
        '</ul></div>' +

        (role === 'uprava' ? '<div class="panel flush" style="margin-top:12px"><ul class="list"><li><button type="button" class="row" id="tut-replay"><span class="r-icon">' + ICONS.check + '</span><span class="r-main"><span class="r-title">' + esc(t('tutReplay')) + '</span><span class="r-sub">' + esc(t('tutReplaySub')) + '</span></span>' + ICONS.chevron.replace('<svg', '<svg class="chev"') + '</button></li>' +
          '<li><button type="button" class="row" id="team-qr"><span class="r-icon">' + ICONS.qr + '</span><span class="r-main"><span class="r-title">' + esc(t('teamQrTitle')) + '</span><span class="r-sub">' + esc(t('teamQrSub')) + '</span></span>' + ICONS.chevron.replace('<svg', '<svg class="chev"') + '</button></li></ul></div>' : '') +
        '<div class="section-title" id="sync"><h2>' + esc(t('syncTitle')) + '</h2></div>' +
        '<div class="panel"><p style="margin:0 0 4px"><b>' + esc(ob.length ? t('pillPending', { n: ob.length }) : t('allSent')) + '</b></p>' +
        '<p class="hint" style="margin:0 0 12px">' + esc(t('lastPull', { t: UI.fmtStamp(Store.pulledAt()) })) + (ob.length ? ' · ' + esc(t('subKeep')) : '') + '</p>' +
        (ob.length ? '<ul class="list" style="margin:0 -16px 12px;border-top:1px solid var(--line)">' + ob.map(function (e) {
          return '<li><div class="row"><span class="r-main"><span class="r-title">' + esc(entryLabel(e)) + '</span>' +
            (e.status === 'error' ? '<span class="r-sub" style="color:var(--warn);white-space:normal">' + esc(e.error) + '</span>' : '<span class="r-sub">' + esc(UI.fmtStamp(e.createdAt)) + '</span>') + '</span>' +
            '<button type="button" class="btn small ghost" data-discard="' + esc(e.key) + '" aria-label="' + esc(t('discard')) + '">' + ICONS.trash + '</button></div></li>';
        }).join('') + '</ul>' : '') +
        // Senden läuft von selbst; der Knopf erscheint nur, solange etwas wartet
        (ob.length ? '<button type="button" class="btn dark block" id="sync-now">' + ICONS.sync + esc(t('syncNow')) + '</button>' : '') +
        (role === 'uprava' ? '<button type="button" class="btn block" id="backup" style="margin-top:10px">' + esc(t('backupBtn')) + '</button>' : '') + '</div>' +

        '<div class="section-title"><h2>' + esc(t('offlineMap')) + '</h2></div>' +
        '<div class="panel" id="map-panel"><p class="hint" style="margin:0 0 12px" id="map-status">' + esc(t('loading')) + '</p>' +
        '<button type="button" class="btn block" id="map-dl">' + ICONS.map + esc(t('saveMap')) + '</button></div>' +

        '<div class="section-title"><h2>' + esc(t('settings')) + '</h2></div>' +
        '<div class="panel stack">' +
        '<div><span class="field-label">' + esc(t('lblLang')) + '</span><div class="seg" id="lang-seg">' +
        ['hr', 'en', 'de'].map(function (l) { return '<button type="button" data-lang="' + l + '" aria-pressed="' + (I18n.lang() === l) + '">' + l.toUpperCase() + '</button>'; }).join('') + '</div></div>' +
        '<div style="display:flex;justify-content:space-between;align-items:center;gap:10px"><span><span class="field-label" style="margin:0">' + esc(t('role')) + '</span>' +
        '<b>' + esc(role === 'uprava' ? t('roleUprava') : role === 'gost' ? t('roleGost') : '—') + '</b></span>' +
        '<button type="button" class="btn small" id="change-code">' + esc(t('changeCode')) + '</button></div></div>' +

        '<div class="section-title"><h2>' + esc(t('about')) + '</h2></div>' +
        '<div class="panel"><p class="legal" style="margin:0 0 10px">' + esc(t('legal')) + '</p>' +
        '<p class="legal" style="margin:0">' + esc(t('aboutData')) + '</p>' +
        '<p class="legal" style="margin:10px 0 0">Seona Eko — Revir · v' + esc(APP_CONFIG.VERSION) +
        '</p>' +
        '<button type="button" class="btn small" id="check-update" style="margin-top:10px">' + ICONS.sync + esc(t('updateCheck')) + '</button></div>';
    },
    mount: async function (el, ctx) {
      if (ctx.query.sync) { var s = el.querySelector('#sync'); if (s) s.scrollIntoView(); }
      var syncBtn = el.querySelector('#sync-now');
      if (syncBtn) syncBtn.onclick = async function () {
        this.disabled = true;
        if (!navigator.onLine) { UI.toast(t('pillOffline')); this.disabled = false; return; }
        var res = await App.syncNow({ pull: true });
        UI.toast(res && res.unavailable ? t('subServer') : res && res.networkError ? t('subOffline') : res && res.authError ? t('pillCode') : t('syncDone'));
      };
      var bk = el.querySelector('#backup');
      if (bk) bk.onclick = exportBackup;
      UI.$$('[data-discard]', el).forEach(function (b) {
        b.onclick = async function () {
          if (await UI.confirm(t('discard'), t('confirmDiscard'), t('discard'), true)) await Store.discard(b.getAttribute('data-discard'));
        };
      });
      UI.$$('#lang-seg button', el).forEach(function (b) { b.onclick = function () { App.setLang(b.getAttribute('data-lang')); }; });
      el.querySelector('#change-code').onclick = function () { App.openSetup(false); };
      el.querySelector('#check-update').onclick = function () { App.checkUpdate(); };
      var tq = el.querySelector('#team-qr');
      if (tq) tq.onclick = openTeamQr;
      var tr = el.querySelector('#tut-replay');
      if (tr) tr.onclick = function () { App.go('#/home'); Tutorial.open(); };

      var st = await MapOffline.status();
      var status = el.querySelector('#map-status');
      if (status) status.textContent = st ? t('mapSavedAt', { t: UI.fmtStamp(st.at), n: st.tiles }) : t('mapNotSaved');
      var dl = el.querySelector('#map-dl');
      if (dl) {
        if (st) dl.innerHTML = ICONS.sync + esc(t('updateMap'));
        dl.onclick = async function () {
          dl.disabled = true;
          try {
            var res = await MapOffline.download(function (d, n) { status.textContent = t('savingMap', { p: Math.round(d / n * 100) }); });
            status.textContent = res.failed ? t('saveMapPartial', { n: res.failed }) : t('mapSaved');
          } catch (e) { status.textContent = t('saveMapFailed'); }
          dl.disabled = false;
        };
      }
    }
  });
})();
