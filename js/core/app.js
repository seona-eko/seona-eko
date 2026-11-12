/**
 * App-Hülle: Hash-Router, untere Navigation, Sync-Anzeige, Einrichtung (Code/Rolle), Updates.
 * Module registrieren sich mit App.route(name, { nav, full, live, render(ctx), mount(el, ctx), unmount() }).
 */
var App = (function () {
  var routes = {};
  var active = null;      // { name, def, ctx }
  var role = null;        // 'uprava' (Team) | 'gost' (Jagdgast)
  var teamNav = null;     // ursprüngliche Navigation (Team)
  var GOST_ROUTES = ['gost', 'karta', 'lovostaj', 'wetter'];
  var syncState = 'ok';   // ok | pending | offline | unavailable | error | auth

  function route(name, def) { routes[name] = def; }

  function parseHash() {
    var h = (location.hash || '#/home').replace(/^#\/?/, '');
    var q = {};
    var qi = h.indexOf('?');
    if (qi !== -1) {
      h.slice(qi + 1).split('&').forEach(function (p) { var kv = p.split('='); if (kv[0]) q[decodeURIComponent(kv[0])] = decodeURIComponent(kv[1] || ''); });
      h = h.slice(0, qi);
    }
    var parts = h.split('/').filter(Boolean);
    return { name: parts[0] || 'home', params: parts.slice(1), query: q };
  }

  function go(hash) {
    if (location.hash === hash) render(); else location.hash = hash;
  }

  function render(keepScroll) {
    var r = parseHash();
    // Gäste sehen nur Gästeseite, Karte und Jagdzeiten; alles andere führt zur Gästeseite.
    if (role === 'gost' && GOST_ROUTES.indexOf(r.name) === -1) { history.replaceState(null, '', '#/gost'); r = parseHash(); }
    var def = routes[r.name] || routes.home;
    var view = document.getElementById('view');
    dirty = false;
    if (active && active.def.unmount) { try { active.def.unmount(); } catch (e) { console.error(e); } }
    UI.closeSheet(true);
    var ctx = { params: r.params, query: r.query, name: r.name };
    active = { name: r.name, def: def, ctx: ctx };
    view.className = def.full ? 'full' : '';
    var y = window.scrollY;
    view.innerHTML = def.render ? def.render(ctx) : '';
    injectIcons(view);
    I18n.apply(view);
    if (def.mount) def.mount(view, ctx);
    if (keepScroll) window.scrollTo(0, y); else window.scrollTo(0, 0);
    UI.$$('#bottomnav a').forEach(function (a) {
      if (a.getAttribute('data-nav') === (def.nav || r.name)) a.setAttribute('aria-current', 'page');
      else a.removeAttribute('aria-current');
    });
  }

  /** Datenänderung → aktuelle Seite neu zeichnen (außer Formularseiten, live:false). */
  var dirty = false;
  function refreshView() {
    if (!active) return;
    if (active.def.live === false) { if (active.def.onData) active.def.onData(); return; }
    // offenes Sheet nicht wegreißen — nachholen, sobald es zu ist
    if (UI.isSheetOpen()) { dirty = true; return; }
    dirty = false;
    render(true);
  }

  function injectIcons(root) {
    UI.$$('[data-icon]', root).forEach(function (el) {
      var k = el.getAttribute('data-icon');
      if (ICONS[k]) { el.outerHTML = ICONS[k]; }
    });
  }

  /* ---------------- Sync-Anzeige ---------------- */
  function updateSyncPill() {
    var pill = document.getElementById('sync-pill');
    var text = document.getElementById('sync-pill-text');
    var n = Store.outbox().length;
    var errors = Store.outbox().filter(function (e) { return e.status === 'error'; }).length;
    var cls = '', label;
    if (syncState === 'auth') { cls = 'error'; label = I18n.t('pillCode'); }
    else if (syncState === 'unavailable') { cls = 'error'; label = I18n.t('pillServer'); }
    else if (errors) { cls = 'error'; label = I18n.t('pillErrors', { n: errors }); }
    else if (Sync.isRunning()) { cls = 'pending'; label = I18n.t('pillSending'); }
    else if (n) { cls = navigator.onLine ? 'pending' : 'offline'; label = I18n.t('pillPending', { n: n }); }
    else if (!navigator.onLine) { cls = 'offline'; label = I18n.t('pillOffline'); }
    else { label = I18n.t('pillSynced'); }
    pill.className = 'sync-pill ' + cls;
    text.textContent = label;
    // Ohne Kopfzeile (Handy hochkant): derselbe Stand als Punkt am Menüpunkt „Mehr“ (Kupfer = wartet, Rot = Problem)
    var mehr = document.querySelector('#bottomnav a[data-nav="vise"]');
    if (mehr) {
      if (cls) mehr.setAttribute('data-sync', cls); else mehr.removeAttribute('data-sync');
      mehr.setAttribute('title', label);
    }
  }

  /**
   * Senden + Abgleich. Läuft schon einer, wird danach noch einmal gesendet (nichts bleibt liegen).
   * Kein Netz oder Server beschäftigt → von selbst erneut nach 5 s, 15 s, 30 s, dann jede Minute,
   * solange etwas wartet. navigator.onLine wird nicht vertraut (auf dem iPhone oft falsch) — es wird einfach versucht.
   */
  var RETRY = [5, 15, 30, 60];
  var RETRY_SERVER = [60, 300, 900]; // Server lehnt ab (z. B. gesperrt): nicht im Minutentakt nachfragen
  var retryStep = 0, retryTimer = null, queued = null, lastPull = 0;
  async function syncNow(opts) {
    opts = opts || {};
    if (Sync.isRunning()) {
      queued = Object.assign(queued || {}, { pull: !!(opts.pull || (queued && queued.pull)), quiet: true });
      return null;
    }
    if (!(await DB.get('code'))) return null; // noch nicht eingerichtet
    var waiting = Store.outbox().filter(function (e) { return e.status !== 'error'; }).length;
    if (!waiting && opts.pull && opts.quiet && Date.now() - lastPull < 5000) return null; // gerade erst abgeglichen
    if (retryTimer) { clearTimeout(retryTimer); retryTimer = null; }
    var res = await Sync.run({ pull: true });
    if (res.authError) syncState = 'auth';
    else if (res.unavailable) syncState = 'unavailable';
    else if (res.networkError) syncState = 'offline';
    else syncState = 'ok';
    if (res.pull) { await Store.applyPull(res.pull, res.pullStartedAt); lastPull = Date.now(); }
    await Store.reloadOutbox();
    if (!res.pull && !res.networkError && !res.unavailable && !res.authError && (res.sent.length || opts.pull)) {
      var startedPull = Date.now();
      var p = await Store.refresh();
      if (p === 'auth') syncState = 'auth';
      else if (p === 'offline') syncState = 'offline';
      else if (p === 'unavailable') syncState = 'unavailable';
      else if (p === 'ok') lastPull = startedPull;
    }
    updateSyncPill();
    if (res.warnings.length && !opts.quiet) UI.toast(res.warnings.join(' '), { timeout: 7000 });
    // Wiederholen, solange etwas wartet und es am Netz/Server lag
    var still = Store.outbox().filter(function (e) { return e.status !== 'error'; }).length;
    if (still && (res.networkError || res.unavailable || res.busy || syncState === 'offline' || syncState === 'unavailable')) {
      retryTimer = setTimeout(function () { retryTimer = null; syncNow({ quiet: true }); }, (syncState === 'unavailable' ? RETRY_SERVER[Math.min(retryStep, RETRY_SERVER.length - 1)] : RETRY[Math.min(retryStep, RETRY.length - 1)]) * 1000);
      retryStep++;
    } else retryStep = 0;
    if (queued) { var q = queued; queued = null; return syncNow(q); }
    return res;
  }

  /* ---------------- Einrichtung ---------------- */
  function setupLangButtons() {
    UI.$$('#setup-lang button').forEach(function (b) {
      b.setAttribute('aria-pressed', String(b.getAttribute('data-lang') === I18n.lang()));
      b.onclick = function () { setLang(b.getAttribute('data-lang')); setupLangButtons(); };
    });
  }

  async function openSetup(first) {
    var el = document.getElementById('setup');
    document.getElementById('setup-error').hidden = true;
    document.getElementById('setup-notice').hidden = true;
    document.getElementById('setup-code').value = '';
    document.getElementById('setup-code').placeholder = first ? '' : I18n.t('phCodeKeep');
    document.getElementById('setup-device').value = (await DB.get('device')) || '';
    document.getElementById('setup-cancel').hidden = first;
    setupLangButtons();
    I18n.apply(el);
    el.classList.add('show');
    // Beim ersten Start keine Tastatur aufklappen — meist wird der QR-Code gescannt
    if (!first) setTimeout(function () { document.getElementById('setup-code').focus(); }, 60);
  }
  function closeSetup() { document.getElementById('setup').classList.remove('show'); }

  document.getElementById('setup-cancel').onclick = closeSetup;
  // QR in der App scannen: Code (und Sprache) übernehmen und gleich prüfen — nichts tippen
  document.getElementById('setup-scan').onclick = async function () {
    var err = document.getElementById('setup-error');
    err.hidden = true;
    var text = await QrScan.open();
    if (!text) return;
    var q = QrScan.parseStart(text);
    if (!q) { err.textContent = I18n.t('scanForeign'); err.hidden = false; return; }
    if (q.l) { setLang(q.l); setupLangButtons(); }
    await DB.set('gostId', q.r === 'uprava' ? '' : (q.g || ''));
    document.getElementById('setup-code').value = q.c;
    document.getElementById('setup-form').requestSubmit();
  };
  document.getElementById('setup-form').addEventListener('submit', async function (ev) {
    ev.preventDefault();
    var err = document.getElementById('setup-error');
    err.hidden = true;
    var existing = await DB.get('code');
    var code = document.getElementById('setup-code').value.trim() || existing || '';
    if (!code) { err.textContent = I18n.t('errCodeEmpty'); err.hidden = false; return; }
    var btn = document.getElementById('setup-submit');
    btn.disabled = true; btn.textContent = I18n.t('checking');
    var offline = false, unavailable = false, newRole = null;
    try {
      var res = await API.call('options', code);
      newRole = res.role;
    } catch (e) {
      if (e.kind === 'auth') {
        btn.disabled = false; btn.textContent = I18n.t('btnSave');
        err.textContent = I18n.t('errCodeWrong'); err.hidden = false;
        return;
      }
      offline = true; // ohne Netz trotzdem speichern — geprüft wird beim ersten Senden
      unavailable = e.kind === 'unavailable';
    }
    btn.disabled = false; btn.textContent = I18n.t('btnSave');
    await DB.set('code', code);
    await DB.set('device', document.getElementById('setup-device').value.trim());
    if (newRole) { role = newRole; await DB.set('role', newRole); }
    if (navigator.storage && navigator.storage.persist) { try { await navigator.storage.persist(); } catch (e) {} }
    syncState = 'ok';
    updateBrand();
    if (offline) {
      var n = document.getElementById('setup-notice');
      n.textContent = I18n.t(unavailable ? 'setupServer' : 'setupOffline'); n.hidden = false;
      setTimeout(closeSetup, 1800);
    } else closeSetup();
    syncNow({ pull: true }).then(function () { Tutorial.maybeShow(); autoSaveMap(); });
    render(true);
  });

  function updateBrand() {
    document.getElementById('brand-sub').textContent = role === 'uprava' ? I18n.t('roleUprava') : role === 'gost' ? I18n.t('roleGost') : I18n.t('brandSub');
    applyRoleNav();
  }

  /** Gäste: nur „Übersicht“ und „Karte“ in der unteren Navigation. */
  function applyRoleNav() {
    var nav = document.getElementById('bottomnav');
    if (!teamNav) teamNav = nav.innerHTML;
    var want = role === 'gost' ? 'gost' : 'team';
    if (nav.getAttribute('data-mode') !== want) {
      nav.setAttribute('data-mode', want);
      nav.innerHTML = want === 'gost'
        ? '<a href="#/gost" data-nav="gost"><span data-icon="home"></span><span data-i18n="navGost"></span><i class="ind"></i></a>' +
          '<a href="#/karta" data-nav="karta"><span data-icon="map"></span><span data-i18n="navKarta"></span><i class="ind"></i></a>'
        : teamNav;
      nav.style.gridTemplateColumns = want === 'gost' ? 'repeat(2,1fr)' : '';
      injectIcons(nav);
    }
    I18n.apply(nav);
  }

  function setLang(lang) {
    I18n.setLang(lang);
    // Gäste: Freitexte (Bemerkungen, Abholung …) kommen vom Server übersetzt → neu abrufen
    if (role === 'gost' && navigator.onLine) Store.refresh();
    I18n.apply(document);
    updateBrand();
    updateSyncPill();
    render(true);
  }

  /* ---------------- Service Worker ---------------- */
  var swReg = null;
  /** Knopf „Nach Update suchen": neue Version holen und sofort übernehmen; sonst einfach neu laden. */
  async function checkUpdate() {
    if (!swReg) { location.reload(); return; }
    try { await swReg.update(); } catch (e) {}
    var w = swReg.waiting || swReg.installing;
    if (w) {
      if (w.state === 'installed') w.postMessage('skipWaiting');
      else w.addEventListener('statechange', function () { if (w.state === 'installed') w.postMessage('skipWaiting'); });
      UI.toast(I18n.t('updateLoading'));
    } else {
      UI.toast(I18n.t('updateNone'));
    }
  }

  function registerSW() {
    if (!('serviceWorker' in navigator)) return;
    var reloading = false;
    navigator.serviceWorker.addEventListener('controllerchange', function () {
      if (reloading) return; reloading = true; location.reload();
    });
    // updateViaCache 'none': sw.js bei jeder Prüfung frisch vom Server, nicht aus dem 10-min-Zwischenspeicher von GitHub Pages
    navigator.serviceWorker.register('sw.js', { updateViaCache: 'none' }).then(function (reg) {
      // Neue Version: sofort übernehmen, wenn gerade nichts eingegeben wird — sonst Hinweis mit Knopf.
      // (Einträge liegen in IndexedDB und überstehen das Neuladen ohnehin.)
      function busy() { return !!document.querySelector('.sheet') || (active && active.def.live === false) || /#\/odstrjel\/(novi|uredi)/.test(location.hash) || document.getElementById('setup').classList.contains('show'); }
      function offer(worker) {
        if (!busy()) { worker.postMessage('skipWaiting'); return; }
        UI.toast(I18n.t('updateText'), { kind: 'update', sticky: true, action: I18n.t('btnUpdate'), onAction: function () { worker.postMessage('skipWaiting'); } });
      }
      if (reg.waiting && navigator.serviceWorker.controller) offer(reg.waiting);
      swReg = reg;
      reg.update().catch(function () {}); // gleich beim Start nach einer neuen Version fragen
      reg.addEventListener('updatefound', function () {
        var nw = reg.installing;
        if (nw) nw.addEventListener('statechange', function () {
          if (nw.state === 'installed' && navigator.serviceWorker.controller) offer(nw);
        });
      });
      document.addEventListener('visibilitychange', function () {
        if (document.visibilityState !== 'visible') return;
        if (reg.waiting && navigator.serviceWorker.controller) offer(reg.waiting);
        reg.update().catch(function () {});
      });
    }).catch(function () {});
  }

  /* ---------------- Start ---------------- */
  /**
   * Start-Link aus dem QR-Code: #/start?c=<Gästecode>&g=<Gast-ID>&l=<Sprache> → speichern, zur Gästeseite.
   * (Alles nach „#" bleibt auf dem Gerät und wird nicht an den Webserver übertragen.)
   */
  async function handleStartLink() {
    var r = parseHash();
    if (r.name !== 'start' || !r.query.c) return false;
    await DB.set('code', r.query.c);
    if (r.query.g) await DB.set('gostId', r.query.g);
    if (r.query.l) I18n.setLang(r.query.l);
    // Team-QR (r=uprava) führt zur Startseite, Gäste-QR zur Gästeseite; die Rolle bestätigt der Server beim ersten Abruf.
    var team = r.query.r === 'uprava';
    await DB.set('role', team ? 'uprava' : 'gost');
    if (team) await DB.set('gostId', '');
    history.replaceState(null, '', team ? '#/home' : '#/gost');
    return true;
  }

  /* ---------------- Installation ---------------- */
  var installEvent = null;
  window.addEventListener('beforeinstallprompt', function (e) { e.preventDefault(); installEvent = e; var b = document.getElementById('inst-android'); if (b) b.hidden = false; });

  function isStandalone() {
    return (window.matchMedia && window.matchMedia('(display-mode: standalone)').matches) || navigator.standalone === true;
  }

  /**
   * Nicht installiert (Browser-Tab oder WhatsApp-Innenbrowser) → Hinweis, wie man installiert. Nur installiert
   * läuft die App zuverlässig ohne Netz, und iOS löscht die Daten eines Browser-Tabs nach einigen Tagen.
   */
  function showInstallHint() {
    if (isStandalone()) return;
    try { if (sessionStorage.getItem('seona_inst_later')) return; } catch (e) {}
    var ua = navigator.userAgent || '';
    var inApp = /WhatsApp|FBAN|FBAV|Instagram|Line\//i.test(ua);
    var ios = /iPhone|iPad|iPod/i.test(ua) || (/Macintosh/.test(ua) && navigator.maxTouchPoints > 1);
    if (!ios && !/Android/i.test(ua)) return; // am Computer (Verwaltung im Browser) kein Hinweis
    var t = I18n.t, esc = UI.esc;
    var el = document.createElement('div');
    el.className = 'overlay show install';
    el.setAttribute('role', 'dialog');
    el.innerHTML = '<div class="box">' +
      '<img src="icons/icon-192.png" alt="" class="inst-icon">' +
      '<h2>' + esc(t('instTitle')) + '</h2><p>' + esc(t('instText')) + '</p>' +
      (inApp ? '<p class="notice">' + esc(t('instInApp')) + '</p>'
        : ios ? '<ol class="inst-steps"><li>' + ICONS.share + '<span>' + esc(t('instIos1')) + '</span></li><li>' + ICONS.plus + '<span>' + esc(t('instIos2')) + '</span></li><li>' + ICONS.home + '<span>' + esc(t('instIos3')) + '</span></li></ol>'
        : '<button type="button" class="btn primary block" id="inst-android"' + (installEvent ? '' : ' hidden') + '>' + ICONS.plus + esc(t('instAndroid')) + '</button>' +
          '<p class="hint" style="margin-top:10px">' + esc(t('instAndroidManual')) + '</p>') +
      '<button type="button" class="btn ghost block" id="inst-later" style="margin-top:14px">' + esc(t('instLater')) + '</button></div>';
    document.body.appendChild(el);
    var b = el.querySelector('#inst-android');
    if (b) b.onclick = async function () {
      if (!installEvent) return;
      installEvent.prompt();
      try { await installEvent.userChoice; } catch (e) {}
      installEvent = null; el.remove();
    };
    el.querySelector('#inst-later').onclick = function () {
      try { sessionStorage.setItem('seona_inst_later', '1'); } catch (e) {}
      el.remove();
    };
    window.addEventListener('appinstalled', function () { el.remove(); });
  }

  /** Karte einmalig von selbst offline speichern (wer denkt schon an „Više → Karte speichern"). */
  var mapAuto = false;
  async function autoSaveMap() {
    if (mapAuto || !navigator.onLine || !window.MapOffline || !('caches' in window)) return;
    if (await MapOffline.status()) return;
    mapAuto = true;
    try {
      var res = await MapOffline.download(function (d, n) {
        if (d % 100 === 0) UI.toast(I18n.t('mapAutoSaving', { p: Math.round(d / n * 100) }), { timeout: 4000 });
      });
      if (!res.failed) UI.toast(I18n.t('mapAutoDone'));
    } catch (e) {}
    mapAuto = false;
  }

  /** Startbildschirm (Logo aus index.html) ausblenden — frühestens 0,6 s nach dem Öffnen, damit man ihn sieht. */
  function bootWeg() {
    var b = document.getElementById('boot');
    if (!b) return;
    var rest = Math.max(0, 600 - (window.performance ? performance.now() : 0));
    setTimeout(function () { b.classList.add('weg'); setTimeout(function () { if (b.parentNode) b.parentNode.removeChild(b); }, 350); }, rest);
  }
  // Sicherheitsnetz: hängt der Start irgendwo, verschwindet das Logo trotzdem nach 4 s
  setTimeout(function () { bootWeg(); }, 4000);

  async function start() {
    // iPhone/iPad erkennen (für die Seitenlänge, styles.css „html.ios") — andere Geräte bleiben unberührt
    var ua = navigator.userAgent || '';
    if (/iPhone|iPad|iPod/i.test(ua) || (/Macintosh/.test(ua) && navigator.maxTouchPoints > 1)) document.documentElement.classList.add('ios');
    // Handy quer: auf welcher Seite liegt die Kamera? (90° = links, 270°/-90° = rechts) — styles.css hält nur dort Abstand
    var notch = function () {
      var w = (screen.orientation && typeof screen.orientation.angle === 'number') ? screen.orientation.angle : (window.orientation || 0);
      document.documentElement.classList.toggle('notch-left', w === 90);
      document.documentElement.classList.toggle('notch-right', w === 270 || w === -90);
    };
    notch();
    if (screen.orientation && screen.orientation.addEventListener) screen.orientation.addEventListener('change', notch);
    window.addEventListener('orientationchange', notch);
    await handleStartLink();
    I18n.apply(document);
    injectIcons(document.getElementById('setup'));
    injectIcons(document.getElementById('bottomnav'));
    document.getElementById('sync-pill').onclick = function () { go('#/vise?sync=1'); };
    // Seitenwechsel weich überblenden (wo der Browser es kann; „Bewegung reduzieren“ wird beachtet)
    window.addEventListener('hashchange', function () {
      var still = window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches;
      // iPhone/iPad: in installierten Web-Apps noch fehleranfällig (schwarzer Bildschirm gemeldet) → dort ohne Überblenden
      var ios = document.documentElement.classList.contains('ios');
      // beim Wischen zwischen Reitern läuft eine eigene Gleitbewegung → kein zusätzliches Überblenden
      var wisch = document.documentElement.hasAttribute('data-wisch');
      if (document.startViewTransition && !still && !ios && !wisch) { try { document.startViewTransition(function () { render(); }); return; } catch (e) {} }
      render();
    });
    window.addEventListener('online', function () { if (syncState === 'offline') syncState = 'ok'; retryStep = 0; syncNow({ pull: true, quiet: true }); });
    window.addEventListener('focus', function () { syncNow({ pull: true, quiet: true }); });
    window.addEventListener('pageshow', function () { syncNow({ pull: true, quiet: true }); });
    UI.onSheetClosed(function () { if (dirty) refreshView(); });
    window.addEventListener('offline', updateSyncPill);
    Sync.onChange(updateSyncPill);
    Store.onChange(function () {
      var s = Store.snapshot();
      if (s && s.role && s.role !== role) {
        role = s.role; updateBrand();
        if (role === 'gost' && GOST_ROUTES.indexOf(parseHash().name) === -1) { updateSyncPill(); render(); return; }
      }
      updateSyncPill();
      refreshView();
    });

    registerSW();
    role = (await DB.get('role')) || null;
    updateBrand();
    await Store.load();
    await Wetter.load();
    render();
    bootWeg();
    Wetter.refresh();
    updateSyncPill();

    showInstallHint();
    var code = await DB.get('code');
    if (!code) { openSetup(true); return; }
    Tutorial.maybeShow();
    syncNow({ pull: true, quiet: true }).then(function () { Tutorial.maybeShow(); autoSaveMap(); });
    // Solange die App offen ist: alle 5 min abgleichen (Stand anderer Jäger, Drückjagden …). Eigene Einträge
    // erscheinen sofort, beim Öffnen der App wird ohnehin abgeglichen — seltener fragen heißt weniger „Bot-Verkehr“.
    setInterval(function () {
      if (document.visibilityState === 'visible' && syncState !== 'unavailable') syncNow({ pull: true, quiet: true });
    }, 300000);
    document.addEventListener('visibilitychange', function () {
      if (document.visibilityState === 'visible') { retryStep = 0; syncNow({ pull: true, quiet: true }); }
    });
  }

  return {
    start: start, route: route, go: go, render: render, syncNow: syncNow, openSetup: openSetup, setLang: setLang, checkUpdate: checkUpdate,
    role: function () { return role; },
    isUprava: function () { return role === 'uprava'; },
    isGost: function () { return role === 'gost'; },
    syncState: function () { return syncState; },
    injectIcons: injectIcons
  };
})();

/**
 * Leichtes Tippen spürbar machen — nur bei den großen Knöpfen (Hauptaktionen, Kacheln, runde Kartenknöpfe,
 * Wildart-Auswahl), nicht bei jedem kleinen Schalter. Nur Android; iPhones erlauben Web-Apps keine Vibration.
 */
(function () {
  var GROSS = '.btn.primary, .btn.block, .quick a, .fab, .species-btn, #bottomnav a';
  document.addEventListener('click', function (e) {
    var b = e.target && e.target.closest ? e.target.closest(GROSS) : null;
    if (b && !b.disabled) UI.haptic(10);
  }, true);
})();

/**
 * Wischen zwischen den Reitern einer Seite (z. B. Jagden: Drückjagden ↔ Gäste; Strecke: Liste ↔ Plan ↔ Kühlzelle).
 * Der Inhalt folgt dem Finger (gedämpft); beim Loslassen gleitet er hinaus und der neue Reiter ruhig herein.
 * Reicht die Bewegung nicht (oder gibt es keinen Nachbar-Reiter), federt er weich zurück.
 * Nur waagrechte Bewegungen; nicht auf Bereichen, die selbst seitlich scrollen, Eingabefeldern, Karten, offenen Feldern.
 */
(function () {
  var sx = 0, sy = 0, st = 0, aktiv = false, modus = null, dx = 0, teile = [], nachbar = null, richtung = 0;
  var AUS = 'cubic-bezier(.4,0,.2,1)';
  function scrolltSeitlich(el) {
    for (; el && el !== document.body; el = el.parentElement) {
      if (el.scrollWidth > el.clientWidth + 2) {
        var o = getComputedStyle(el).overflowX;
        if (o === 'auto' || o === 'scroll') return true;
      }
    }
    return false;
  }
  function setze(x, op, trans) {
    teile.forEach(function (el) {
      el.style.transition = trans || 'none';
      el.style.transform = x ? 'translate3d(' + x + 'px,0,0)' : '';
      el.style.opacity = op == null ? '' : String(op);
    });
  }
  function nachbarReiter(r) {
    var reiter = [].slice.call(document.querySelectorAll('#view .section-tabs a'));
    var i = reiter.findIndex(function (a) { return a.getAttribute('aria-current') === 'page'; });
    var j = i + r;
    return i < 0 || j < 0 || j >= reiter.length ? null : reiter[j];
  }
  document.addEventListener('touchstart', function (e) {
    aktiv = false; modus = null; dx = 0;
    if (e.touches.length !== 1) return;
    var view = document.getElementById('view');
    if (!view || !view.contains(e.target) || !view.querySelector('.section-tabs')) return;
    if (UI.isSheetOpen() || e.target.closest('input, textarea, select, .leaflet-container, [data-noswipe]')) return;
    if (scrolltSeitlich(e.target)) return;
    sx = e.touches[0].clientX; sy = e.touches[0].clientY; st = Date.now(); aktiv = true;
    teile = [].slice.call(view.children).filter(function (el) { return !el.classList.contains('section-tabs'); });
  }, { passive: true });
  document.addEventListener('touchmove', function (e) {
    if (!aktiv) return;
    var t = e.touches[0], x = t.clientX - sx, y = t.clientY - sy;
    if (!modus) {
      if (Math.abs(x) > 10 && Math.abs(x) > Math.abs(y) * 1.5) {
        modus = 'h'; richtung = x < 0 ? 1 : -1; nachbar = nachbarReiter(richtung);
      } else if (Math.abs(y) > 10) { aktiv = false; return; }
      else return;
    }
    dx = x;
    // gedämpft folgen; ohne Nachbar-Reiter nur ein wenig (Gummiband)
    var weg = nachbar && (dx < 0) === (richtung > 0) ? dx * 0.55 : dx * 0.18;
    setze(weg, 1 - Math.min(0.5, Math.abs(weg) / 500));
  }, { passive: true });
  document.addEventListener('touchend', function () {
    if (!aktiv) return;
    aktiv = false;
    if (modus !== 'h') return;
    var schnell = Math.abs(dx) / Math.max(1, Date.now() - st) > 0.5; // zügiger Wisch zählt auch bei kürzerem Weg
    var weit = Math.abs(dx) > 80 || (schnell && Math.abs(dx) > 40);
    if (!nachbar || !weit || (dx < 0) !== (richtung > 0)) { setze(0, 1, 'transform .45s ' + AUS + ', opacity .45s ' + AUS); return; }
    // hinausgleiten, dann Reiter wechseln; der neue Inhalt gleitet aus der Gegenrichtung herein
    var ziel = nachbar.getAttribute('href'), cls = richtung > 0 ? 'wisch-l' : 'wisch-r';
    setze(richtung > 0 ? -90 : 90, 0, 'transform .22s ' + AUS + ', opacity .22s ' + AUS);
    setTimeout(function () {
      window.addEventListener('hashchange', function einmal() {
        window.removeEventListener('hashchange', einmal);
        requestAnimationFrame(function () {
          var v = document.getElementById('view');
          if (!v) return;
          v.classList.add(cls);
          setTimeout(function () { v.classList.remove(cls); }, 600);
        });
      });
      document.documentElement.setAttribute('data-wisch', '');
      location.hash = ziel;
      setTimeout(function () { document.documentElement.removeAttribute('data-wisch'); }, 50);
    }, 200);
  }, { passive: true });
  document.addEventListener('touchcancel', function () { if (aktiv && modus === 'h') setze(0, 1, 'transform .45s ' + AUS + ', opacity .45s ' + AUS); aktiv = false; }, { passive: true });
})();

/**
 * iPhone wie iOS 26 / Instagram (Klassen an <html>):
 *  - „kopf-weg“: Kopfzeile verschwindet beim Runterscrollen, kommt beim Hochscrollen oder ganz oben zurück.
 *  - „scrollt“: Glasleiste wird beim Runterscrollen klein; groß nach 0,9 s Pause, beim Hochscrollen oder unten am Ende.
 * Richtungswechsel zählen erst nach 12 px am Stück — kleine Ruckler lösen nichts aus (ruhig statt hektisch).
 * Nachfedern (Gummiband) an den Enden wird ignoriert.
 */
(function () {
  var html = document.documentElement, timer = null, y = window.scrollY, weg = 0, richtung = 0;
  function gross() { clearTimeout(timer); html.classList.remove('scrollt'); }
  function zeigeKopf() { html.classList.remove('kopf-weg'); }
  window.addEventListener('scroll', function () {
    if (!html.classList.contains('ios')) return;
    var neu = window.scrollY, d = neu - y;
    y = neu;
    var max = Math.max(0, html.scrollHeight - window.innerHeight);
    if (neu <= 4) { gross(); zeigeKopf(); weg = 0; return; }       // ganz oben (auch Gummiband oben)
    if (neu >= max - 2) { gross(); return; }                         // unten angekommen: Leiste groß, Kopf bleibt weg
    var r = d > 0 ? 1 : d < 0 ? -1 : 0;
    if (!r) return;
    if (r !== richtung) { richtung = r; weg = 0; }
    weg += Math.abs(d);
    if (weg < 12) return;
    if (r > 0) {
      if (neu > 60) html.classList.add('kopf-weg');
      html.classList.add('scrollt');
      clearTimeout(timer);
      timer = setTimeout(gross, 900);
    } else { zeigeKopf(); gross(); }
  }, { passive: true });
  window.addEventListener('hashchange', function () { gross(); zeigeKopf(); weg = 0; richtung = 0; });
})();

/**
 * Systemfarbe (Statusleiste/Adresszeile) = Farbe der Kopfzeile, auch beim Wechsel hell/dunkel.
 */
(function () {
  function farbe() {
    var tb = document.querySelector('.topbar'), m = document.querySelector('meta[name="theme-color"]');
    if (tb && m) { try { m.setAttribute('content', getComputedStyle(tb).backgroundColor); } catch (e) {} }
  }
  farbe();
  try { matchMedia('(prefers-color-scheme: dark)').addEventListener('change', farbe); } catch (e) {}
})();

/**
 * Fehler still an den Server melden, damit sie auffallen, bevor jemand anruft.
 * Nur technische Angaben (Meldung, Datei/Zeile, Seite, Version, Browser) — kein Code, keine Namen, keine Revierdaten.
 * Höchstens 5 je Sitzung, jede Meldung nur einmal. Ohne Netz geht die Meldung verloren (kein Problem).
 */
(function () {
  var gesendet = 0, schon = {};
  function melde(m, s, l, c, st) {
    try {
      if (gesendet >= 5 || !window.APP_CONFIG || !APP_CONFIG.API_URL) return;
      var key = String(m) + '|' + (s || '') + '|' + (l || 0);
      if (schon[key]) return;
      schon[key] = 1; gesendet++;
      var body = JSON.stringify({ action: 'greska', payload: {
        m: String(m || '').slice(0, 300), s: String(s || '').replace(location.origin, '').slice(0, 120), l: l || 0, c: c || 0,
        st: String(st || '').replace(new RegExp(location.origin.replace(/[.*+?^${}()|[\]\\/]/g, '\\$&'), 'g'), '').slice(0, 800),
        r: String(location.hash || '').split('?')[0].slice(0, 60), v: APP_CONFIG.VERSION || '', ua: navigator.userAgent.slice(0, 160)
      } });
      fetch(APP_CONFIG.API_URL, { method: 'POST', headers: { 'Content-Type': 'text/plain' }, body: body, keepalive: true }).catch(function () {});
    } catch (e) {}
  }
  window.addEventListener('error', function (e) {
    if (!e || !e.message) return; // Ladefehler von Bildern/Kacheln sind keine Programmfehler
    melde(e.message, e.filename, e.lineno, e.colno, e.error && e.error.stack);
  });
  window.addEventListener('unhandledrejection', function (e) {
    var r = e && e.reason;
    if (r && (r.name === 'AbortError' || /Failed to fetch|NetworkError|Load failed/i.test(String(r.message || r)))) return; // kein Netz = normal
    melde(r && r.message || String(r), 'promise', 0, 0, r && r.stack);
  });
})();
