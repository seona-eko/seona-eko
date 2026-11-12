/**
 * Skupni lovovi (Drückjagden): Liste, Detail mit Strecke der Jagd, Stände auf der Karte.
 * Anlegen/Ändern nur Verwaltung (Server prüft). Strecke = Abschüsse mit lovId.
 */
(function () {
  var esc = UI.esc, t = I18n.t;

  function lovById(id) { return Store.lovovi().filter(function (l) { return l.id === id; })[0]; }
  function streckeOf(id) { return Store.strecke().filter(function (r) { return r.lovId === id; }); }
  function dateBlock(iso) {
    var d = UI.parseISO(String(iso).slice(0, 10));
    return '<span class="r-icon" style="flex-direction:column;background:var(--forest-2);color:var(--accent-ink);width:44px;height:44px;line-height:1">' +
      '<b style="font-family:var(--font-display);font-weight:500;font-size:1.1rem">' + (d ? d.getDate() : '') + '</b>' +
      '<small style="font-size:.6rem;text-transform:uppercase;letter-spacing:.05em">' + (d ? esc(d.toLocaleDateString(I18n.locale(), { month: 'short' })) : '') + '</small></span>';
  }
  function lovRow(l) {
    var n = streckeOf(l.id).length;
    return '<li><a class="row" href="#/lov/' + esc(l.id) + '">' + dateBlock(l.datum) +
      '<span class="r-main"><span class="r-title">' + esc(l.naziv || t('lovDefaultName')) + '</span>' +
      '<span class="r-sub">' + esc(UI.fmtDay(String(l.datum).slice(0, 10)) + ' · ' + Strecke.shortLov(l.lokacija) + (l.vodja ? ' · ' + l.vodja : '')) + '</span></span>' +
      '<span class="r-end">' + (n ? '<b>' + n + '</b>' + esc(t('pieces')) : (l._pending ? '<span class="badge muted">' + esc(t('stPending')) + '</span>' : '')) + '</span></a></li>';
  }

  /** Menübereich „Jagden": Drückjagden · Gäste */
  function tabs(active) {
    return App.isUprava() ? UI.sectionTabs([['#/lovovi', t('lovoviTitle'), active === 'lov'], ['#/gosti', t('tabGuests'), active === 'gosti']]) : '';
  }
  window.JagdTabs = tabs;

  App.route('lovovi', {
    nav: 'lovovi',
    render: function () {
      var today = UI.todayISO();
      var all = Store.lovovi();
      var up = all.filter(function (l) { return String(l.datum).slice(0, 10) >= today; });
      var past = all.filter(function (l) { return String(l.datum).slice(0, 10) < today; }).reverse();
      var next = up[0];
      return tabs('lov') + '<div class="page-head"><div class="eyebrow">' + esc(t('huntYear')) + ' ' + esc(Store.jagdjahr().label) + '</div>' +
        // Team sieht den Reiter „Drückjagden“ schon darüber — keine zweite gleiche Überschrift
        (App.isUprava() ? '' : '<h1>' + esc(t('lovoviTitle')) + '</h1>') +
        '<p>' + esc(next ? t('lovoviNext', { d: UI.fmtDay(String(next.datum).slice(0, 10)), l: Strecke.shortLov(next.lokacija) }) : t('noNextLov')) + '</p></div>' +
        (App.isUprava() ? '<button type="button" class="btn primary block" id="new-lov" style="margin-bottom:14px">' + ICONS.plus + esc(t('newLov')) + '</button>' : '') +
        (all.length ? '' : '<div class="panel">' + UI.emptyState('group', t('emptyLovTitle'), App.isUprava() ? t('emptyLovUprava') : t('emptyLovLovac')) + '</div>') +
        (up.length ? '<div class="section-title"><h2>' + esc(t('upcoming')) + '</h2></div><div class="panel flush"><ul class="list">' + up.map(lovRow).join('') + '</ul></div>' : '') +
        (past.length ? '<div class="section-title"><h2>' + esc(t('past')) + '</h2></div><div class="panel flush"><ul class="list">' + past.map(lovRow).join('') + '</ul></div>' : '');
    },
    mount: function (el, ctx) {
      var b = el.querySelector('#new-lov');
      if (b) b.onclick = function () { openForm(null); };
      if (ctx.query.new && App.isUprava()) openForm(null);
    }
  });

  App.route('lov', {
    nav: 'lovovi',
    render: function (ctx) {
      var l = lovById(decodeURIComponent(ctx.params[0] || ''));
      if (!l) return '<div class="page-head"><h1>' + esc(t('notFound')) + '</h1></div><a class="btn" href="#/lovovi">' + esc(t('back')) + '</a>';
      var s = streckeOf(l.id);
      var bySpecies = {};
      s.forEach(function (r) {
        var k = Strecke.title(r);
        bySpecies[r.vrsta] = bySpecies[r.vrsta] || { n: 0, kg: 0, kat: {} };
        bySpecies[r.vrsta].n++; bySpecies[r.vrsta].kg += Number(r.tezina) || 0;
        bySpecies[r.vrsta].kat[k] = (bySpecies[r.vrsta].kat[k] || 0) + 1;
      });
      var stands = Store.objekti().filter(function (o) { return Array.isArray(l.stajalista) && l.stajalista.indexOf(o.id) !== -1; });
      var kg = s.reduce(function (a, r) { return a + (Number(r.tezina) || 0); }, 0);
      var sudionici = String(l.sudionici || '').split(/\n|,/).map(function (x) { return x.trim(); }).filter(Boolean);
      var isPast = String(l.datum).slice(0, 10) <= UI.todayISO();
      return '<div class="page-head"><div class="eyebrow"><a href="#/lovovi" style="color:inherit">' + esc(t('lovoviTitle')) + '</a> · ' + esc(Strecke.shortLov(l.lokacija)) + '</div>' +
        '<h1>' + esc(l.naziv || t('lovDefaultName')) + '</h1>' +
        '<p>' + esc(UI.fmtDate(String(l.datum).slice(0, 10), { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })) + (l.vodja ? ' · ' + esc(t('lblVodja')) + ': ' + esc(l.vodja) : '') + '</p></div>' +
        (isPast || s.length ? '<button type="button" class="btn primary block" id="lov-add" style="margin-bottom:12px">' + ICONS.plus + esc(t('addToLov')) + '</button>' : '') +
        '<div class="grid-2"><div class="tile"><div class="t-label">' + ICONS.list + esc(t('tileStrecke')) + '</div><div class="t-value">' + s.length + '</div><div class="t-sub num">' + Math.round(kg) + ' kg</div></div>' +
        '<div class="tile"><div class="t-label">' + ICONS.pin + esc(t('stands')) + '</div><div class="t-value">' + stands.length + '</div><div class="t-sub">' + esc(sudionici.length ? t('participantsN', { n: sudionici.length }) : '—') + '</div></div></div>' +
        (s.length ? '<div class="section-title"><h2>' + esc(t('lovStrecke')) + '</h2></div><div class="panel stack">' +
          Object.keys(bySpecies).map(function (v) {
            var b = bySpecies[v];
            return '<div><div style="display:flex;justify-content:space-between;align-items:center"><b>' + esc(I18n.species(v)) + '</b><span class="num">' + b.n + ' · ' + Math.round(b.kg) + ' kg</span></div>' +
              '<div class="hint" style="margin-top:2px">' + Object.keys(b.kat).map(function (k) { return esc(k) + ' ' + b.kat[k]; }).join(' · ') + '</div></div>';
          }).join('') + '</div>' +
          '<div class="panel flush" style="margin-top:12px"><ul class="list">' + s.map(Strecke.rowHtml).join('') + '</ul></div>' : '') +
        '<div class="section-title"><h2>' + esc(t('stands')) + '</h2>' + (stands.length ? '<a href="#/karta?lov=' + encodeURIComponent(l.id) + '">' + esc(t('onMap')) + '</a>' : '') + '</div>' +
        (stands.length ? '<div class="panel flush"><ul class="list">' + stands.map(function (o) {
          return '<li><button type="button" class="row" data-obj="' + esc(o.id) + '"><span class="r-icon"><img alt="" src="' + ICONS.objekt[o.art] + '"></span><span class="r-main"><span class="r-title">' + esc(Objekti.name(o)) + '</span><span class="r-sub">' + esc(I18n.stanje(o.stanje)) + '</span></span></button></li>';
        }).join('') + '</ul></div>' : '<div class="panel"><p class="hint" style="margin:0">' + esc(t('noStands')) + '</p></div>') +
        (sudionici.length ? '<div class="section-title"><h2>' + esc(t('participants')) + '</h2></div><div class="panel"><div class="chips" style="flex-wrap:wrap">' + sudionici.map(function (p) { return '<span class="badge plain muted">' + esc(p) + '</span>'; }).join('') + '</div></div>' : '') +
        '<div class="section-title"><h2>' + esc(t('gMeeting')) + '</h2>' + (App.isUprava() ? '<a href="#/karta?meet=' + encodeURIComponent(l.id) + '">' + esc(l.sastanakLat ? t('onMap') : t('meetSet')) + '</a>' : '') + '</div>' +
        '<div class="panel"><p style="margin:0">' + esc(l.sastanak || t('meetNone')) + '</p>' +
        (l.napomenaGost ? '<p class="hint" style="margin:8px 0 0;white-space:pre-wrap"><b>' + esc(t('lblNapomenaGost')) + ':</b> ' + esc(l.napomenaGost) + '</p>' : '') + '</div>' +
        (l.napomena ? '<div class="section-title"><h2>' + esc(t('lblNapomenaIntern')) + '</h2></div><div class="panel"><p style="margin:0;white-space:pre-wrap">' + esc(l.napomena) + '</p></div>' : '') +
        (App.isUprava() ? '<div class="btn-row" style="margin-top:16px"><button type="button" class="btn" id="edit-lov">' + ICONS.edit + esc(t('edit')) + '</button><button type="button" class="btn danger" id="del-lov">' + ICONS.trash + esc(t('delete')) + '</button></div>' : '');
    },
    mount: function (el, ctx) {
      var l = lovById(decodeURIComponent(ctx.params[0] || ''));
      if (!l) return;
      UI.$$('.row[data-id]', el).forEach(function (b) { b.onclick = function () { Strecke.openDetail(b.getAttribute('data-id')); }; });
      UI.$$('.row[data-obj]', el).forEach(function (b) { b.onclick = function () { Objekti.openDetail(b.getAttribute('data-obj')); }; });
      var add = el.querySelector('#lov-add'); if (add) add.onclick = function () { openQuick(l); };
      if (ctx.query.add) openQuick(l);
      var e = el.querySelector('#edit-lov'); if (e) e.onclick = function () { openForm(l); };
      var d = el.querySelector('#del-lov'); if (d) d.onclick = async function () {
        if (await UI.confirm(t('delete'), t('confirmDeleteLov'), t('delete'), true)) {
          await Store.queueUpsert('lov', { id: l.id, deleted: true });
          App.syncNow({ quiet: true });
          App.go('#/lovovi');
        }
      };
    }
  });

  /**
   * Strecke der Drückjagd direkt hier erfassen: Stück für Stück in einem Feld, das offen bleibt.
   * Ort = Stand (kein GPS nötig), Datum/Revier/Jagdart kommen von der Jagd. Gespeichert wie jeder Abschuss.
   */
  var QUICK_SPECIES = ['Divlja svinja', 'Jelen obični', 'Jelen lopatar', 'Srna'];
  function openQuick(l) {
    var stands = Store.objekti().filter(function (o) { return Array.isArray(l.stajalista) && l.stajalista.indexOf(o.id) !== -1; });
    var lovci = Store.lovci();
    var q = { species: '', n: 0, trofej: null, rogovlje: '' };
    var html = '<h2>' + esc(t('lovQuickTitle')) + '</h2><p class="sheet-sub" id="q-sub">' + esc((l.naziv || t('lovDefaultName')) + ' · ' + UI.fmtDay(String(l.datum).slice(0, 10))) + '</p>' +
      '<form id="q-form" novalidate>' +
      '<div class="species-grid four">' + QUICK_SPECIES.map(function (v) {
        return '<button type="button" class="species-btn" data-sp="' + esc(v) + '" aria-pressed="false">' + ICONS.forSpecies(v) + '<span>' + esc(I18n.species(v)) + '</span></button>';
      }).join('') + '</div>' +
      '<div class="field" style="margin-top:12px"><span class="field-label req">' + esc(t('lblSpol')) + '</span><div class="radio-group">' +
      '<label><input type="radio" name="q-spol" value="m"><span>' + esc(t('spolM')) + '</span></label><label><input type="radio" name="q-spol" value="ž"><span>' + esc(t('spolZ')) + '</span></label></div></div>' +
      '<div class="field"><span class="field-label req">' + esc(t('klasa')) + '</span>' + Odstrjel.klasaHtml('q-klasa', '', '', '') + '</div>' +
      '<div id="q-trofej"></div>' +
      '<div class="grid-2"><div class="field"><label class="field-label req" for="q-kg">' + esc(t('lblTezinaShort')) + '</label><div class="unit-wrap"><input type="number" id="q-kg" inputmode="decimal" min="1" step="0.5"><span>kg</span></div></div>' +
      '<div class="field"><label class="field-label req" for="q-marka">' + esc(t('lblMarkica')) + '</label><input type="text" id="q-marka" inputmode="numeric"></div></div>' +
      (stands.length ? '<div class="field"><label class="field-label" for="q-stand">' + esc(t('lblStand')) + '</label><select id="q-stand"><option value="">—</option>' +
        stands.map(function (o) { return '<option value="' + esc(o.id) + '">' + esc(Objekti.name(o)) + '</option>'; }).join('') + '</select></div>' : '') +
      '<div class="field"><label class="field-label req" for="q-lovac">' + esc(t('lblLovac')) + '</label><input type="text" id="q-lovac" list="q-lovci" autocomplete="off" placeholder="' + esc(t('phLovac')) + '"><datalist id="q-lovci">' +
      lovci.concat(String(l.sudionici || '').split(/\n|,/).map(function (x) { return x.trim(); }).filter(Boolean)).map(function (n) { return '<option value="' + esc(n) + '">'; }).join('') + '</datalist></div>' +
      '<div class="field"><label class="field-label" id="q-nap-label" for="q-nap">' + esc(t('lblNapomena')) + '</label><textarea id="q-nap" rows="2"></textarea>' +
      '<button type="button" class="btn small" id="q-nap-ok" style="margin-top:8px" hidden>' + ICONS.check + esc(t('btnNoAnomalies')) + '</button></div>' +
      '<label style="display:flex;gap:12px;align-items:center;font-weight:600;min-height:44px;margin-bottom:8px"><input type="checkbox" id="q-cold" checked style="width:22px;height:22px">' + esc(t('coldCheck')) + '</label>' +
      '<div class="error-msg" id="q-err" hidden></div>' +
      '<button type="submit" class="btn primary block" style="min-height:52px">' + esc(t('btnSave')) + '</button></form>';
    UI.openSheet(html, function (el) {
      function klasa() { return Odstrjel.klasaValue(el, 'q-klasa', q.species); }
      function spol() { var x = el.querySelector('input[name=q-spol]:checked'); return x ? x.value : ''; }
      function trofej() {
        Odstrjel.klasaUpdate(el, 'q-klasa', q.species, spol());
        var nacin = Odstrjel.trofejNacin(q.species, spol(), klasa());
        if (nacin === 'foto') nacin = '';
        if (nacin === q.trofej) return;
        q.trofej = nacin;
        el.querySelector('#q-trofej').innerHTML = Odstrjel.trofejHtml(nacin, { rogovlje: '' }, { photo: false, ocjena: false });
      }
      function setSpecies(v) {
        q.species = v;
        UI.$$('.species-btn', el).forEach(function (b) { b.setAttribute('aria-pressed', String(b.getAttribute('data-sp') === v)); });
        var svinja = v === 'Divlja svinja';
        el.querySelector('#q-nap-label').classList.toggle('req', svinja);
        el.querySelector('#q-nap-ok').hidden = !svinja;
        trofej();
      }
      UI.$$('.species-btn', el).forEach(function (b) { b.onclick = function () { setSpecies(b.getAttribute('data-sp')); }; });
      UI.$$('input[name=q-spol], input[name^="q-klasa-"]', el).forEach(function (r) { r.onchange = trofej; });
      el.querySelector('#q-nap-ok').onclick = function () { var n = el.querySelector('#q-nap'); if (!n.value.trim()) n.value = I18n._dict.hr.btnNoAnomalies.toLowerCase(); };
      el.querySelector('#q-form').addEventListener('submit', async function (ev) {
        ev.preventDefault();
        var err = el.querySelector('#q-err'); err.hidden = true;
        function fail(m) { err.textContent = m; err.hidden = false; }
        var v = function (id) { var x = el.querySelector('#' + id); return x ? x.value.trim() : ''; };
        var data = { vrsta: q.species, spol: spol(), dobnaKlasa: klasa(), klaseV: 2, tezina: v('q-kg'), brojMarkice: v('q-marka'), lovac: v('q-lovac'),
          napomena: v('q-nap'), lokacija: l.lokacija, datum: String(l.datum).slice(0, 10), nacinLova: 'Prigon/pogon', lovId: l.id,
          stajaliste: v('q-stand'), lat: '', lon: '', zona: '', vrijemeOdstrjela: '' };
        if (!data.vrsta) return fail(t('errSelectVrsta'));
        if (!data.spol || !data.dobnaKlasa || !data.tezina || !data.brojMarkice || !data.lovac) return fail(t('errRequired'));
        if (!(Number(data.tezina) > 0)) return fail(t('errTezina'));
        if (data.vrsta === 'Divlja svinja' && !data.napomena) return fail(t('errSvinjaNapomena'));
        if (q.trofej === 'vrhovi') {
          var n = Number(v('rog-vrhovi'));
          if (!(n >= 2 && n <= 30) || Math.round(n) !== n) return fail(t('errVrhovi'));
          data.rogovlje = String(n);
        } else if (q.trofej === 'lopata') {
          var lp = el.querySelector('input[name=lopata]:checked');
          if (!lp) return fail(t('errLopata'));
          data.rogovlje = lp.value;
        }
        var stand = data.stajaliste ? Store.objekti().filter(function (o) { return o.id === data.stajaliste; })[0] : null;
        if (stand && Number(stand.lat)) { data.lat = stand.lat; data.lon = stand.lon; data.zona = await Geo.ortLabel(stand.lat, stand.lon) || ''; }
        data.id = Store.uuid();
        await Store.queueSubmit(data);
        if (el.querySelector('#q-cold').checked) {
          await Store.queueUpsert('wildbret', { id: data.id, hladnjacaOd: UI.nowLocalISO(), aspUzorak: '', aspNalaz: data.vrsta === 'Divlja svinja' ? 'ceka' : '' });
        }
        App.syncNow({ quiet: true });
        q.n++;
        UI.toast(kategorija(data.vrsta, data.spol, data.dobnaKlasa, I18n.lang()) + ' · #' + data.brojMarkice + ' — ' + t('saved'));
        // Für das nächste Stück leeren; Wildart bleibt (meist mehrere Sauen hintereinander)
        ['q-kg', 'q-marka', 'q-lovac', 'q-nap'].forEach(function (id) { el.querySelector('#' + id).value = ''; });
        if (el.querySelector('#q-stand')) el.querySelector('#q-stand').value = '';
        UI.$$('input[name=q-spol], input[name^="q-klasa-"]', el).forEach(function (r) { r.checked = false; });
        q.trofej = null; el.querySelector('#q-trofej').innerHTML = '';
        Odstrjel.klasaUpdate(el, 'q-klasa', q.species, '');
        el.querySelector('#q-sub').textContent = (l.naziv || t('lovDefaultName')) + ' · ' + UI.fmtDay(String(l.datum).slice(0, 10)) + ' · ' + t('lovQuickN', { n: q.n });
        el.scrollTop = 0;
      });
    }, { noFocus: true });
  }

  function openForm(l) {
    var lovci = Store.lovci();
    var sel = l && Array.isArray(l.stajalista) ? l.stajalista.slice() : [];
    var html = '<h2>' + esc(l ? t('editLov') : t('newLov')) + '</h2><form id="lov-form" novalidate>' +
      '<div class="grid-2"><div class="field"><label class="field-label req" for="lov-datum">' + esc(t('lblDatum')) + '</label><input type="date" id="lov-datum" value="' + esc(l ? String(l.datum).slice(0, 10) : '') + '"></div>' +
      '<div class="field"><label class="field-label" for="lov-lok">' + esc(t('lblLoviste')) + '</label><select id="lov-lok">' +
      Store.lovista().map(function (x) { return '<option' + (l && l.lokacija === x ? ' selected' : '') + '>' + esc(x) + '</option>'; }).join('') + '</select></div></div>' +
      '<div class="field"><label class="field-label" for="lov-naziv">' + esc(t('lblLovNaziv')) + '</label><input type="text" id="lov-naziv" value="' + esc(l ? l.naziv : '') + '" placeholder="' + esc(t('phLovNaziv')) + '"></div>' +
      '<div class="field"><label class="field-label" for="lov-vodja">' + esc(t('lblVodja')) + '</label><input type="text" id="lov-vodja" list="lov-lovci" value="' + esc(l ? l.vodja : '') + '"><datalist id="lov-lovci">' + lovci.map(function (n) { return '<option value="' + esc(n) + '">'; }).join('') + '</datalist></div>' +
      '<div class="field"><span class="field-label">' + esc(t('stands')) + '</span><div id="stand-list" class="panel flush" style="max-height:240px;overflow:auto"></div><p class="hint">' + esc(t('standsHint')) + '</p></div>' +
      '<div class="field"><label class="field-label" for="lov-sud">' + esc(t('participants')) + '</label><textarea id="lov-sud" placeholder="' + esc(t('phParticipants')) + '">' + esc(l ? l.sudionici : '') + '</textarea></div>' +
      '<div class="field"><label class="field-label" for="lov-sast">' + esc(t('gMeeting')) + '</label><input type="text" id="lov-sast" value="' + esc(l ? l.sastanak : '') + '" placeholder="' + esc(t('phMeeting')) + '"><p class="hint">' + esc(t('meetFormHint')) + '</p></div>' +
      '<div class="field"><label class="field-label" for="lov-gnap">' + esc(t('lblNapomenaGost')) + '</label><textarea id="lov-gnap" placeholder="' + esc(t('phNapomenaGost')) + '">' + esc(l ? l.napomenaGost : '') + '</textarea></div>' +
      '<div class="field"><label class="field-label" for="lov-nap">' + esc(t('lblNapomenaIntern')) + '</label><textarea id="lov-nap">' + esc(l ? l.napomena : '') + '</textarea></div>' +
      '<div class="error-msg" id="lov-err" hidden></div>' +
      '<button type="submit" class="btn primary block">' + esc(t('btnSave')) + '</button></form>';
    UI.openSheet(html, function (el, api) {
      function drawStands() {
        var lok = el.querySelector('#lov-lok').value;
        var list = Store.objekti().filter(function (o) { return o.stanje !== 'uklonjen' && (o.lokacija === lok || sel.indexOf(o.id) !== -1) && ['drueckjagdbock', 'kanzel', 'leiter', 'bodensitz'].indexOf(o.art) !== -1; });
        el.querySelector('#stand-list').innerHTML = list.length ? '<ul class="list">' + list.map(function (o) {
          return '<li><label class="row" style="cursor:pointer"><input type="checkbox" value="' + esc(o.id) + '"' + (sel.indexOf(o.id) !== -1 ? ' checked' : '') + ' style="width:22px;height:22px">' +
            '<span class="r-icon"><img alt="" src="' + ICONS.objekt[o.art] + '"></span><span class="r-main"><span class="r-title">' + esc(Objekti.name(o)) + '</span></span></label></li>';
        }).join('') + '</ul>' : '<p class="hint" style="padding:12px 16px;margin:0">' + esc(t('noStandsInGround')) + '</p>';
        UI.$$('input[type=checkbox]', el.querySelector('#stand-list')).forEach(function (c) {
          c.onchange = function () { var i = sel.indexOf(c.value); if (c.checked && i === -1) sel.push(c.value); if (!c.checked && i !== -1) sel.splice(i, 1); };
        });
      }
      drawStands();
      el.querySelector('#lov-lok').onchange = drawStands;
      el.querySelector('#lov-form').addEventListener('submit', async function (ev) {
        ev.preventDefault();
        var datum = el.querySelector('#lov-datum').value;
        if (!datum) { var er = el.querySelector('#lov-err'); er.textContent = t('errLovDatum'); er.hidden = false; return; }
        var rec = { id: l ? l.id : Store.uuid(), datum: datum, lokacija: el.querySelector('#lov-lok').value,
          naziv: el.querySelector('#lov-naziv').value.trim(), vodja: el.querySelector('#lov-vodja').value.trim(),
          stajalista: sel.slice(), sudionici: el.querySelector('#lov-sud').value.trim(), napomena: el.querySelector('#lov-nap').value.trim(),
          sastanak: el.querySelector('#lov-sast').value.trim(), napomenaGost: el.querySelector('#lov-gnap').value.trim() };
        await Store.queueUpsert('lov', rec);
        api.close();
        App.syncNow({ quiet: true });
        App.go('#/lov/' + rec.id);
      });
    });
  }
})();
