/**
 * Reviereinrichtungen (Hochsitze, Kirrungen, Salzlecken …). Symbole aus der QField-Feldkarte.
 * Rechte (Server prüft verbindlich): Jäger legen neu an und melden Zustand/Bemerkung/Foto;
 * das Team verschiebt und löscht (abgebaute Einrichtungen werden gelöscht, kein eigener Zustand mehr).
 */
var Objekti = (function () {
  var esc = UI.esc, t = I18n.t;
  // „bodensitz“ wird nicht mehr angeboten (alte Einträge bleiben lesbar); dafür „biljeska“ = Notiz auf der Karte
  var ARTEN = ['kanzel', 'leiter', 'drueckjagdbock', 'kirrung', 'salzlecke', 'suhle', 'fuetterung', 'schranke', 'kamera', 'zentrale', 'jagdhuette', 'biljeska'];
  function isNotiz(art) { return art === 'biljeska'; }
  var STANJA = ['dobro', 'popravak', 'neupotrebljivo'];
  var BADGE = { dobro: 'ok', popravak: 'warn', neupotrebljivo: 'warn', uklonjen: 'muted' };

  function byId(id) { return Store.objekti().filter(function (o) { return o.id === id; })[0]; }
  function name(o) { return I18n.objekt(o.art) + (o.broj ? ' ' + o.broj : '') + (o.naziv ? ' · ' + o.naziv : ''); }

  function openDetail(id) {
    var o = byId(id);
    if (!o) return;
    var up = App.isUprava();
    var kv = [[t('lblLoviste'), o.lokacija], [t('objStanje'), isNotiz(o.art) ? '' : I18n.stanje(o.stanje)], [t('lblNapomena'), o.napomena],
      [t('lblGps'), o.lat + ', ' + o.lon], [t('lastChange'), (o.updatedBy || '') + (o.updatedAt ? ' · ' + UI.fmtStamp(Number(o.updatedAt)) : '')]]
      .filter(function (x) { return x[1] && String(x[1]).trim(); });
    UI.openSheet('<div style="display:flex;gap:12px;align-items:center"><img alt="" src="' + (ICONS.objekt[o.art] || '') + '" style="width:40px;height:40px">' +
      '<div><h2 style="margin:0">' + esc(name(o)) + '</h2>' + (isNotiz(o.art) ? '' : '<span class="badge ' + (BADGE[o.stanje] || 'muted') + '">' + esc(I18n.stanje(o.stanje || 'dobro')) + '</span>') +
      (o._pending ? ' <span class="badge muted">' + esc(t('stPending')) + '</span>' : '') + '</div></div>' +
      (o._error ? '<p class="error-msg">' + esc(o._error) + '</p>' : '') +
      '<dl class="kv">' + kv.map(function (x) { return '<dt>' + esc(x[0]) + '</dt><dd>' + esc(x[1]) + '</dd>'; }).join('') + '</dl>' +
      '<div id="obj-photo"></div>' +
      '<div class="stack" style="margin-top:12px">' +
      '<button type="button" class="btn dark block" data-report>' + ICONS.edit + esc(up ? t('edit') : t('reportState')) + '</button>' +
      (up ? '<div class="btn-row"><button type="button" class="btn" data-move>' + ICONS.move + esc(t('move')) + '</button>' +
        '<button type="button" class="btn danger" data-del>' + ICONS.trash + esc(t('delete')) + '</button></div>' : '') +
      '</div>', function (el, api) {
      var box = el.querySelector('#obj-photo');
      if (o._fotoLocal) box.innerHTML = '<div class="photo-preview"><img alt="" src="' + o._fotoLocal + '"></div>';
      else if (o.foto) {
        box.innerHTML = '<button type="button" class="btn small">' + ICONS.photo + esc(t('showPhoto')) + '</button>';
        box.querySelector('button').onclick = async function () {
          box.innerHTML = '<p class="hint">' + esc(t('loading')) + '</p>';
          try { var src = await UI.loadPhoto(o.foto); box.innerHTML = '<div class="photo-preview"><img alt="" src="' + src + '" style="max-width:100%;max-height:none"></div>'; }
          catch (e) { box.innerHTML = '<p class="hint">' + esc(t('photoOffline')) + '</p>'; }
        };
      }
      el.querySelector('[data-report]').onclick = function () { api.close(); setTimeout(function () { openForm({ id: o.id }); }, 240); };
      var mv = el.querySelector('[data-move]');
      if (mv) mv.onclick = function () {
        api.close();
        if (Karta.isOpen()) Karta.startMove(o.id); else App.go('#/karta?move=' + encodeURIComponent(o.id));
      };
      var del = el.querySelector('[data-del]');
      if (del) del.onclick = async function () {
        api.close();
        if (await UI.confirm(t('delete'), t('confirmDeleteObj', { name: name(o) }), t('delete'), true)) {
          await Store.queueUpsert('objekt', { id: o.id, deleted: true });
          App.syncNow({ quiet: true });
        }
      };
    }, { noFocus: true });
  }

  /** opts: { lat, lon } für neu, { id } für bestehend */
  async function openForm(opts) {
    var o = opts.id ? byId(opts.id) : null;
    var up = App.isUprava();
    var limited = o && !up; // Jäger an bestehender Einrichtung: nur Zustand, Bemerkung, Foto
    var lastArt = (await DB.get('lastObjArt')) || 'kanzel';
    var st = { art: o ? o.art : lastArt, stanje: o ? (o.stanje || 'dobro') : 'dobro', foto: '' };
    var lok = o ? o.lokacija : await Geo.lovisteAt(opts.lat, opts.lon);
    var stanja = STANJA.concat(o && o.stanje === 'uklonjen' ? ['uklonjen'] : []); // alter Wert bleibt sichtbar

    var html = '<h2>' + esc(o ? (limited ? t('reportState') : t('editObjekt')) : t('newObjekt')) + '</h2>' +
      '<p class="sheet-sub">' + esc(lok || t('outsideGrounds')) + (o ? ' · ' + esc(name(o)) : '') + '</p>' +
      '<form id="obj-form" novalidate>' +
      (limited ? '' : '<div class="field"><span class="field-label req">' + esc(t('objArt')) + '</span><div class="icon-grid" id="art-grid">' +
        ARTEN.map(function (a) {
          return '<button type="button" data-art="' + a + '" aria-pressed="' + (st.art === a) + '"><img alt="" src="' + ICONS.objekt[a] + '"><span>' + esc(I18n.objekt(a)) + '</span></button>';
        }).join('') + '</div></div>' +
        '<div class="grid-2" id="obj-names"><div class="field" id="obj-broj-wrap"><label class="field-label" for="obj-broj">' + esc(t('objBroj')) + '</label><input type="text" id="obj-broj" value="' + esc(o ? o.broj : '') + '" inputmode="text"></div>' +
        '<div class="field"><label class="field-label" id="obj-naziv-label" for="obj-naziv">' + esc(t('objNaziv')) + '</label><input type="text" id="obj-naziv" value="' + esc(o ? o.naziv : '') + '"></div></div>') +
      '<div class="field" id="stanje-wrap"><span class="field-label">' + esc(t('objStanje')) + '</span><div class="seg" id="stanje-seg">' +
      stanja.map(function (s) { return '<button type="button" data-st="' + s + '" aria-pressed="' + (st.stanje === s) + '">' + esc(I18n.stanje(s)) + '</button>'; }).join('') + '</div>' +
      '</div>' +
      '<div class="field"><label class="field-label" for="obj-nap">' + esc(t('lblNapomena')) + '</label><textarea id="obj-nap" placeholder="' + esc(t('phObjNapomena')) + '">' + esc(o ? o.napomena : '') + '</textarea></div>' +
      '<div class="field"><label class="field-label" for="obj-foto">' + esc(t('lblFoto')) + '</label><input type="file" id="obj-foto" accept="image/*" capture="environment"><div class="photo-preview" id="obj-prev"></div></div>' +
      '<div class="error-msg" id="obj-err" hidden></div>' +
      '<button type="submit" class="btn primary block" style="margin-top:6px">' + esc(t('btnSave')) + '</button></form>';

    UI.openSheet(html, function (el, api) {
      // Notiz: nur Titel, Text und Foto — keine Nummer, kein Zustand
      function forArt() {
        var n = isNotiz(st.art);
        var bw = el.querySelector('#obj-broj-wrap'), sw = el.querySelector('#stanje-wrap'), nl = el.querySelector('#obj-naziv-label'), ng = el.querySelector('#obj-names');
        if (bw) bw.hidden = n;
        if (sw) sw.hidden = n;
        if (nl) nl.textContent = t(n ? 'objTitel' : 'objNaziv');
        if (ng) ng.classList.toggle('grid-2', !n);
        var ta = el.querySelector('#obj-nap'); if (ta) ta.placeholder = n ? '' : t('phObjNapomena');
      }
      UI.$$('#art-grid button', el).forEach(function (b) {
        b.onclick = function () { st.art = b.getAttribute('data-art'); UI.$$('#art-grid button', el).forEach(function (x) { x.setAttribute('aria-pressed', String(x === b)); }); forArt(); };
      });
      forArt();
      UI.$$('#stanje-seg button', el).forEach(function (b) {
        b.onclick = function () { st.stanje = b.getAttribute('data-st'); UI.$$('#stanje-seg button', el).forEach(function (x) { x.setAttribute('aria-pressed', String(x === b)); }); };
      });
      el.querySelector('#obj-foto').onchange = async function (ev) {
        st.foto = ''; el.querySelector('#obj-prev').innerHTML = '';
        try { st.foto = await UI.readPhoto(ev.target.files[0], 1024); if (st.foto) el.querySelector('#obj-prev').innerHTML = '<img alt="" src="' + st.foto + '">'; } catch (e) {}
      };
      el.querySelector('#obj-form').addEventListener('submit', async function (ev) {
        ev.preventDefault();
        var nap = el.querySelector('#obj-nap').value.trim();
        var rec;
        if (limited) {
          rec = { id: o.id, stanje: st.stanje, napomena: nap };
        } else {
          var notiz = isNotiz(st.art);
          rec = { id: o ? o.id : Store.uuid(), art: st.art, broj: notiz ? '' : el.querySelector('#obj-broj').value.trim(), naziv: el.querySelector('#obj-naziv').value.trim(),
            stanje: notiz ? 'dobro' : st.stanje, napomena: nap, lokacija: lok || '' };
          if (!o) { rec.lat = opts.lat; rec.lon = opts.lon; }
          await DB.set('lastObjArt', st.art);
        }
        if (st.foto) rec.fotoNew = st.foto;
        await Store.queueUpsert('objekt', rec);
        api.close();
        UI.haptic();
        UI.toast(navigator.onLine ? t('savedSending') : t('savedLocal'));
        App.syncNow({ quiet: true });
      });
    });
  }

  return { openDetail: openDetail, openForm: openForm, name: name };
})();
