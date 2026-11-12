/**
 * Gäste & Ansitze (nur Team): Gast anlegen → QR-Code zum Einrichten seines Handys (Link mit dem persönlichen Code
 * des Gastes und der Sprache — alles nach „#", wird also nicht an den Webserver übertragen) → Ansitz-Termine zuweisen.
 * Auf dem iPhone hat die installierte App einen eigenen Speicher: Dort tippt der Gast den Code unter dem QR einmal ein.
 * Der Gast sieht nur seine eigenen Termine; Sitze stehen als Name/Nummer da, nie mit Koordinaten.
 */
var Gosti = (function () {
  var esc = UI.esc, t = I18n.t;

  function gosti() { return Store.gosti(); }
  function ansitziOf(id) { return Store.ansitzi().filter(function (a) { return a.gostId === id; }).sort(function (a, b) { return String(a.datum).localeCompare(String(b.datum)); }); }
  function byId(id) { return gosti().filter(function (g) { return g.id === id; })[0]; }
  function stay(g) { return UI.fmtRange(g.od ? String(g.od).slice(0, 10) : '', g.do ? String(g.do).slice(0, 10) : ''); }

  /** Persönlicher Code: gut lesbar, ohne verwechselbare Zeichen (0/O, 1/I/L); der Server prüft ihn bei jedem Abruf. */
  function noviKod() {
    var Z = 'ABCDEFGHJKMNPQRSTUVWXYZ23456789', k = '', a = new Uint32Array(6);
    crypto.getRandomValues(a);
    for (var i = 0; i < 6; i++) k += Z.charAt(a[i] % Z.length);
    return k;
  }
  /** Start-Link für das Gästehandy. */
  function startUrl(g) {
    var base = location.origin + location.pathname;
    return base + '#/start?c=' + encodeURIComponent(g.kod || '') + '&l=' + encodeURIComponent(g.jezik || 'en');
  }
  function oruzjeTxt(g) { return g.oruzje === 'posudba' ? t('weaponLoan') : g.oruzje === 'vlastito' ? t('weaponOwn') : ''; }
  function qrSvg(text) {
    try {
      var qr = qrcode(0, 'M');
      qr.addData(text);
      qr.make();
      return qr.createSvgTag({ cellSize: 6, margin: 2, scalable: true });
    } catch (e) { return ''; }
  }

  App.route('gosti', {
    nav: 'lovovi',
    render: function (ctx) {
      var id = ctx.params[0] ? decodeURIComponent(ctx.params[0]) : '';
      if (id) return renderDetail(byId(id));
      var today = UI.todayISO();
      var aktuell = gosti().filter(function (g) { return !g.do || String(g.do).slice(0, 10) >= today; })
        .sort(function (a, b) { return String(a.od).localeCompare(String(b.od)); });
      var frueher = gosti().filter(function (g) { return g.do && String(g.do).slice(0, 10) < today; }).reverse().slice(0, 10);
      function row(g) {
        var next = ansitziOf(g.id).filter(function (a) { return String(a.datum).slice(0, 10) >= today; })[0];
        return '<li><a class="row" href="#/gosti/' + encodeURIComponent(g.id) + '"><span class="r-icon">' + ICONS.group + '</span>' +
          '<span class="r-main"><span class="r-title">' + esc(g.ime) + '</span><span class="r-sub">' + esc(stay(g) + (g.oruzje ? ' · ' + oruzjeTxt(g) : '') + (next ? ' · ' + t('gNextAnsitz') + ': ' + UI.fmtDay(String(next.datum).slice(0, 10)) : '')) + '</span></span>' +
          (g._pending ? '<span class="badge muted">' + esc(t('stPending')) + '</span>' : '') + ICONS.chevron.replace('<svg', '<svg class="chev"') + '</a></li>';
      }
      return JagdTabs('gosti') + '<div class="page-head"><p>' + esc(t('guestsSub')) + '</p></div>' + // Reiter „Gäste“ ist die Überschrift
        '<button type="button" class="btn primary block" id="new-gost" style="margin-bottom:14px">' + ICONS.plus + esc(t('newGuest')) + '</button>' +
        (aktuell.length ? '<div class="section-title"><h2>' + esc(t('guestsCurrent')) + '</h2></div><div class="panel flush"><ul class="list">' + aktuell.map(row).join('') + '</ul></div>'
          : '<div class="panel">' + UI.emptyState('group', t('guestsEmpty'), t('guestsEmptyText')) + '</div>') +
        (frueher.length ? '<div class="section-title"><h2>' + esc(t('guestsPast')) + '</h2></div><div class="panel flush"><ul class="list">' + frueher.map(row).join('') + '</ul></div>' : '') +
        '<a class="btn ghost block" href="#/gost" style="margin-top:14px">' + ICONS.group + esc(t('guestView')) + '</a>';
    },
    mount: function (el, ctx) {
      var id = ctx.params[0] ? decodeURIComponent(ctx.params[0]) : '';
      if (!id) {
        el.querySelector('#new-gost').onclick = function () { openGuestForm(null); };
        return;
      }
      var g = byId(id);
      if (!g) return;
      // Gäste von vor dem persönlichen Code bekommen ihren Code beim ersten Öffnen
      if (!g.kod) {
        Store.queueUpsert('gost', { id: g.id, kod: noviKod() }).then(function () { App.syncNow({ quiet: true }); });
        return;
      }
      var e = el.querySelector('#edit-gost'); if (e) e.onclick = function () { openGuestForm(g); };
      var a = el.querySelector('#new-ansitz'); if (a) a.onclick = function () { openAnsitzForm(g, null); };
      UI.$$('[data-ansitz]', el).forEach(function (b) {
        b.onclick = function () { openAnsitzForm(g, Store.ansitzi().filter(function (x) { return x.id === b.getAttribute('data-ansitz'); })[0]); };
      });
      var cp = el.querySelector('#copy-link');
      if (cp) cp.onclick = function () {
        var url = startUrl(g);
        var done = function () { UI.toast(t('linkCopied')); };
        if (navigator.clipboard) navigator.clipboard.writeText(url).then(done, function () { el.querySelector('#link-text').select(); });
        else el.querySelector('#link-text').select();
      };
      var wa = el.querySelector('#send-wa');
      if (wa) wa.href = 'https://wa.me/?text=' + encodeURIComponent(t('guestLinkMsg', { n: g.ime }) + ' ' + startUrl(g));
      var del = el.querySelector('#del-gost');
      if (del) del.onclick = async function () {
        if (await UI.confirm(t('delete'), t('confirmDeleteGuest', { n: g.ime }), t('delete'), true)) {
          await Store.queueUpsert('gost', { id: g.id, deleted: true });
          App.syncNow({ quiet: true });
          App.go('#/gosti');
        }
      };
    }
  });

  function renderDetail(g) {
    if (!g) return '<div class="page-head"><h1>' + esc(t('notFound')) + '</h1></div><a class="btn" href="#/gosti">' + esc(t('back')) + '</a>';
    var list = ansitziOf(g.id);
    var url = g.kod ? startUrl(g) : '';
    return UI.back('#/gosti', t('tabGuests')) + '<div class="page-head">' +
      '<h1>' + esc(g.ime) + '</h1><p>' + esc([stay(g), g.jezik ? g.jezik.toUpperCase() : '', oruzjeTxt(g)].filter(Boolean).join(' · ')) + '</p></div>' +
      '<div class="section-title" style="margin-top:4px"><h2>' + esc(t('qrTitle')) + '</h2></div>' +
      '<div class="panel qr-panel">' +
      (url ? '<div class="qr">' + qrSvg(url) + '</div><p class="hint" style="text-align:center;margin:8px 0 4px">' + esc(t('qrHint')) + '</p>' +
        '<p class="guest-code">' + esc(t('lblCode')) + ' <b>' + esc(g.kod) + '</b></p><p class="hint" style="text-align:center;margin:0 0 12px">' + esc(t('guestCodeHint')) + '</p>' +
        '<input type="text" id="link-text" readonly value="' + esc(url) + '" aria-label="Link" style="font-size:.8rem">' +
        '<div class="btn-row" style="margin-top:10px"><button type="button" class="btn small" id="copy-link">' + esc(t('copyLink')) + '</button>' +
        '<a class="btn small" id="send-wa" target="_blank" rel="noopener" href="#">' + ICONS.chat + esc(t('sendWhatsApp')) + '</a></div>'
        : UI.skel(2)) + '</div>' +
      '<div class="section-title"><h2>' + esc(t('ansitzTitle')) + '</h2></div>' +
      '<button type="button" class="btn primary block" id="new-ansitz" style="margin-bottom:10px">' + ICONS.plus + esc(t('newAnsitz')) + '</button>' +
      (list.length ? '<div class="panel flush"><ul class="list">' + list.map(function (a) {
        return '<li><button type="button" class="row" data-ansitz="' + esc(a.id) + '"><span class="r-icon">' + ICONS.calendar + '</span>' +
          '<span class="r-main"><span class="r-title">' + esc(UI.fmtDay(String(a.datum).slice(0, 10)) + (a.polazak ? ' · ' + a.polazak : '')) + '</span>' +
          '<span class="r-sub">' + esc([a.ceka, a.pratitelj, a.povratak ? t('gReturn') + ' ' + a.povratak : ''].filter(Boolean).join(' · ')) + '</span></span>' +
          (a._pending ? '<span class="badge muted">' + esc(t('stPending')) + '</span>' : '') + '</button></li>';
      }).join('') + '</ul></div>' : '<div class="panel"><p class="hint" style="margin:0">' + esc(t('ansitzEmpty')) + '</p></div>') +
      '<div class="btn-row" style="margin-top:16px"><button type="button" class="btn" id="edit-gost">' + ICONS.edit + esc(t('edit')) + '</button>' +
      '<button type="button" class="btn danger" id="del-gost">' + ICONS.trash + esc(t('delete')) + '</button></div>';
  }

  function openGuestForm(g) {
    UI.openSheet('<h2>' + esc(g ? t('editGuest') : t('newGuest')) + '</h2><form id="f" novalidate>' +
      '<div class="field"><label class="field-label req" for="ime">' + esc(t('guestName')) + '</label><input type="text" id="ime" value="' + esc(g ? g.ime : '') + '"></div>' +
      '<div class="grid-2"><div class="field"><label class="field-label" for="od">' + esc(t('stayFrom')) + '</label><input type="date" id="od" value="' + esc(g ? String(g.od || '').slice(0, 10) : UI.todayISO()) + '"></div>' +
      '<div class="field"><label class="field-label" for="do">' + esc(t('stayTo')) + '</label><input type="date" id="do" value="' + esc(g ? String(g.do || '').slice(0, 10) : '') + '"></div></div>' +
      '<div class="field"><span class="field-label">' + esc(t('lblLang')) + '</span><div class="seg" id="jz">' + ['hr', 'en', 'de'].map(function (l) {
        return '<button type="button" data-v="' + l + '" aria-pressed="' + (((g && g.jezik) || 'en') === l) + '">' + l.toUpperCase() + '</button>';
      }).join('') + '</div></div>' +
      '<div class="field"><span class="field-label">' + esc(t('lblWeapon')) + '</span><div class="seg" id="oz">' + [['vlastito', 'weaponOwn'], ['posudba', 'weaponLoan']].map(function (o) {
        return '<button type="button" data-v="' + o[0] + '" aria-pressed="' + ((g && g.oruzje) === o[0]) + '">' + esc(t(o[1])) + '</button>';
      }).join('') + '</div></div>' +
      '<div class="field"><label class="field-label" for="nap">' + esc(t('lblNapomenaIntern')) + '</label><textarea id="nap">' + esc(g ? g.napomena : '') + '</textarea></div>' +
      '<div class="error-msg" id="err" hidden></div>' +
      '<button type="submit" class="btn primary block">' + esc(t('btnSave')) + '</button></form>', function (el, api) {
      var jezik = (g && g.jezik) || 'en', oruzje = (g && g.oruzje) || '';
      UI.$$('#oz button', el).forEach(function (b) { b.onclick = function () { oruzje = b.getAttribute('data-v'); UI.$$('#oz button', el).forEach(function (x) { x.setAttribute('aria-pressed', String(x === b)); }); }; });
      UI.$$('#jz button', el).forEach(function (b) { b.onclick = function () { jezik = b.getAttribute('data-v'); UI.$$('#jz button', el).forEach(function (x) { x.setAttribute('aria-pressed', String(x === b)); }); }; });
      el.querySelector('#f').onsubmit = async function (ev) {
        ev.preventDefault();
        var ime = el.querySelector('#ime').value.trim();
        if (!ime) { var e = el.querySelector('#err'); e.textContent = t('errGuestName'); e.hidden = false; return; }
        // Gast-ID: zufällig und lang genug, dass sie nicht zu erraten ist (steckt im QR-Link)
        var rec = { id: g ? g.id : 'g-' + Store.uuid().replace(/-/g, '').slice(0, 20), ime: ime, od: el.querySelector('#od').value, do: el.querySelector('#do').value, jezik: jezik, oruzje: oruzje, napomena: el.querySelector('#nap').value.trim(),
          kod: (g && g.kod) || noviKod() };
        await Store.queueUpsert('gost', rec);
        api.close(); App.syncNow({ quiet: true });
        App.go('#/gosti/' + encodeURIComponent(rec.id));
      };
    });
  }

  function openAnsitzForm(g, a) {
    var guides = Store.kontakti().map(function (k) { return k.ime; });
    var seats = Store.objekti().filter(function (o) { return ['kanzel', 'leiter', 'bodensitz', 'drueckjagdbock'].indexOf(o.art) !== -1 && o.stanje !== 'uklonjen'; })
      .map(function (o) { return Objekti.name(o) + (o.lokacija ? ' (' + Strecke.shortLov(o.lokacija) + ')' : ''); });
    UI.openSheet('<h2>' + esc(a ? t('editAnsitz') : t('newAnsitz')) + '</h2><p class="sheet-sub">' + esc(g.ime) + '</p><form id="f" novalidate>' +
      '<div class="grid-2"><div class="field"><label class="field-label req" for="d">' + esc(t('lblDatum')) + '</label><input type="date" id="d" value="' + esc(a ? String(a.datum).slice(0, 10) : UI.todayISO()) + '"></div>' +
      '<div class="field"><label class="field-label" for="pov">' + esc(t('gReturn')) + '</label><input type="text" id="pov" value="' + esc(a ? a.povratak : '') + '" placeholder="' + esc(t('phReturn')) + '"></div></div>' +
      '<div class="field"><label class="field-label" for="pol">' + esc(t('gPickup')) + '</label><input type="text" id="pol" value="' + esc(a ? a.polazak : '') + '" placeholder="' + esc(t('phPickup')) + '"></div>' +
      '<div class="field"><label class="field-label" for="ck">' + esc(t('gSeat')) + '</label><input type="text" id="ck" list="seats" value="' + esc(a ? a.ceka : '') + '" placeholder="' + esc(t('phSeat')) + '">' +
      '<datalist id="seats">' + seats.map(function (s) { return '<option value="' + esc(s) + '">'; }).join('') + '</datalist><p class="hint">' + esc(t('seatHint')) + '</p></div>' +
      '<div class="field"><label class="field-label" for="pr">' + esc(t('gGuide')) + '</label><input type="text" id="pr" list="guides" value="' + esc(a ? a.pratitelj : '') + '">' +
      '<datalist id="guides">' + guides.map(function (s) { return '<option value="' + esc(s) + '">'; }).join('') + '</datalist></div>' +
      '<div class="field"><label class="field-label" for="nap">' + esc(t('lblNapomenaGost')) + '</label><textarea id="nap" placeholder="' + esc(t('phAnsitzNote')) + '">' + esc(a ? a.napomena : '') + '</textarea></div>' +
      '<button type="submit" class="btn primary block">' + esc(t('btnSave')) + '</button>' +
      (a ? '<button type="button" class="btn danger block" style="margin-top:10px" id="del">' + ICONS.trash + esc(t('delete')) + '</button>' : '') + '</form>', function (el, api) {
      el.querySelector('#f').onsubmit = async function (ev) {
        ev.preventDefault();
        var d = el.querySelector('#d').value; if (!d) return;
        await Store.queueUpsert('ansitz', { id: a ? a.id : Store.uuid(), gostId: g.id, datum: d, polazak: el.querySelector('#pol').value.trim(),
          ceka: el.querySelector('#ck').value.trim(), povratak: el.querySelector('#pov').value.trim(), pratitelj: el.querySelector('#pr').value.trim(), napomena: el.querySelector('#nap').value.trim() });
        api.close(); App.syncNow({ quiet: true });
      };
      var del = el.querySelector('#del');
      if (del) del.onclick = async function () { await Store.queueUpsert('ansitz', { id: a.id, deleted: true }); api.close(); App.syncNow({ quiet: true }); };
    });
  }

  return { startUrl: startUrl, ansitziOf: ansitziOf, qrSvg: qrSvg };
})();
