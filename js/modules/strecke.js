/**
 * Odstrjel: Streckenliste des Jagdjahres + Plan (Soll/Ist je Altersklasse und Geschlecht).
 * Stats wird auch von Startseite und Drückjagd genutzt.
 */
var Stats = (function () {
  /** Abschüsse dieses Jagdjahres — plus alles, was noch in der Kühlzelle liegt oder kein lesbares Datum hat
   *  (sonst stünde ein Stück in der Kühlzelle, das in der Strecke fehlt). */
  function inJJ(list) {
    var jj = Store.jagdjahr(), cold = Store.coldIds();
    return list.filter(function (r) {
      var d = String(r.datum || '');
      return !/^\d{4}-\d{2}-\d{2}/.test(d) || (d >= jj.start && d <= jj.end) || cold[r.id];
    });
  }
  function filterLov(list, lok) { return lok && lok !== 'all' ? list.filter(function (r) { return r.lokacija === lok; }) : list; }

  /** Plan für eine Wildart: Zeilen mit soll/ist, m/ž getrennt. faktor = 3 (alle Lovišta) oder 1. */
  function planFor(vrsta, list, faktor) {
    var rows = (PLAN[vrsta] || []).map(function (p) {
      var hits = list.filter(function (r) { return r.vrsta === vrsta && p.klase.indexOf(r.dobnaKlasa) !== -1; });
      return {
        klase: p.klase, soll: p.soll * faktor, sollM: p.m != null ? p.m * faktor : null, sollZ: p.z != null ? p.z * faktor : null,
        ist: hits.length, istM: hits.filter(function (r) { return r.spol === 'm'; }).length,
        istZ: hits.filter(function (r) { return r.spol === 'ž'; }).length,
        pending: hits.filter(function (r) { return r._pending; }).length
      };
    });
    var all = list.filter(function (r) { return r.vrsta === vrsta; });
    var ohne = all.filter(function (r) { return !r.dobnaKlasa; }).length;
    var soll = (Store.quota()[vrsta] || 0) * faktor;
    return {
      rows: rows, soll: soll, ist: all.length, ohneKlasse: ohne,
      zensko: all.filter(function (r) { return r.spol === 'ž'; }).length,
      pending: all.filter(function (r) { return r._pending; }).length
    };
  }

  function summary(lok) {
    var list = filterLov(inJJ(Store.strecke()), lok);
    var faktor = lok && lok !== 'all' ? 1 : 3;
    var planned = list.filter(function (r) { return PLAN_SPECIES.indexOf(r.vrsta) !== -1; });
    var sollTotal = PLAN_SPECIES.reduce(function (s, v) { return s + (Store.quota()[v] || 0) * faktor; }, 0);
    var prasad = list.filter(function (r) { return r.vrsta === 'Divlja svinja' && r.dobnaKlasa === 'Tele/prase'; }).length;
    var krmace = list.filter(function (r) { return r.vrsta === 'Divlja svinja' && r.spol === 'ž' && r.dobnaKlasa !== 'Tele/prase'; }).length;
    return {
      list: list, ist: planned.length, soll: sollTotal, prasad: prasad, prasadSoll: 23 * faktor, krmace: krmace,
      zenskoPct: planned.length ? Math.round(planned.filter(function (r) { return r.spol === 'ž'; }).length / planned.length * 100) : null,
      pending: list.filter(function (r) { return r._pending; }).length
    };
  }
  return { inJJ: inJJ, planFor: planFor, summary: summary, filterLov: filterLov };
})();

var Strecke = (function () {
  var esc = UI.esc, t = I18n.t;
  var state = { tab: 'popis', lok: 'all', vrsta: 'all', sle: false };

  /*
   * SLE (Središnja lovna evidencija): jede Wildmarke muss binnen 7 Tagen nach dem Abschuss in der SLE ausgetragen werden
   * (Pravilnik o SLE, čl. 12). Die App erfasst zuerst; hier sieht man, was noch abzuschreiben ist (Spalte AA im Sheet).
   * Abschüsse vor SLE_OD gelten als schon eingetragen (vor Einführung dieser Liste).
   */
  var SLE_OD = '2026-10-05';
  var SLE_VRSTE = ['Jelen obični', 'Srna', 'Divlja svinja', 'Jelen lopatar', 'Muflon'];
  // Werte so, wie die SLE sie abfragt (kroatisch)
  var SLE_DOB = { 'Tele/prase': 'mladunčad', 'Pomladak': 'pomladak', 'Mlađa klasa': 'mlada', 'Srednja klasa': 'srednja', 'Zrela klasa': 'zrela' };
  /** null = keine SLE-Pflicht/alt; { done, left } = eingetragen bzw. Tage bis zur Frist (negativ = überfällig). */
  function sleInfo(r) {
    if (SLE_VRSTE.indexOf(r.vrsta) === -1 || !r.brojMarkice) return null;
    if (r.sle) return { done: true };
    var d = String(r.datum || '').slice(0, 10);
    if (!/^\d{4}-\d{2}-\d{2}$/.test(d) || d < SLE_OD) return null;
    return { done: false, left: 7 - UI.daysSince(d) };
  }
  function sleOpen(list) {
    return list.filter(function (r) { var i = sleInfo(r); return i && !i.done; })
      .sort(function (a, b) { return String(a.datum).localeCompare(String(b.datum)); });
  }
  function sleBadge(i) {
    var txt = i.left > 0 ? t('sleLeft', { n: i.left }) : i.left === 0 ? t('sleToday') : t('sleLate');
    return '<span class="badge ' + (i.left <= 1 ? 'warn' : 'muted') + '">' + esc(txt) + '</span>';
  }
  function hrDatum(d) { var m = String(d || '').match(/^(\d{4})-(\d{2})-(\d{2})/); return m ? m[3] + '.' + m[2] + '.' + m[1] + '.' : String(d || ''); }
  /** Eine Zeile zum Abschreiben in die SLE: Marke, Datum, Wildart, Geschlecht, Dob — kroatisch wie in der SLE. */
  function sleRowHtml(r) {
    return '<li><div class="row sle-row"><span class="r-icon">' + ICONS.forSpecies(r.vrsta) + '</span>' +
      '<span class="r-main"><span class="r-title"><button type="button" class="sle-copy num" data-copy="' + esc(r.brojMarkice) + '">#' + esc(r.brojMarkice) + '</button> · ' + esc(hrDatum(r.datum)) + '</span>' +
      '<span class="r-sub">' + esc([r.vrsta, r.spol === 'ž' ? 'žensko' : 'muško', SLE_DOB[r.dobnaKlasa] || r.dobnaKlasa || '—'].join(' · ')) + '</span>' +
      '<span class="r-sub">' + esc(r.lovac || '') + '</span></span>' +
      '<span class="r-end">' + sleBadge(sleInfo(r)) + '<button type="button" class="btn small dark" data-sle-done="' + esc(r.id) + '" style="margin-top:6px">' + ICONS.check + esc(t('sleDone')) + '</button></span></div></li>';
  }
  async function setSle(id, on) {
    await Store.queueUpsert('odstrjel', { id: id, sle: on ? UI.todayISO() : '' });
    UI.toast(t(on ? 'sleDoneToast' : 'sleUndoToast'));
    App.syncNow({ quiet: true });
  }

  function title(r) {
    if (r.vrsta && KATEGORIJA[r.vrsta] && r.spol) return kategorija(r.vrsta, r.spol, r.dobnaKlasa, I18n.lang());
    return I18n.species(r.vrsta);
  }

  function rowHtml(r) {
    var wb = Store.wildbret()[r.id];
    var end = r._error ? '<span class="badge warn">' + esc(t('stError')) + '</span>'
      : r._pending ? '<span class="badge muted">' + esc(t('stPending')) + '</span>'
      : (wb && wb.hladnjacaOd && !wb.predanoDatum ? '<span class="badge plain muted">' + esc(t('inCold')) + '</span>' : '');
    var si = App.isUprava() ? sleInfo(r) : null;
    if (si && !si.done) end += '<span style="display:block;margin-top:3px">' + sleBadge(si) + '</span>';
    return '<li><button type="button" class="row" data-id="' + esc(r.id) + '">' +
      '<span class="r-icon">' + ICONS.forSpecies(r.vrsta) + '</span>' +
      '<span class="r-main"><span class="r-title">' + esc(title(r)) + ' · <span class="num">' + esc(r.tezina) + ' kg</span></span>' +
      '<span class="r-sub">' + esc(UI.fmtDay(r.datum) + (r.vrijemeOdstrjela ? ' ' + r.vrijemeOdstrjela : '')) + ' · ' + esc(r.zona ? r.zona : shortLov(r.lokacija)) + ' · ' + esc(r.lovac) + '</span></span>' +
      '<span class="r-end">' + end + '<span class="num" style="display:block;margin-top:3px">#' + esc(r.brojMarkice) + '</span></span></button></li>';
  }

  function shortLov(l) { return String(l || '').replace(/^XIV\/\d+\s*/, ''); }

  function lovChips() {
    var opts = [['all', t('allGrounds')]].concat(Store.lovista().map(function (l) { return [l, shortLov(l)]; }));
    return '<div class="chips" id="lok-chips">' + opts.map(function (o) {
      return '<button type="button" class="chip" data-lok="' + esc(o[0]) + '" aria-pressed="' + (state.lok === o[0]) + '">' + esc(o[1]) + '</button>';
    }).join('') + '</div>';
  }

  function renderList(list) {
    if (state.sle) {
      var open = sleOpen(list);
      return '<p class="hint" style="margin:0 0 8px">' + esc(t('sleHint')) + '</p>' +
        (open.length ? '<div class="panel flush"><ul class="list">' + open.map(sleRowHtml).join('') + '</ul></div>'
          : '<div class="panel">' + UI.emptyState('check', t('sleEmpty'), '') + '</div>');
    }
    if (state.vrsta !== 'all') list = list.filter(function (r) { return r.vrsta === state.vrsta; });
    if (!list.length) {
      return '<div class="panel">' + UI.emptyState('list', t('emptyStreckeTitle'), t('emptyStreckeText'),
        '<a class="btn primary" href="#/odstrjel/novi">' + ICONS.plus + esc(t('newOdstrjel')) + '</a>') + '</div>';
    }
    var html = '', month = '';
    list.forEach(function (r) {
      var m = UI.fmtDate(r.datum, { month: 'long', year: 'numeric' });
      if (m !== month) { if (html) html += '</ul>'; html += '<div class="list-group-label">' + esc(m) + '</div><ul class="list">'; month = m; }
      html += rowHtml(r);
    });
    return '<div class="panel flush">' + html + '</ul></div>';
  }

  function renderPlan() {
    var list = Stats.filterLov(Stats.inJJ(Store.strecke()), state.lok);
    var faktor = state.lok === 'all' ? 3 : 1;
    return PLAN_SPECIES.map(function (v) {
      var p = Stats.planFor(v, list, faktor);
      // Klassen ohne Soll (z. B. Rehkitze) nur zeigen, wenn dort trotzdem etwas erlegt wurde
      var rows = p.rows.filter(function (row) { return row.soll || row.ist; }).map(function (row) {
        var pct = row.soll ? Math.min(100, Math.round(row.ist / row.soll * 100)) : 0;
        var split = (row.sollM != null) ? '<span class="r-sub num sex-split"><span>' + ICONS.male + row.istM + '/' + row.sollM + '</span><span>' + ICONS.female + row.istZ + '/' + row.sollZ + '</span></span>' : '';
        return '<tr><td>' + esc(I18n.klasaFor(v, row.klase[row.klase.length - 1])) + split +
          '<div class="bar"><span class="' + (row.ist > row.soll ? 'over' : '') + '" style="width:' + pct + '%"></span></div></td>' +
          '<td class="n" style="width:70px"><b class="num">' + row.ist + '</b> / ' + row.soll + '</td></tr>';
      }).join('');
      var zPct = p.ist ? Math.round(p.zensko / p.ist * 100) : 0;
      return '<div class="panel"><div class="section-title" style="margin:0 0 6px"><h2 style="display:flex;align-items:center;gap:8px"><span class="r-icon" style="width:26px;height:26px;color:var(--bark)">' + ICONS.forSpecies(v) + '</span>' + esc(I18n.species(v)) + '</h2>' +
        '<span class="num" style="font-family:var(--font-display);font-size:1.3rem">' + p.ist + '<small style="color:var(--ink-soft);font-size:.85rem"> / ' + p.soll + '</small></span></div>' +
        '<p class="hint" style="margin:0 0 6px">' + esc(t('femaleShare')) + ': <b>' + (p.ist ? zPct + ' %' : '—') + '</b>' +
        (p.ohneKlasse ? ' · ' + esc(t('noClass', { n: p.ohneKlasse })) : '') + (p.pending ? ' · ' + esc(t('pendingN', { n: p.pending })) : '') + '</p>' +
        '<table class="plan-table"><thead><tr><th>' + esc(t('klasa')) + '</th><th class="n">' + esc(t('istSoll')) + '</th></tr></thead><tbody>' + rows + '</tbody></table></div>';
    }).join('') + '<p class="source">' + esc(t('planSource')) + '</p>';
  }

  function openDetail(id) {
    var r = Store.strecke().filter(function (x) { return x.id === id; })[0];
    if (!r) return;
    var wb = Store.wildbret()[r.id];
    var lov = r.lovId ? Store.lovovi().filter(function (l) { return l.id === r.lovId; })[0] : null;
    var canEdit = r._pending || App.isUprava();
    // Drei Gruppen statt 14 gleich gewichteter Zeilen: Stück · Ort und Zeit · Verwaltung
    var stueck = [
      [t('lblVrsta'), I18n.species(r.vrsta)], [t('lblSpol'), r.spol === 'ž' ? t('spolZ') : t('spolM')],
      [t('klasa'), I18n.klasaFor(r.vrsta, r.dobnaKlasa)],
      // Geweih (nur wenn erfasst): Enden als Zahl bzw. Schaufelstufe; Bewertung erst nach dem Nachtrag
      [/^\d+$/.test(String(r.rogovlje || '')) ? t('lblVrhovi') : t('lblLopata'), /^\d+$/.test(String(r.rogovlje || '')) ? String(r.rogovlje) : I18n.lopata(r.rogovlje)],
      [t('lblTrofejMasa'), r.trofejMasa !== '' && r.trofejMasa != null ? String(r.trofejMasa).replace('.', ',') : ''], [t('lblCic'), r.trofejCic !== '' && r.trofejCic != null ? String(r.trofejCic).replace('.', ',') : ''],
      [t('lblTezina'), r.tezina + ' kg']
    ];
    var ortZeit = [
      [t('lblDatum'), UI.fmtDate(r.datum) + (r.vrijemeOdstrjela ? ' · ' + r.vrijemeOdstrjela : '')], [t('lblLoviste'), r.lokacija], [t('lblMjesto'), r.zona],
      [t('lblLovac'), r.lovac], [t('lblNacinLova'), I18n.nacin(r.nacinLova)], [t('lblLov'), lov ? lov.naziv || UI.fmtDate(lov.datum) : ''],
      [t('lblNapomena'), r.napomena],
      [t('lblGps'), r.lat ? (r.lat + ', ' + r.lon) : '']
    ];
    var verwaltung = [
      [t('lblMarkica'), r.brojMarkice],
      [t('sleLabel'), (function () { var i = sleInfo(r); return !i ? '' : i.done ? t('sleDoneOn', { d: UI.fmtDate(r.sle) }) : t('sleOpenTxt'); })()],
      [t('inCold'), wb && wb.hladnjacaOd ? UI.fmtDate(wb.hladnjacaOd.slice(0, 10)) + (wb.predanoDatum ? ' → ' + t('predano') + ' ' + UI.fmtDate(wb.predanoDatum) : '') : '']
    ];
    function gruppe(titel, rows) {
      rows = rows.filter(function (x) { return x[1]; });
      return rows.length ? '<div class="kv-group"><div class="kv-title">' + esc(titel) + '</div><dl class="kv">' +
        rows.map(function (x) { return '<dt>' + esc(x[0]) + '</dt><dd>' + esc(x[1]) + '</dd>'; }).join('') + '</dl></div>' : '';
    }
    var html = '<div class="sheet-head"><span class="r-icon big">' + ICONS.forSpecies(r.vrsta) + '</span><div><h2>' + esc(title(r)) + '</h2><p class="sheet-sub">' + esc(UI.fmtDay(r.datum)) + ' · #' + esc(r.brojMarkice) +
      (r._pending ? ' · ' + esc(t('stPending')) : '') + '</p></div></div>' +
      (r._error ? '<p class="error-msg">' + esc(r._error) + '</p>' : '') +
      gruppe(t('grpStueck'), stueck) + gruppe(t('grpOrtZeit'), ortZeit) + gruppe(t('grpVerwaltung'), verwaltung) +
      '<div id="photo-box"></div>' +
      '<div class="btn-row" style="margin-top:14px">' +
      (r.lat ? '<a class="btn" href="#/karta?lat=' + r.lat + '&lon=' + r.lon + '">' + ICONS.map + esc(t('onMap')) + '</a>' : '') +
      (canEdit ? '<button type="button" class="btn dark" data-edit>' + ICONS.edit + esc(t('edit')) + '</button>' : '') + '</div>' +
      (App.isUprava() && sleInfo(r) ? (sleInfo(r).done
        ? '<button type="button" class="btn ghost block small" style="margin-top:10px" data-sle="0">' + esc(t('sleUndo')) + '</button>'
        : '<button type="button" class="btn block" style="margin-top:10px" data-sle="1">' + ICONS.check + esc(t('sleDone')) + '</button>') : '') +
      (r._pending ? '<button type="button" class="btn danger block" style="margin-top:10px" data-discard>' + ICONS.trash + esc(t('discard')) + '</button>'
        : App.isUprava() ? '<button type="button" class="btn danger block" style="margin-top:10px" data-storno>' + ICONS.trash + esc(t('storno')) + '</button>' : '');
    UI.openSheet(html, function (el, api) {
      var box = el.querySelector('#photo-box');
      if (r._fotoLocal) box.innerHTML = '<div class="photo-preview"><img alt="" src="' + r._fotoLocal + '"></div>';
      else if (r.imaFoto && r.foto) {
        box.innerHTML = '<button type="button" class="btn small" data-photo>' + ICONS.photo + esc(t('showPhoto')) + '</button>';
        box.querySelector('[data-photo]').onclick = async function () {
          box.innerHTML = UI.skel(3);
          try { var src = await UI.loadPhoto(r.foto); box.innerHTML = '<div class="photo-preview"><img alt="" src="' + src + '" style="max-width:100%;max-height:none"></div>'; }
          catch (e) { box.innerHTML = '<p class="hint">' + esc(t('photoOffline')) + '</p>'; }
        };
      }
      var ed = el.querySelector('[data-edit]');
      if (ed) ed.onclick = function () { api.close(); App.go('#/odstrjel/uredi/' + encodeURIComponent(r.id)); };
      var ds = el.querySelector('[data-discard]');
      if (ds) ds.onclick = async function () {
        api.close();
        // Bereits gesendeter Abschuss mit wartender Korrektur: verworfen wird nur die Korrektur
        if (await UI.confirm(t('discard'), t(r._new ? 'confirmDiscard' : 'confirmDiscardEdit'), t('discard'), true)) await Store.discard('odstrjel:' + r.id);
      };
      var sb = el.querySelector('[data-sle]');
      if (sb) sb.onclick = function () { api.close(); setSle(r.id, sb.getAttribute('data-sle') === '1'); };
      var sn = el.querySelector('[data-storno]');
      if (sn) sn.onclick = function () { api.close(); setTimeout(function () { openStorno(r); }, 250); };
    }, { noFocus: true });
  }

  /** Gesendeten Abschuss stornieren (nur Team): Grund wählen, Zeile bleibt im Sheet als Beleg. */
  function openStorno(r) {
    // Gründe stehen im Sheet immer auf Kroatisch
    var hr = I18n._dict.hr;
    var reasons = [['stornoR1', hr.stornoR1], ['stornoR2', hr.stornoR2], ['stornoR3', hr.stornoR3]];
    UI.openSheet('<h2>' + esc(t('stornoTitle')) + '</h2><p class="sheet-sub">' + esc(title(r) + ' · #' + r.brojMarkice + ' · ' + UI.fmtDay(r.datum)) + '</p>' +
      '<p>' + esc(t('stornoText')) + '</p><form id="f" novalidate>' +
      '<div class="field"><span class="field-label req">' + esc(t('stornoReason')) + '</span><div class="chips" id="razlozi" style="flex-wrap:wrap">' +
      reasons.map(function (x) { return '<button type="button" class="chip" data-v="' + esc(x[1]) + '" aria-pressed="false">' + esc(t(x[0])) + '</button>'; }).join('') + '</div>' +
      '<input type="text" id="razlog" style="margin-top:10px" placeholder="' + esc(t('stornoReason')) + '"></div>' +
      '<div class="error-msg" id="err" hidden></div>' +
      '<div class="btn-row"><button type="button" class="btn" data-no>' + esc(t('cancel')) + '</button>' +
      '<button type="submit" class="btn danger">' + esc(t('storno')) + '</button></div></form>', function (el, api) {
      UI.$$('#razlozi .chip', el).forEach(function (b) {
        b.onclick = function () {
          el.querySelector('#razlog').value = b.getAttribute('data-v');
          UI.$$('#razlozi .chip', el).forEach(function (x) { x.setAttribute('aria-pressed', String(x === b)); });
        };
      });
      el.querySelector('[data-no]').onclick = function () { api.close(); };
      el.querySelector('#f').onsubmit = async function (ev) {
        ev.preventDefault();
        var razlog = el.querySelector('#razlog').value.trim();
        if (!razlog) { var e = el.querySelector('#err'); e.textContent = t('errStornoReason'); e.hidden = false; return; }
        await Store.queueUpsert('odstrjel', { id: r.id, storno: razlog });
        api.close();
        UI.toast(t('stornoDone'));
        App.syncNow({ quiet: true, pull: true });
      };
    }, { noFocus: true });
  }

  /** Menübereich „Strecke": Liste · Plan · Kühlzelle */
  function tabs(active) {
    return UI.sectionTabs([['#/odstrjel?tab=popis', t('tabList'), active === 'popis'], ['#/odstrjel?tab=plan', t('tabPlan'), active === 'plan'], ['#/hladnjaca', t('tileCold'), active === 'cold']]);
  }

  App.route('odstrjel', {
    nav: 'odstrjel',
    render: function (ctx) {
      if (ctx.params[0] === 'novi' || ctx.params[0] === 'uredi') return Odstrjel.render(ctx);
      if (ctx.query.tab) state.tab = ctx.query.tab;
      var s = Stats.summary(state.lok);
      var jj = Store.jagdjahr();
      if (ctx.query.sle) state.sle = ctx.query.sle === '1';
      var nSle = App.isUprava() ? sleOpen(s.list).length : 0;
      if (!nSle && !state.sle) state.sle = false;
      var speciesChips = (nSle || state.sle ? '<button type="button" class="chip sle-chip" id="sle-chip" aria-pressed="' + state.sle + '">' + esc(t('sleChip', { n: nSle })) + '</button>' : '') +
        ['all'].concat(PLAN_SPECIES).concat(['Muflon']).map(function (v) {
        return '<button type="button" class="chip" data-vrsta="' + esc(v) + '" aria-pressed="' + (!state.sle && state.vrsta === v) + '">' + esc(v === 'all' ? t('allSpecies') : I18n.species(v)) + '</button>';
      }).join('');
      return tabs(state.tab) + '<div class="page-head"><div class="eyebrow">' + esc(t('huntYear')) + ' ' + esc(jj.label) + '</div>' +
        '<h1>' + esc(t('streckeTitle', { n: s.list.length })) + '</h1>' +
        '<p>' + esc(t('streckeSub', { ist: s.ist, soll: s.soll })) + (s.pending ? ' · ' + esc(t('pendingN', { n: s.pending })) : '') + '</p></div>' +
        // „Neuer Abschuss“ nur in der Liste (im Plan wäre er Wiederholung)
        (state.tab === 'popis' ? '<a class="btn primary block" href="#/odstrjel/novi" style="margin-bottom:14px">' + ICONS.plus + esc(t('newOdstrjel')) + '</a>' : '') +
        lovChips() +
        (state.tab === 'popis' ? '<div class="chips" id="vrsta-chips" style="margin:6px 0 10px">' + speciesChips + '</div>' + renderList(s.list) : '<div style="margin-top:8px" class="stack">' + renderPlan() + '</div>');
    },
    mount: function (el, ctx) {
      if (ctx.params[0] === 'novi' || ctx.params[0] === 'uredi') return Odstrjel.mount(el, ctx);
      UI.$$('#lok-chips .chip', el).forEach(function (b) { b.onclick = function () { state.lok = b.getAttribute('data-lok'); App.render(true); }; });
      UI.$$('#vrsta-chips .chip[data-vrsta]', el).forEach(function (b) { b.onclick = function () { state.vrsta = b.getAttribute('data-vrsta'); state.sle = false; App.render(true); }; });
      var sc = el.querySelector('#sle-chip');
      if (sc) sc.onclick = function () { state.sle = !state.sle; App.render(true); };
      UI.$$('[data-sle-done]', el).forEach(function (b) { b.onclick = function () { setSle(b.getAttribute('data-sle-done'), true); }; });
      UI.$$('[data-copy]', el).forEach(function (b) {
        b.onclick = function () {
          var v = b.getAttribute('data-copy');
          if (navigator.clipboard) navigator.clipboard.writeText(v).then(function () { UI.toast(t('sleCopied', { m: v })); }, function () {});
        };
      });
      UI.$$('.row[data-id]', el).forEach(function (b) { b.onclick = function () { openDetail(b.getAttribute('data-id')); }; });
    },
    get live() { var r = location.hash; return !(/#\/odstrjel\/(novi|uredi)/.test(r)); },
    onData: function () { if (window.Odstrjel && Odstrjel.onData) Odstrjel.onData(); }
  });

  return { openDetail: openDetail, title: title, shortLov: shortLov, rowHtml: rowHtml, tabs: tabs, sleOpen: sleOpen, sleInfo: sleInfo };
})();
