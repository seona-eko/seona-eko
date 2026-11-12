/**
 * Tour für das Team (nicht für Gäste): geht in jede Seite hinein und zeigt dort die einzelnen Knöpfe.
 * Ein „Lichtkegel" (dunkler Rahmen mit Loch) liegt über dem gezeigten Element, die Karte mit dem Text sitzt
 * oben oder unten — je nachdem, wo das Element ist. Einmal nach der ersten Anmeldung, jederzeit überspringbar,
 * erneut über Više → Tour. Texte: tour_<key>_t / tour_<key>_x in i18n.js.
 */
var Tutorial = (function () {
  var esc = UI.esc, t = I18n.t;
  // [Seite, Element (leer = ohne Markierung), Text-Schlüssel]
  // Kurz halten: eine Karte je Hauptsache (früher 31 Schritte, zu lang für eine kurze Einführung)
  var STEPS = [
    ['#/home', '', 'start'],
    ['#/home', '.quick a.primary', 'homeNew'],
    ['#/odstrjel/novi', '.loc-buttons', 'formOrt'],
    ['#/karta', '#bottomnav [data-nav="karta"]', 'karta'],
    ['#/karta', '#fab-locate', 'kartaGps'],
    ['#/karta', '#fab-add', 'kartaAdd'],
    ['#/odstrjel?tab=popis', '#bottomnav [data-nav="odstrjel"]', 'strecke'],
    ['#/hladnjaca', '#cold-tabs', 'cold'],
    ['#/lovovi', '#bottomnav [data-nav="lovovi"]', 'jagden'],
    ['#/home', '', 'ende']
  ];
  // Bereich über dem Text (welche Seite gerade gezeigt wird)
  var BEREICH = { home: 'navHome', karta: 'navKarta', odstrjel: 'navOdstrjel', hladnjaca: 'tileCold', lovovi: 'navLovovi', gosti: 'tabGuests', vise: 'navVise' };

  var el = null, hole = null, i = 0, dir = 1, target = null, token = 0;

  function vars() {
    return { neu: t('newOdstrjel'), standort: t('myLocation'), karte: t('pickOnMap'), kuehl: t('coldCheck'), stueck: t('addToLov') };
  }

  function bereich(route) {
    if (/^#\/odstrjel\/novi/.test(route)) return t('newOdstrjel');
    var name = route.replace(/^#\//, '').split(/[/?]/)[0];
    return t(BEREICH[name] || 'navHome');
  }

  /** Element suchen; die Seite rendert evtl. noch (Karte lädt asynchron) → kurz warten. */
  function find(sel) {
    return new Promise(function (resolve) {
      if (!sel) return resolve(null);
      var n = 0;
      (function look() {
        var x = document.querySelector(sel);
        if (x && x.getBoundingClientRect().width) return resolve(x);
        if (++n > 15) return resolve(null);
        setTimeout(look, 100);
      })();
    });
  }

  function place() {
    if (!el) return;
    var card = el.querySelector('.tut-card');
    if (!target) {
      hole.style.display = 'none';
      el.classList.add('dim');
      card.className = 'tut-card mid';
      return;
    }
    el.classList.remove('dim');
    var r = target.getBoundingClientRect(), pad = 6;
    hole.style.display = 'block';
    hole.style.left = (r.left - pad) + 'px'; hole.style.top = (r.top - pad) + 'px';
    hole.style.width = (r.width + 2 * pad) + 'px'; hole.style.height = (r.height + 2 * pad) + 'px';
    card.className = 'tut-card ' + (r.top + r.height / 2 > window.innerHeight / 2 ? 'top' : 'bottom');
  }

  async function show() {
    var my = ++token;
    var s = STEPS[i], last = i === STEPS.length - 1;
    if (location.hash !== s[0]) { App.go(s[0]); await new Promise(function (r) { setTimeout(r, 120); }); }
    var x = await find(s[1]);
    if (my !== token || !el) return;
    if (s[1] && !x) { // Element gibt es gerade nicht (z. B. noch keine Einträge) → Schritt auslassen
      i += dir;
      if (i < 0) i = 0;
      if (i >= STEPS.length) return close();
      return show();
    }
    target = x;
    if (target && !target.closest('#bottomnav') && target.id !== 'sync-pill') {
      try { target.scrollIntoView({ block: 'center' }); } catch (e) {}
    }
    var v = vars();
    var card = el.querySelector('.tut-card');
    card.innerHTML =
      '<div class="tut-top"><span class="tut-count">' + esc(bereich(s[0])) + ' · ' + (i + 1) + '/' + STEPS.length + '</span>' +
      (last ? '' : '<button type="button" class="tut-skip" data-skip>' + esc(t('tutSkip')) + '</button>') + '</div>' +
      '<h2 id="tut-title">' + esc(t('tour_' + s[2] + '_t', v)) + '</h2>' +
      '<p>' + esc(t('tour_' + s[2] + '_x', v)) + '</p>' +
      '<div class="tut-bar"><i style="width:' + Math.round((i + 1) / STEPS.length * 100) + '%"></i></div>' +
      '<div class="btn-row">' + (i ? '<button type="button" class="btn" data-back>' + esc(t('back')) + '</button>' : '') +
      '<button type="button" class="btn primary" data-next>' + esc(last ? t('btnDone') : t('tutNext')) + '</button></div>';
    var skip = card.querySelector('[data-skip]'); if (skip) skip.onclick = close;
    var back = card.querySelector('[data-back]'); if (back) back.onclick = function () { dir = -1; i--; show(); };
    card.querySelector('[data-next]').onclick = function () { if (last) close(); else { dir = 1; i++; show(); } };
    place();
    setTimeout(place, 80); // nach dem Scrollen
    try { card.querySelector('[data-next]').focus({ preventScroll: true }); } catch (e) {}
  }

  function onResize() { place(); }

  function open() {
    if (el) return;
    i = 0; dir = 1; target = null;
    UI.closeSheet(true);
    el = document.createElement('div');
    el.className = 'tut-scrim';
    el.setAttribute('role', 'dialog');
    el.setAttribute('aria-modal', 'true');
    el.setAttribute('aria-labelledby', 'tut-title');
    el.innerHTML = '<div class="tut-hole"></div><div class="tut-card"></div>';
    hole = el.querySelector('.tut-hole');
    document.body.appendChild(el);
    document.body.classList.add('tut-open');
    window.addEventListener('resize', onResize);
    window.addEventListener('scroll', onResize, { passive: true });
    show();
  }

  async function close() {
    token++;
    window.removeEventListener('resize', onResize);
    window.removeEventListener('scroll', onResize);
    document.body.classList.remove('tut-open');
    if (el) { el.remove(); el = null; hole = null; }
    target = null;
    App.go('#/home');
    await DB.set('tourDone', Date.now());
  }

  /** Einmal automatisch zeigen: nur Team, nur wenn noch nicht gesehen und gerade keine Einrichtung offen ist. */
  async function maybeShow() {
    if (!App.isUprava() || el) return;
    if (await DB.get('tourDone')) return;
    if (document.getElementById('setup').classList.contains('show')) return;
    App.go('#/home');
    open();
  }

  return { open: open, maybeShow: maybeShow, steps: function () { return STEPS.map(function (s) { return s[2]; }); } };
})();
