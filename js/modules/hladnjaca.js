/**
 * Hladnjača — jedes Stück: eingelagert (Datum) → entnommen (Datum, Art, Käufer); jeweils mit „wer" (Server: updatedBy).
 * Frist: Großwild binnen 7 Tagen zum zugelassenen Betrieb (VO (EG) 853/2004 Anh. III Abschn. IV).
 */
(function () {
  var esc = UI.esc, t = I18n.t;
  var BIG_GAME = ['Jelen obični', 'Jelen lopatar', 'Divlja svinja', 'Srna', 'Muflon'];

  function days(iso) { return UI.daysSince(String(iso || '').slice(0, 10)); }

  /** Stand eines Stücks und nächster Schritt. */
  function stage(w) { return w.predanoDatum ? { key: 'out', next: null } : { key: 'in', next: 'out' }; }

  function data() {
    var wb = Store.wildbret(), byId = {};
    Store.strecke().forEach(function (r) { byId[r.id] = r; });
    var all = Object.keys(wb).map(function (k) { return wb[k]; });
    var inCold = all.filter(function (w) { return w.hladnjacaOd && !w.predanoDatum; })
      .sort(function (a, b) { return String(a.hladnjacaOd).localeCompare(String(b.hladnjacaOd)); });
    var out = all.filter(function (w) { return w.predanoDatum; })
      .sort(function (a, b) { return String(b.predanoDatum).localeCompare(String(a.predanoDatum)); }).slice(0, 15);
    var without = Store.strecke().filter(function (r) { return !wb[r.id] && UI.daysSince(r.datum) <= 10 && BIG_GAME.indexOf(r.vrsta) !== -1; });
    return { byId: byId, inCold: inCold, out: out, without: without };
  }

  function title(r) { return r ? Strecke.title(r) + ' · ' + r.tezina + ' kg' : t('unknownPiece'); }
  function sub(w, r) { return (r ? '#' + r.brojMarkice + ' · ' + Strecke.shortLov(r.lokacija) + ' · ' : '') + t('sinceDate', { d: UI.fmtDate(String(w.hladnjacaOd).slice(0, 10)) }); }

  function rowCold(w, r) {
    var d = days(w.hladnjacaOd);
    return '<li><button type="button" class="row" data-wb="' + esc(w.id) + '"><span class="r-icon">' + ICONS.forSpecies(r ? r.vrsta : '') + '</span>' +
      '<span class="r-main"><span class="r-title">' + esc(title(r)) + '</span><span class="r-sub">' + esc(sub(w, r)) + '</span></span>' +
      '<span class="r-end"><b class="num" style="' + (d >= 7 ? 'color:var(--warn)' : '') + '">' + (d == null ? '—' : d) + '</b>' + esc(t('daysShort')) + '</span></button></li>';
  }

  function renderZelle(D) {
    var old = D.inCold.filter(function (w) { return days(w.hladnjacaOd) >= 7; }).length;
    return (old ? '<div class="panel alert-panel soft"><b>' + esc(t('coldOld', { n: old })) + '</b></div>' : '') +
      (D.inCold.length ? '<div class="panel flush"><ul class="list">' + D.inCold.map(function (w) { return rowCold(w, D.byId[w.id]); }).join('') + '</ul></div>'
        : '<div class="panel">' + UI.emptyState('cold', t('coldEmpty'), t('coldEmptyText')) + '</div>') +
      (D.without.length ? '<div class="section-title"><h2>' + esc(t('notInCold')) + '</h2></div><div class="panel flush"><ul class="list">' +
        D.without.map(function (r) {
          return '<li><div class="row"><span class="r-icon">' + ICONS.forSpecies(r.vrsta) + '</span><span class="r-main"><span class="r-title">' + esc(Strecke.title(r) + ' · ' + r.tezina + ' kg') + '</span>' +
            '<span class="r-sub">' + esc('#' + r.brojMarkice + ' · ' + UI.fmtDay(r.datum)) + '</span></span>' +
            '<button type="button" class="btn small" data-put="' + esc(r.id) + '">' + esc(t('putInCold')) + '</button></div></li>';
        }).join('') + '</ul></div>' : '') +
      (D.out.length ? '<div class="section-title"><h2>' + esc(t('outTitle')) + '</h2></div><div class="panel flush"><ul class="list">' +
        D.out.map(function (w) {
          var r = D.byId[w.id];
          return '<li><button type="button" class="row" data-wb="' + esc(w.id) + '"><span class="r-icon">' + ICONS.forSpecies(r ? r.vrsta : '') + '</span><span class="r-main"><span class="r-title">' + esc(title(r)) + '</span>' +
            '<span class="r-sub">' + esc(UI.fmtDate(w.predanoDatum) + ' · ' + (w.izlaz ? t('izlaz_' + w.izlaz) : '') + (w.kupac ? ' · ' + w.kupac : '')) + '</span></span></button></li>';
        }).join('') + '</ul></div>' : '');
  }

  App.route('hladnjaca', {
    nav: 'odstrjel',
    render: function () {
      var D = data();
      return Strecke.tabs('cold') + '<div class="page-head"><div class="eyebrow">' + esc(t('wildbret')) + '</div><h1>' + esc(t('coldTitle', { n: D.inCold.length })) + '</h1></div>' +
        renderZelle(D) +
        '<p class="source">' + esc(t('coldSource')) + '</p>';
    },
    mount: function (el) {
      UI.$$('[data-put]', el).forEach(function (b) {
        b.onclick = async function () {
          var r = Store.strecke().filter(function (x) { return x.id === b.getAttribute('data-put'); })[0];
          await Store.queueUpsert('wildbret', { id: r.id, hladnjacaOd: UI.nowLocalISO() });
          App.syncNow({ quiet: true });
        };
      });
      UI.$$('[data-wb]', el).forEach(function (b) { b.onclick = function () { openDetail(b.getAttribute('data-wb')); }; });
    }
  });

  function openOut(w, r) {
    var izlaz = 'kupac';
    UI.openSheet('<h2>' + esc(t('next_out')) + '</h2><p class="sheet-sub">' + esc(title(r)) + '</p>' +
      '<form id="f"><div class="field"><span class="field-label">' + esc(t('izlazKind')) + '</span><div class="seg" id="iz">' +
      ['kupac', 'vlastito', 'uklanjanje'].map(function (k) {
        return '<button type="button" data-v="' + k + '" aria-pressed="' + (izlaz === k) + '">' + esc(t('izlaz_' + k)) + '</button>';
      }).join('') + '</div></div>' +
      '<div class="grid-2"><div class="field"><label class="field-label req" for="d">' + esc(t('outOn')) + '</label><input type="date" id="d" value="' + UI.todayISO() + '"></div>' +
      '<div class="field"><label class="field-label" for="k">' + esc(t('kupac')) + '</label><input type="text" id="k" value="' + esc(w.kupac || '') + '"></div></div>' +
      '<div class="error-msg" id="err" hidden></div>' +
      '<button type="submit" class="btn primary block">' + esc(t('next_out')) + '</button></form>', function (el, api) {
      UI.$$('#iz button', el).forEach(function (b) {
        b.onclick = function () { izlaz = b.getAttribute('data-v'); UI.$$('#iz button', el).forEach(function (x) { x.setAttribute('aria-pressed', String(x === b)); }); };
      });
      el.querySelector('#f').onsubmit = async function (ev) {
        ev.preventDefault();
        var d = el.querySelector('#d').value; if (!d) return;
        await Store.queueUpsert('wildbret', { id: w.id, predanoDatum: d, izlaz: izlaz, kupac: el.querySelector('#k').value.trim() });
        api.close(); App.syncNow({ quiet: true });
      };
    });
  }

  function openDetail(id) {
    var w = Store.wildbret()[id];
    var r = Store.strecke().filter(function (x) { return x.id === id; })[0];
    if (!w) return;
    var st = stage(w);
    var kv = [
      [t('step_in'), UI.fmtDate(String(w.hladnjacaOd).slice(0, 10)) + ' (' + days(w.hladnjacaOd) + ' ' + t('daysShort') + ')'],
      [t('trich'), w.trihinela ? I18n.nalaz(w.trihinela) : ''],
      [t('step_out'), w.predanoDatum ? UI.fmtDate(w.predanoDatum) + ' · ' + (w.izlaz ? t('izlaz_' + w.izlaz) : '') + (w.kupac ? ' · ' + w.kupac : '') : ''],
      [t('lastChange'), (w.updatedBy || '') + (w.updatedAt ? ' · ' + UI.fmtStamp(Number(w.updatedAt)) : '')]
    ].filter(function (x) { return x[1]; });
    UI.openSheet('<h2>' + esc(title(r)) + '</h2><p class="sheet-sub">' + esc(r ? '#' + r.brojMarkice + ' · ' + UI.fmtDay(r.datum) : '') + '</p>' +
      '<dl class="kv">' + kv.map(function (x) { return '<dt>' + esc(x[0]) + '</dt><dd>' + esc(x[1]) + '</dd>'; }).join('') + '</dl>' +
      (st.next ? '<button type="button" class="btn primary block" data-next>' + esc(t('next_out')) + '</button>' : '') +
      '<details class="more"><summary>' + esc(t('editData')) + '</summary>' +
      '<form id="wb-edit" novalidate>' +
      '<div class="field"><label class="field-label" for="e-tr">' + esc(t('trich')) + '</label><select id="e-tr">' + ['', 'ceka', 'negativan', 'pozitivan'].map(function (v) { return '<option value="' + v + '"' + ((w.trihinela || '') === v ? ' selected' : '') + '>' + esc(v ? I18n.nalaz(v) : '—') + '</option>'; }).join('') + '</select></div>' +
      '<div class="field"><label class="field-label" for="e-nap">' + esc(t('lblNapomena')) + '</label><textarea id="e-nap">' + esc(w.napomena || '') + '</textarea></div>' +
      '<button type="submit" class="btn block">' + esc(t('btnSave')) + '</button></form></details>', function (el, api) {
      var nx = el.querySelector('[data-next]');
      if (nx) nx.onclick = function () { api.close(); setTimeout(function () { openOut(w, r); }, 240); };
      el.querySelector('#wb-edit').onsubmit = async function (ev) {
        ev.preventDefault();
        await Store.queueUpsert('wildbret', { id: w.id, trihinela: el.querySelector('#e-tr').value, napomena: el.querySelector('#e-nap').value.trim() });
        api.close(); App.syncNow({ quiet: true });
      };
    }, { noFocus: true });
  }

  window.Hladnjaca = { stage: stage, data: data };
})();
