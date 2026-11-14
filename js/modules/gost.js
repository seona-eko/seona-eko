/**
 * Gästeansicht für die Ansitzjagd (Rolle „gost", nur lesen) + Kontakt-Baustein (auch Team-Ansicht).
 * Oben „Ihr Ansitz heute" (vom Team eingetragen: Abholung, Sitz als Name, Rückkehr, Begleiter), dann Wetter & Wind,
 * Kontakt, heute offene Jagdzeiten (ohne Planzahlen — was geschossen wird, bespricht der Begleiter) und Hinweise
 * für den Ansitz. Der Server liefert Gästen nur Kontakte und die eigenen Ansitz-Termine (keine Koordinaten).
 * Die Drückjagd-Fassung liegt in _archiv/pwa_2026-09-24_gast-drueckjagd/ (kommt in Welle 2 zurück).
 */
var Kontakt = (function () {
  var esc = UI.esc, t = I18n.t;
  function digits(tel) { return String(tel || '').replace(/[^\d]/g, ''); }
  function waUrl(tel) { return 'https://wa.me/' + digits(tel); }
  function telUrl(tel) { return 'tel:+' + digits(tel); }

  /** Große Kontaktknöpfe (erster Kontakt hervorgehoben) + Notruf. */
  function block(list, opts) {
    opts = opts || {};
    var html = (list || []).map(function (k, i) {
      var main = i === 0 && opts.big;
      return '<div class="contact' + (main ? ' main' : '') + '">' +
        '<div class="c-who"><b>' + esc(k.ime) + '</b><span>' + esc(k.uloga || '') + '</span><span class="num">' + esc(k.telefon) + '</span></div>' +
        '<div class="c-actions">' +
        (k.whatsapp ? '<a class="btn ' + (main ? 'wa' : 'small') + '" href="' + esc(waUrl(k.telefon)) + '" target="_blank" rel="noopener">' + ICONS.chat + esc(t('whatsapp')) + '</a>' : '') +
        '<a class="btn ' + (main ? '' : 'small ') + 'ghost" href="' + esc(telUrl(k.telefon)) + '">' + ICONS.phone + esc(t('call')) + '</a>' +
        '</div></div>';
    }).join('');
    if (!html) html = '<p class="hint" style="margin:0">' + esc(t('noContacts')) + '</p>';
    if (opts.emergency) html += '<a class="row emergency" href="tel:112"><span class="r-icon">' + ICONS.alert + '</span><span class="r-main"><span class="r-title">' + esc(t('emergency')) + ' 112</span><span class="r-sub">' + esc(t('emergencySub')) + '</span></span></a>';
    return html;
  }
  return { block: block, waUrl: waUrl, telUrl: telUrl };
})();

var Gost = (function () {
  var esc = UI.esc, t = I18n.t;
  var CENTER = [45.452, 17.957];
  var REGELN = ['gA1', 'gA2', 'gA3', 'gA4', 'gA5', 'gA6'];

  function langSeg() {
    return '<div class="g-lang" id="g-lang" role="group" aria-label="Jezik / Language / Sprache">' + ['hr', 'en', 'de'].map(function (l) {
      return '<button type="button" data-lang="' + l + '" aria-pressed="' + (I18n.lang() === l) + '">' + l.toUpperCase() + '</button>';
    }).join('') + '</div>';
  }

  /** Heute offene Wildarten, je Art einmal (Symbol + Name). */
  function openGroups() {
    var today = UI.todayISO(), out = [];
    LOVOSTAJ.groups.forEach(function (g) {
      if (g.vrsta === 'Ostalo') return;
      if (g.rows.some(function (r) { return Lovostaj.isOpen(r, today); })) out.push(g);
    });
    return out;
  }

  /** Kontakt des Begleiters, falls er in den Kontakten steht (Name gleich oder enthalten). */
  function guideContact(name) {
    var n = String(name || '').trim().toLowerCase();
    if (!n) return null;
    return Store.kontakti().filter(function (k) {
      var i = String(k.ime || '').trim().toLowerCase();
      return i && (i === n || n.indexOf(i) !== -1 || i.indexOf(n) !== -1);
    })[0] || null;
  }

  function dauer(ms) {
    var min = Math.max(1, Math.round(ms / 60000));
    if (min < 60) return min + ' min';
    var h = Math.floor(min / 60), m = min % 60, de = I18n.lang() === 'de';
    return h + (de ? ' Std.' : ' h') + (m ? ' ' + m + (de ? ' Min.' : ' min') : '');
  }

  /** Tageszeit, Lage der Sonne auf dem Bogen (0…1) und die Zeile unter dem Gruß. */
  function himmel(now, heute) {
    var s = Geo.sunTimes(now, CENTER[0], CENTER[1]);
    var morgen = Geo.sunTimes(new Date(now.getTime() + 864e5), CENTER[0], CENTER[1]);
    var n = now.getTime(), rise = s.rise.getTime(), set = s.set.getTime(), H = 3600e3;
    var zeit, pos, zeile;
    if (n < rise - 1.5 * H || n > set + 0.75 * H) { zeit = 'nacht'; pos = n < rise ? 0.02 : 0.98; }
    else if (n < rise + 2 * H) zeit = 'morgen';
    else if (n < set - 2 * H) zeit = 'tag';
    else zeit = 'abend';
    if (pos == null) pos = Math.max(0.02, Math.min(0.98, (n - rise) / (set - rise)));
    var pickup = heute && heute.polazak;
    if (n < rise) zeile = rise - n < 3 * H ? t('gRiseIn', { t: dauer(rise - n) }) : t('gRiseTomorrow', { t: UI.fmtTime(s.rise) });
    else if (n > set) zeile = t('gRiseTomorrow', { t: UI.fmtTime(morgen.rise) });
    else if (pickup && zeit !== 'abend') zeile = t('gPickupToday', { t: pickup });
    else if (set - n < 2 * H) zeile = t('gSetIn', { t: dauer(set - n) });
    else zeile = t('gDaylight', { t: dauer(set - n) });
    // quadratische Bézier-Kurve wie im Entwurf: (8,90) → Kontrollpunkt (173,−36) → (338,90)
    var x = (1 - pos) * (1 - pos) * 8 + 2 * (1 - pos) * pos * 173 + pos * pos * 338;
    var y = (1 - pos) * (1 - pos) * 90 + 2 * (1 - pos) * pos * -36 + pos * pos * 90;
    return { zeit: zeit, x: x.toFixed(1), y: y.toFixed(1), zeile: zeile, rise: s.rise, set: s.set };
  }

  function hero(me, heute) {
    var now = new Date(), h = himmel(now, heute);
    var gruss = t('gHi_' + h.zeit) + (me && me.ime ? ', ' + me.ime.split(' ')[0] : '');
    return '<section class="g-hero ' + h.zeit + '" aria-label="' + esc(t('gToday')) + '">' +
      '<svg class="g-land" aria-hidden="true" viewBox="0 0 390 120" preserveAspectRatio="none">' +
        '<path class="l1" d="M0 92 C40 70 70 84 100 74 C130 64 150 80 185 70 C220 60 250 78 285 68 C320 58 350 76 390 66 L390 120 L0 120 Z"/>' +
        '<path class="l3" d="M44 92 l7 -20 l7 20 Z M60 94 l6 -16 l6 16 Z M300 88 l8 -24 l8 24 Z M318 90 l6 -16 l6 16 Z"/>' +
        '<path class="l2" d="M0 104 C50 90 90 100 140 92 C190 84 230 100 280 92 C330 84 360 98 390 92 L390 120 L0 120 Z"/></svg>' +
      '<svg class="g-arc" aria-hidden="true" viewBox="0 0 346 96">' +
        '<path d="M8 90 Q173 -36 338 90" fill="none" stroke-width="1.5" stroke-dasharray="3 6"/>' +
        '<circle class="glow" cx="' + h.x + '" cy="' + h.y + '" r="14"/><circle class="core" cx="' + h.x + '" cy="' + h.y + '" r="7"/></svg>' +
      langSeg() +
      '<div class="g-hi"><span class="g-date">' + esc(UI.fmtLong(now)) + '</span>' +
        '<h1>' + esc(gruss) + '</h1><span class="g-line">' + esc(h.zeile) + '</span></div>' +
      '<div class="g-sun"><span>' + ICONS.sunrise + UI.fmtTime(h.rise) + '</span><span>' + ICONS.sunset + UI.fmtTime(h.set) + '</span></div>' +
      '</section>';
  }

  /** Zeitangabe vorn abtrennen: „16:30 Jagdhaus“ → groß 16:30, klein „Jagdhaus“. */
  function teile(txt) {
    var m = String(txt || '').trim().match(/^(?:(?:gegen|oko|around|ca\.?)\s+)?(\d{1,2}[:.]\d{2})\s*[,–—-]?\s*(.*)$/i);
    return m ? { gross: m[1].replace('.', ':'), klein: m[2] } : { gross: String(txt || '').trim(), klein: '' };
  }

  function schritt(icon, label, gross, klein, cls) {
    return '<li class="' + (cls || '') + '"><span class="g-step-i">' + ICONS[icon] + '</span>' +
      '<span class="g-step-t"><span class="lbl">' + esc(label) + '</span><b>' + esc(gross) + '</b>' + (klein ? '<span>' + esc(klein) + '</span>' : '') + '</span></li>';
  }

  function ansitzCard(a, isToday) {
    var guide = guideContact(a.pratitelj);
    var o = a.orig || {};
    var translated = ['napomena', 'polazak', 'povratak'].some(function (f) { return o[f] && o[f] !== a[f]; });
    var d = String(a.datum).slice(0, 10);
    var p = teile(a.polazak), r = teile(a.povratak);
    var steps = (a.polazak ? schritt('car', t('gPickup'), p.gross, p.klein, 'first') : '') +
      (a.ceka ? schritt('seat', t('gSeat'), a.ceka, '') : '') +
      (a.povratak || a.pratitelj ? schritt('homeward', t('gReturn'), r.gross || '—', a.pratitelj ? t('gPickedUp', { n: a.pratitelj }) : r.klein, 'ok') : '');
    return '<section class="g-card g-ansitz">' +
      '<div class="g-card-h"><h2>' + esc(isToday ? t('gYourAnsitz') : t('gNextAnsitz')) + '</h2>' +
        '<span class="g-tag">' + esc(isToday ? t('gPlanned') : UI.fmtDate(d, { weekday: 'short', day: 'numeric', month: 'short' })) + '</span></div>' +
      (steps ? '<ol class="g-steps">' + steps + '</ol>' : '') +
      (a.napomena ? '<p class="g-note">' + esc(a.napomena) + '</p>' : '') +
      (translated ? '<details class="orig"><summary>' + esc(t('showOriginal')) + '</summary>' +
        [o.polazak, o.povratak, o.napomena].filter(Boolean).map(function (x) { return '<p>' + esc(x) + '</p>'; }).join('') + '</details>' : '') +
      (guide && guide.whatsapp ? '<a class="g-wa" target="_blank" rel="noopener" href="' + esc(Kontakt.waUrl(guide.telefon)) + '">' + ICONS.chat + esc(t('gWriteGuide', { n: guide.ime })) + '</a>' : '') +
      '</section>';
  }

  /** Weitere Termine kompakt: Datum links, Hochsitz und Abholung rechts. */
  function terminZeile(a) {
    var d = String(a.datum).slice(0, 10);
    return '<li><span class="g-dt"><b>' + UI.parseISO(d).getDate() + '</b>' + esc(UI.fmtDate(d, { month: 'short' })) + '</span>' +
      '<span class="g-tx"><b>' + esc(a.ceka || t('gNextAnsitz')) + '</b>' + (a.polazak ? '<span>' + esc(t('gPickup')) + ' ' + esc(a.polazak) + '</span>' : '') + '</span></li>';
  }

  function windCard() {
    var c = Wetter.current();
    if (!c) return '<a class="g-card g-wind" href="#/wetter">' + (navigator.onLine ? UI.skel(2) : '<span class="hint">' + esc(t('weatherOffline')) + '</span>') + '</a>';
    var k = Wetter.kind(c.weather_code), hrs = Wetter.hours(6);
    var gust = hrs[0] && hrs[0].gust;
    return '<a class="g-card g-wind" href="#/wetter" aria-label="' + esc(t('weatherTitle')) + '">' +
      '<div class="g-wind-top"><span class="g-wind-i">' + WetterUI.arrow(c.wind_direction_10m, 28) + '</span>' +
        '<span class="g-wind-v"><span>' + esc(t('windFrom', { d: Wetter.dirName(c.wind_direction_10m, I18n.lang()) })) + '</span>' +
        '<b>' + Math.round(c.wind_speed_10m) + ' <small>km/h' + (gust ? ' · ' + esc(t('gusts')) + ' ' + Math.round(gust) : '') + '</small></b></span>' +
        '<span class="g-temp"><b>' + Math.round(c.temperature_2m) + '°</b><span>' + esc(t('w_' + k)) + '</span></span></div>' +
      (hrs.length ? '<div class="g-hours">' + hrs.map(function (h, i) {
        return '<span class="' + (i === 0 ? 'now' : '') + '"><small>' + (i === 0 ? esc(t('gNow')) : String(h.time.getHours()).padStart(2, '0')) + '</small>' +
          WetterUI.arrow(h.dir, 18) + '<b>' + Math.round(h.wind) + '</b></span>';
      }).join('') + '</div>' : '') + '</a>';
  }

  function kontaktCard(list, guideName) {
    var rows = (list || []).map(function (k) {
      var istBegleiter = guideName && guideContact(guideName) === k;
      return '<div class="g-person"><span class="g-ava">' + esc(String(k.ime || '?').trim().charAt(0).toUpperCase()) + '</span>' +
        '<span class="g-who"><b>' + esc(k.ime) + '</b><span>' + esc([k.uloga, istBegleiter ? t('gGuideRole') : ''].filter(Boolean).join(' · ')) + '</span></span>' +
        (k.whatsapp ? '<a class="g-round wa" target="_blank" rel="noopener" href="' + esc(Kontakt.waUrl(k.telefon)) + '" aria-label="' + esc(t('whatsapp') + ' ' + k.ime) + '">' + ICONS.chat + '</a>' : '') +
        '<a class="g-round" href="' + esc(Kontakt.telUrl(k.telefon)) + '" aria-label="' + esc(t('call') + ' ' + k.ime) + '">' + ICONS.phone + '</a></div>';
    }).join('');
    if (!rows) rows = '<p class="hint g-pad">' + esc(t('noContacts')) + '</p>';
    return '<section class="g-card flush g-contact" aria-label="' + esc(t('gContact')) + '">' + rows +
      '<a class="g-sos" href="tel:112"><i></i>' + esc(t('emergency')) + ' 112<span>' + esc(t('emergencySub')) + '</span></a></section>';
  }

  function saisonCard() {
    var gs = openGroups();
    return '<section class="g-card g-season" aria-label="' + esc(t('gSeasonToday')) + '">' +
      '<div class="g-card-h small"><span>' + esc(t('gSeasonToday')) + '</span><a href="#/lovostaj">' + esc(t('gAll')) + '</a></div>' +
      (gs.length ? '<div class="g-species">' + gs.map(function (g) {
        return '<span><i>' + ICONS.forSpecies(g.vrsta) + '</i>' + esc(t(g.key)) + '</span>';
      }).join('') + '</div>' : '<span class="hint">' + esc(t('nothingOpen')) + '</span>') +
      '<p class="g-fine">' + esc(t('gSeasonHint')) + '</p></section>';
  }

  function regelnCard() {
    return '<details class="g-card g-rules"><summary><span class="g-step-i ok">' + ICONS.shield + '</span>' +
      '<span class="g-who"><b>' + esc(t('gAnsitzRules')) + '</b><span>' + esc(t('gRulesSub', { n: REGELN.length })) + '</span></span>' + ICONS.chevron + '</summary>' +
      '<ol class="safety">' + REGELN.map(function (k) { return '<li>' + esc(t(k)) + '</li>'; }).join('') + '</ol>' +
      '<p class="g-fine">' + esc(t('gAnsitzNote')) + '</p></details>';
  }

  // Glasstreifen hinter der Statusleiste ausblenden, solange oben der Himmel zu sehen ist
  function himmelOben() {
    var h = document.documentElement;
    if (h && h.classList) h.classList.toggle('am-himmel', !!document.querySelector('.g-hero') && window.scrollY < 200);
  }
  if (window.addEventListener) {
    window.addEventListener('scroll', himmelOben, { passive: true });
    window.addEventListener('hashchange', function () { setTimeout(himmelOben, 0); });
  }

  App.route('gost', {
    nav: 'gost',
    render: function () {
      var todayIso = UI.todayISO();
      var snap = Store.snapshot() || {};
      var me = App.isGost() ? snap.gost : null;
      var list = App.isGost() ? (snap.ansitzi || []) : [];
      var heute = list.filter(function (a) { return String(a.datum).slice(0, 10) === todayIso; });
      var spaeter = list.filter(function (a) { return String(a.datum).slice(0, 10) > todayIso; });
      var contacts = Store.kontakti().filter(function (k) { return App.isGost() || k.zaGoste; });
      var haupt = heute.length ? heute : spaeter.slice(0, 1);
      var rest = spaeter.slice(heute.length ? 0 : 1);

      return '<div class="g-page">' + hero(me, heute[0]) +
        '<div class="g-body">' +
        (App.isGost() ? '' : '<p class="g-preview">' + esc(t('guestPreviewNote')) + '</p>') +
        haupt.map(function (a) { return ansitzCard(a, heute.length > 0); }).join('') +
        windCard() +
        kontaktCard(contacts, (haupt[0] || {}).pratitelj) +
        saisonCard() +
        regelnCard() +
        (rest.length ? '<section class="g-card flush g-more"><div class="g-card-h small g-pad"><span>' + esc(t('gMoreAnsitz')) + '</span></div><ul>' +
          rest.map(terminZeile).join('') + '</ul></section>' : '') +
        '<p class="legal">' + esc(t('gLegalAnsitz')) + '</p>' +
        '<div class="btn-row"><button type="button" class="btn small ghost" id="g-code">' + esc(t('changeCode')) + '</button></div>' +
        '</div></div>';
    },
    mount: function (el) {
      UI.$$('#g-lang button', el).forEach(function (b) { b.onclick = function () { App.setLang(b.getAttribute('data-lang')); }; });
      var c = el.querySelector('#g-code'); if (c) c.onclick = function () { App.openSetup(false); };
      Wetter.refresh();
      himmelOben();
    }
  });

  return { guideContact: guideContact };
})();
