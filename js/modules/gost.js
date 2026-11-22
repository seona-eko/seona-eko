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
  var H = 3600e3;

  function langLinks() {
    return '<div class="g-lang" id="g-lang" role="group" aria-label="Jezik / Language / Sprache">' + ['hr', 'en', 'de'].map(function (l) {
      return '<button type="button" data-lang="' + l + '" aria-pressed="' + (I18n.lang() === l) + '">' + l.toUpperCase() + '</button>';
    }).join('') + '</div>';
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

  /** Zeitangabe vorn abtrennen: „16:30 Jagdhaus“ → zeit 16:30, ort „Jagdhaus“. */
  function teile(txt) {
    var m = String(txt || '').trim().match(/^(?:(?:gegen|oko|around|ca\.?|um|u)\s+)?(\d{1,2})[:.h](\d{2})\s*(?:h|Uhr)?\s*[,–—-]?\s*(.*)$/i);
    return m ? { zeit: m[1].padStart(2, '0') + ':' + m[2], h: +m[1], min: +m[2], ort: m[3] } : { zeit: '', ort: String(txt || '').trim() };
  }
  function amTag(iso, p) { var d = UI.parseISO(iso); d.setHours(p.h, p.min, 0, 0); return d; }
  function tagIso(off) { var d = new Date(Date.now() + off * 864e5); return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0'); }

  /** Ansitz einordnen: Abhol- und Rückkehrzeit als Datum (falls erkennbar), Morgen- oder Abendansitz. */
  function termin(a) {
    var d = String(a.datum).slice(0, 10), p = teile(a.polazak), r = teile(a.povratak);
    var ab = p.zeit ? amTag(d, p) : null, zu = r.zeit ? amTag(d, r) : null;
    if (ab && zu && zu < ab) zu = new Date(zu.getTime() + 864e5);
    var ende = zu || (ab ? new Date(ab.getTime() + 4 * H) : amTag(d, { h: 23, min: 59 }));
    return { a: a, datum: d, p: p, r: r, ab: ab, ende: ende, morgen: ab ? ab.getHours() < 12 : null };
  }

  /** Gruß nach Tageszeit; die Nacht endet 3 Std. vor Sonnenaufgang (wer zum Morgenansitz aufsteht, liest „Guten Morgen“). */
  function tageszeit(now) {
    var s = Geo.sunTimes(now, CENTER[0], CENTER[1]), n = now.getTime(), rise = s.rise.getTime(), set = s.set.getTime();
    var gruss = n < rise - 3 * H ? 'nacht' : now.getHours() < 11 ? 'morgen' : now.getHours() < 17 ? 'tag' : now.getHours() < 22 ? 'abend' : 'nacht';
    var himmel = n < rise - 1.5 * H || n > set + 0.75 * H ? 'nacht' : n < rise + 2 * H ? 'morgen' : n < set - 2 * H ? 'tag' : 'abend';
    return { gruss: gruss, himmel: himmel, s: s };
  }

  /** Die eine Zeile unter dem Gruß: das Nächste, was für den Gast zählt. */
  function leitzeile(now, ts, liste) {
    var n = now.getTime(), heute = tagIso(0), morgen = tagIso(1);
    var lauf = liste.filter(function (x) { return x.ab && x.ab.getTime() <= n && x.ende.getTime() > n; })[0];
    if (lauf) return t('gOnHunt', { t: lauf.r.zeit || UI.fmtTime(lauf.ende) });
    var naechster = liste.filter(function (x) { return x.ende.getTime() > n && (x.datum === heute || x.datum === morgen); })[0];
    if (naechster && naechster.ab) {
      var bis = naechster.ab.getTime() - n, ort = naechster.p.ort ? ' · ' + naechster.p.ort : '';
      if (naechster.a._lov) return t('gMeeting') + ' ' + (naechster.datum === heute ? '' : UI.fmtDay(naechster.datum) + ' ') + naechster.p.zeit + ort;
      if (bis < 2 * H) return t('gPickupIn', { d: dauer(bis) }) + ort;
      if (naechster.datum === heute) return t('gPickupToday', { t: naechster.p.zeit }) + ort;
      if (now.getHours() >= 14 || n > ts.s.set.getTime() - H) return t('gPickupTomorrow', { t: naechster.p.zeit }) + ort;
    }
    var rise = ts.s.rise.getTime(), set = ts.s.set.getTime();
    if (n < rise) return t('gRiseAt', { t: UI.fmtTime(ts.s.rise) });
    if (n < set) return t('gSetAt', { t: UI.fmtTime(ts.s.set) });
    return t('gRiseTomorrow', { t: UI.fmtTime(Geo.sunTimes(new Date(n + 864e5), CENTER[0], CENTER[1]).rise) });
  }

  function hero(me, ts, zeile, now) {
    return '<section class="g-hero ' + ts.himmel + '" aria-label="' + esc(t('gWelcome')) + '">' +
      '<svg class="g-land" aria-hidden="true" viewBox="0 0 390 110" preserveAspectRatio="none">' +
        '<path class="l1" d="M0 84 C40 64 70 76 100 68 C130 60 150 74 185 64 C220 56 250 72 285 62 C320 54 350 70 390 60 L390 110 L0 110 Z"/>' +
        '<path class="l2" d="M0 96 C50 84 90 92 140 86 C190 78 230 92 280 86 C330 78 360 90 390 86 L390 110 L0 110 Z"/></svg>' +
      langLinks() +
      '<div class="g-hi"><span class="g-date">' + esc(UI.fmtLong(now)) + '</span>' +
        '<h1>' + esc(t('gHi_' + ts.gruss) + (me && me.ime ? ', ' + me.ime.split(' ')[0] : '')) + '</h1>' +
        '<span class="g-line">' + esc(zeile) + '</span></div></section>';
  }

  function wochentag(iso) { return UI.fmtDate(iso, { weekday: 'short' }).replace('.', ''); }

  function programmZeile(x, now) {
    var heute = x.datum === tagIso(0), vorbei = x.ende.getTime() < now.getTime();
    var art = x.a._lov ? t('gDrive') : x.morgen === null ? t('gYourHunt') : t(x.morgen ? 'gMorning' : 'gEvening');
    var ort = [x.a.ceka, x.p.ort].filter(Boolean).join(' · ');
    return '<li class="' + (heute && !vorbei ? 'heute' : '') + (vorbei ? ' vorbei' : '') + '">' +
      '<span class="g-tag-d"><b>' + esc(heute ? t('gToday') : wochentag(x.datum)) + '</b><span>' + esc(UI.fmtDate(x.datum, { day: 'numeric', month: 'short' })) + '</span></span>' +
      '<span class="g-tx"><span class="g-zeit"><b>' + esc(x.p.zeit || '—') + '</b><span>' + esc(art) + '</span></span>' +
      (ort ? '<span class="g-ort">' + esc(ort) + '</span>' : '') +
      (x.a.povratak ? '<span class="g-mehr">' + esc(t('gBackAt', { t: x.r.zeit || x.a.povratak })) + '</span>' : '') +
      (x.a._lov ? '<a class="g-mehr g-karte" href="#/karta?lov=' + encodeURIComponent(x.a._lov.id) + '">' + esc(t('gMap')) + '&nbsp;→</a>' : '') +
      '</span></li>';
  }

  function programm(liste, me, now) {
    if (!liste.length) return '<section class="g-prog"><h2>' + esc(t('gProgram')) + '</h2><p class="g-leer">' + esc(t('gProgramSoon')) + '</p></section>';
    var zeilen = liste.map(function (x) { return programmZeile(x, now); }).join('');
    if (me && me.do && me.do >= tagIso(0)) {
      zeilen += '<li class="ende"><span class="g-tag-d"><b>' + esc(wochentag(me.do)) + '</b><span>' + esc(UI.fmtDate(me.do, { day: 'numeric', month: 'short' })) + '</span></span>' +
        '<span class="g-tx"><span class="g-zeit"><span>' + esc(t('gDeparture')) + '</span></span></span></li>';
    }
    // Hinweis des Teams zum nächsten Termin, als Zitat mit Absender
    var naechster = liste.filter(function (x) { return x.ende.getTime() > now.getTime(); })[0];
    var a = naechster && naechster.a, o = (a && a.orig) || {};
    var uebersetzt = a && ['napomena', 'polazak', 'povratak'].some(function (f) { return o[f] && o[f] !== a[f]; });
    return '<section class="g-prog"><h2>' + esc(t('gProgram')) + '</h2><ol>' + zeilen + '</ol>' +
      (a && a.napomena ? '<blockquote class="g-quote"><p>' + esc(a.napomena) + '</p>' + (a.pratitelj ? '<cite>' + esc(a.pratitelj) + '</cite>' : '') + '</blockquote>' : '') +
      (uebersetzt ? '<details class="orig"><summary>' + esc(t('showOriginal')) + '</summary>' +
        [o.polazak, o.povratak, o.napomena].filter(Boolean).map(function (x) { return '<p>' + esc(x) + '</p>'; }).join('') + '</details>' : '') +
      '</section>';
  }

  function begleiter(contacts, name) {
    var g = guideContact(name) || contacts[0];
    if (!g) return '';
    return '<div class="g-row g-guide"><span class="g-who"><span class="g-lbl">' + esc(t('gGuideRole')) + '</span><b>' + esc(g.ime) + '</b></span>' +
      (g.whatsapp ? '<a class="g-circle" target="_blank" rel="noopener" href="' + esc(Kontakt.waUrl(g.telefon)) + '" aria-label="' + esc(t('whatsapp') + ' ' + g.ime) + '">' + ICONS.chat + '</a>' : '') +
      '<a class="g-circle main" href="' + esc(Kontakt.telUrl(g.telefon)) + '" aria-label="' + esc(t('call') + ' ' + g.ime) + '">' + ICONS.phone + '</a></div>';
  }

  function draussen(ts) {
    var c = Wetter.current();
    var sonne = t('sunrise') + ' ' + UI.fmtTime(ts.s.rise) + ' · ' + t('sunset') + ' ' + UI.fmtTime(ts.s.set);
    if (!c) return '<a class="g-row g-out" href="#/wetter"><span class="g-who"><span class="g-lbl">' + esc(t('gOutside')) + '</span>' +
      '<span>' + esc(navigator.onLine ? '…' : t('weatherOffline')) + '</span><small>' + esc(sonne) + '</small></span></a>';
    var k = Wetter.kind(c.weather_code);
    var wind = t('windFrom', { d: Wetter.dirName(c.wind_direction_10m, I18n.lang()) }) + ' · ' + Math.round(c.wind_speed_10m) + ' km/h';
    return '<a class="g-row g-out" href="#/wetter" aria-label="' + esc(t('weatherTitle')) + '"><span class="g-who"><span class="g-lbl">' + esc(t('gOutside')) + '</span>' +
      '<span>' + esc(t('w_' + k) + ', ' + wind) + '</span><small>' + esc(sonne) + '</small></span>' +
      '<b class="g-temp">' + Math.round(c.temperature_2m) + '°</b></a>';
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

  function daten() {
    var snap = Store.snapshot() || {};
    var me = App.isGost() ? snap.gost : null;
    // Drückjagden mit eigenem Stand erscheinen im Programm wie ein Termin (Treffpunkt statt Abholung)
    var lovs = (App.isGost() ? (snap.lovovi || []) : []).map(function (l) {
      var mein = (l.staende || []).filter(function (x) { return x.moj; })[0];
      return { datum: l.datum, polazak: l.sastanak || '', ceka: mein ? t('standN', { n: mein.nr }) : '', napomena: l.napomenaGost || '', pratitelj: '', _lov: l };
    });
    var liste = (App.isGost() ? (snap.ansitzi || []) : []).concat(lovs).map(termin).sort(function (x, y) {
      return (x.ab || UI.parseISO(x.datum)) - (y.ab || UI.parseISO(y.datum));
    });
    var contacts = Store.kontakti().filter(function (k) { return App.isGost() || k.zaGoste; });
    return { me: me, liste: liste, contacts: contacts };
  }

  App.route('gost', {
    nav: 'gost',
    render: function () {
      var now = new Date(), ts = tageszeit(now), d = daten();
      var naechster = d.liste.filter(function (x) { return x.ende.getTime() > now.getTime(); })[0];
      return '<div class="g-page">' + hero(d.me, ts, leitzeile(now, ts, d.liste), now) +
        '<div class="g-body">' +
        (App.isGost() ? '' : '<p class="g-preview">' + esc(t('guestPreviewNote')) + '</p>') +
        programm(d.liste, d.me, now) +
        begleiter(d.contacts, naechster && naechster.a.pratitelj) +
        draussen(ts) +
        '<p class="g-small">' + esc(t('gSeasonHint')) + ' <a href="#/gostinfo">' + esc(t('gAnsitzRules')) + '&nbsp;→</a></p>' +
        '<a class="g-sos" href="tel:112">' + esc(t('emergency')) + ' 112</a>' +
        '</div></div>';
    },
    mount: function (el) {
      UI.$$('#g-lang button', el).forEach(function (b) { b.onclick = function () { App.setLang(b.getAttribute('data-lang')); }; });
      Wetter.refresh();
      himmelOben();
    }
  });

  /** Infos für Gäste: Regeln auf dem Hochsitz, heute Jagdzeit, alle Kontakte, Hinweise, Code. */
  App.route('gostinfo', {
    nav: 'gostinfo',
    render: function () {
      var d = daten(), today = UI.todayISO();
      var offen = LOVOSTAJ.groups.filter(function (g) {
        return g.vrsta !== 'Ostalo' && g.rows.some(function (r) { return Lovostaj.isOpen(r, today); });
      }).map(function (g) { return t(g.key); });
      return (App.isGost() ? '' : UI.back('#/gost', t('navGost'))) +
        '<div class="page-head"><h1>' + esc(t('navInfos')) + '</h1></div>' +
        '<div class="g-info">' +
        '<section><h2>' + esc(t('gAnsitzRules')) + '</h2><ol class="safety">' + REGELN.map(function (k) { return '<li>' + esc(t(k)) + '</li>'; }).join('') + '</ol>' +
          '<p class="g-small">' + esc(t('gAnsitzNote')) + '</p></section>' +
        '<section><h2>' + esc(t('gSeasonToday')) + '</h2><p>' + esc(offen.length ? offen.join(' · ') : t('nothingOpen')) + '</p>' +
          '<p class="g-small">' + esc(t('gSeasonHint')) + ' <a href="#/lovostaj">' + esc(t('allSeasons')) + '&nbsp;→</a></p></section>' +
        '<section><h2>' + esc(t('gContact')) + '</h2><div class="panel contact-panel">' + Kontakt.block(d.contacts, { emergency: true }) + '</div></section>' +
        '<p class="legal">' + esc(t('gLegalAnsitz')) + '</p>' +
        '<div class="btn-row"><button type="button" class="btn small ghost" id="g-code">' + esc(t('changeCode')) + '</button></div></div>';
    },
    mount: function (el) {
      var c = el.querySelector('#g-code'); if (c) c.onclick = function () { App.openSetup(false); };
    }
  });

  return { guideContact: guideContact };
})();
