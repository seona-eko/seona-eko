/**
 * Schnellerfassung Abschuss (aus der ersten Fassung übernommen) + GPS, Drückjagd/Stand,
 * Kühlzelle/ASK-Probe. Auch Bearbeiten: wartende Einträge (jeder), gesendete (nur Verwaltung).
 * Gespeicherte Werte bleiben Kroatisch — Formeln im Sheet hängen daran.
 */
var Odstrjel = (function () {
  var esc = UI.esc, t = I18n.t;
  var SPECIES = ['Jelen obični', 'Srna', 'Divlja svinja', 'Jelen lopatar', 'Muflon', 'Ostalo'];
  // Altersklassen wie in der LGO (js/data/plan.js): erste Zeile Jungtier · Jährling · Älter, bei „Älter“ zweite Zeile mladi · srednji · zreli
  var STUFE1 = ['Tele/prase', 'Pomladak', 'starije'], STUFE2 = ['Mlađa klasa', 'Srednja klasa', 'Zrela klasa'];
  var NACINI = ['Dočeka (usjedanje)', 'Prigon/pogon', 'Šuljanje', 'Uginula divljač'];
  var st = null; // Formularzustand

  function editTarget(ctx) {
    if (ctx.params[0] !== 'uredi') return null;
    var id = decodeURIComponent(ctx.params[1] || '');
    return Store.strecke().filter(function (r) { return r.id === id; })[0] || null;
  }

  /** Kleine Vorschau: die z15-Kachel um den Punkt, Punkt in der Mitte. */
  function miniMap(lat, lon) {
    var z = 15, n = 256 * Math.pow(2, z), s = Math.sin(lat * Math.PI / 180);
    var x = (lon + 180) / 360 * n, y = (0.5 - Math.log((1 + s) / (1 - s)) / (4 * Math.PI)) * n;
    var tx = Math.floor(x / 256), ty = Math.floor(y / 256), ox = x - tx * 256, oy = y - ty * 256;
    var url = MapOffline.prefix() + '/' + z + '/' + tx + '/' + ty + '.jpg';
    if (window.PREVIEW_TILES) url = (App.isGost() ? PREVIEW_TILES_GAST : PREVIEW_TILES)[z + '/' + tx + '/' + ty] || '';
    return '<div class="loc-mini" style="background:url(' + url + ') ' + Math.round(48 - ox) + 'px ' + Math.round(48 - oy) + 'px no-repeat #efe9d8"><span class="pin"></span></div>';
  }

  function render(ctx) {
    var edit = editTarget(ctx);
    if (ctx.params[0] === 'uredi' && !edit) {
      return '<div class="page-head"><h1>' + esc(t('notFound')) + '</h1></div><a class="btn" href="#/odstrjel">' + esc(t('back')) + '</a>';
    }
    var d = edit || {};
    var isOther = edit && SPECIES.indexOf(edit.vrsta) === -1;
    var sp = isOther ? 'Ostalo' : d.vrsta;
    var canPhoto = !edit || edit._pending;
    return '<div class="page-head"><div class="eyebrow"><a href="#/odstrjel" style="color:inherit">' + esc(t('navOdstrjel')) + '</a></div>' +
      '<h1>' + esc(edit ? t('editOdstrjel') : t('newOdstrjel')) + '</h1>' +
      (edit && !edit._pending ? '<p>' + esc(t('editSentHint')) + '</p>' : '') + '</div>' +
      '<form id="unos-form" novalidate class="stack">' +
      '<div class="panel"><span class="field-label req">' + esc(t('lblVrsta')) + '</span><div class="species-grid">' +
      SPECIES.map(function (v) {
        return '<button type="button" class="species-btn" data-sp="' + esc(v) + '" aria-pressed="' + (sp === v) + '">' + ICONS.forSpecies(v) + '<span>' + esc(v === 'Ostalo' ? t('spOstalo') : I18n.species(v)) + '</span></button>';
      }).join('') + '</div>' +
      '<div class="field" id="ostalo-wrap" style="margin-top:14px"' + (sp === 'Ostalo' ? '' : ' hidden') + '><label class="field-label req" for="vrstaOstalo">' + esc(t('lblKojaVrsta')) + '</label>' +
      '<input type="text" id="vrstaOstalo" value="' + esc(isOther ? d.vrsta : '') + '" placeholder="' + esc(t('phVrsta')) + '"></div></div>' +

      '<div class="panel">' +
      '<div class="field"><span class="field-label req">' + esc(t('lblSpol')) + '</span><div class="radio-group">' +
      '<label><input type="radio" name="spol" value="m"' + (d.spol === 'm' ? ' checked' : '') + '><span>' + esc(t('spolM')) + '</span></label>' +
      '<label><input type="radio" name="spol" value="ž"' + (d.spol === 'ž' ? ' checked' : '') + '><span>' + esc(t('spolZ')) + '</span></label></div></div>' +
      // Altersklasse als große Knöpfe und Pflichtfeld — die Planerfüllung (Frischlinge, Klassen) hängt daran
      '<div class="field"><span class="field-label req" id="klasa-label">' + esc(t('klasa')) + '</span>' + klasaHtml('dobnaKlasa', sp, d.spol, d.dobnaKlasa) + '</div>' +
      '<div id="trofej-wrap"></div>' +
      '<div class="grid-2"><div class="field"><label class="field-label req" for="tezina">' + esc(t('lblTezinaShort')) + '</label><div class="unit-wrap"><input type="number" id="tezina" inputmode="decimal" min="1" step="0.5" value="' + esc(d.tezina || '') + '"><span>kg</span></div></div>' +
      '<div class="field"><label class="field-label req" for="brojMarkice">' + esc(t('lblMarkica')) + '</label><input type="text" id="brojMarkice" inputmode="numeric" value="' + esc(d.brojMarkice || '') + '"></div></div>' +
      // Erst der Ort (das Revier ergibt sich daraus), dann das Revier zur Kontrolle.
      // Ort des Abschusses: aktueller Standort ODER auf der Karte wählen (Meldung oft erst an der Kühlzelle)
      '<div class="field loc-block"><span class="field-label">' + esc(t('lblMjesto')) + '</span>' +
      '<div class="loc-buttons"><button type="button" class="btn" id="loc-gps">' + ICONS.locate + esc(t('myLocation')) + '</button>' +
      '<button type="button" class="btn" id="loc-map">' + ICONS.map + esc(t('pickOnMap')) + '</button></div>' +
      '<div id="loc-result"></div></div>' +
      '<div class="field"><label class="field-label req" for="lokacija">' + esc(t('lblLoviste')) + '</label><select id="lokacija">' +
      Store.lovista().map(function (l) { return '<option' + (d.lokacija === l ? ' selected' : '') + '>' + esc(l) + '</option>'; }).join('') + '</select></div>' +
      '<div class="grid-2"><div class="field"><label class="field-label req" for="datum">' + esc(t('lblDatum')) + '</label><input type="date" id="datum" value="' + esc(d.datum || '') + '"></div>' +
      '<div class="field"><label class="field-label" for="vrijemeOdstrjela">' + esc(t('lblVrijeme')) + '</label><input type="time" id="vrijemeOdstrjela" value="' + esc(d.vrijemeOdstrjela || '') + '"></div></div>' +
      '<div class="field"><label class="field-label req" for="lovac">' + esc(t('lblLovac')) + '</label><input type="text" id="lovac" list="lovci-list" autocomplete="off" value="' + esc(d.lovac || '') + '" placeholder="' + esc(t('phLovac')) + '"><datalist id="lovci-list"></datalist><div class="chips lovci-chips" id="lovci-chips"></div></div>' +
      '<div class="field"><label class="field-label" id="napomena-label" for="napomena">' + esc(t('lblNapomena')) + '</label><textarea id="napomena">' + esc(d.napomena || '') + '</textarea>' +
      '<button type="button" class="btn small" id="napomena-ok" style="margin-top:8px"' + (sp === 'Divlja svinja' ? '' : ' hidden') + '>' + ICONS.check + esc(t('btnNoAnomalies')) + '</button></div>' +
      '</div>' +

      (edit ? '' : '<div class="panel" id="cold-panel"><label style="display:flex;gap:12px;align-items:center;font-weight:600;cursor:pointer;min-height:44px"><input type="checkbox" id="cold" checked style="width:22px;height:22px">' +
        '<span>' + esc(t('coldCheck')) + '</span></label>' +
        '<div class="field" id="asp-wrap" style="margin-top:12px" hidden><label class="field-label" for="aspUzorak">' + esc(t('lblAspUzorak')) + '</label><input type="text" id="aspUzorak" placeholder="' + esc(t('phAspUzorak')) + '"></div></div>') +

      // Drückjagd-Strecke wird auf der Drückjagdseite erfasst — hier nur Jagdart und Foto
      '<div class="panel">' +
      '<div class="field"><label class="field-label" for="nacinLova">' + esc(t('lblNacinLova')) + '</label><select id="nacinLova"><option value=""></option>' +
      NACINI.map(function (n) { return '<option value="' + esc(n) + '"' + (d.nacinLova === n ? ' selected' : '') + '>' + esc(I18n.nacin(n)) + '</option>'; }).join('') + '</select></div>' +
      (canPhoto ? '<div class="field"><label class="field-label" for="foto">' + esc(t('lblFoto')) + '</label><input type="file" id="foto" accept="image/*" capture="environment"><div class="photo-preview" id="foto-preview"></div></div>' : '') +
      '</div>' +
      '<div class="error-msg" id="error-msg" hidden></div>' +
      '<button type="submit" class="btn primary block" id="submit-btn" style="min-height:56px;font-size:1.05rem">' + esc(edit ? t('btnSaveChanges') : t('btnSaveOdstrjel')) + '</button>' +
      '</form>';
  }

  /** Erste Zeile: mit gewähltem Geschlecht der jagdliche Name (Schmalspießer, Überläuferbache …), sonst der neutrale. */
  function stufe1Label(vrsta, spol, v) {
    if (v === 'starije') return I18n.klasaStarije();
    if (spol && KATEGORIJA[vrsta]) { var n = kategorija(vrsta, spol, v, I18n.lang()); return n.charAt(0).toUpperCase() + n.slice(1); }
    return v === 'Tele/prase' ? I18n.klasaTele(vrsta) : I18n.klasaPomladak(vrsta);
  }
  /** „Schmalspießer / Schmaltier“ → zwei Zeilen (passt in den schmalen Knopf). */
  function stufe1Html(vrsta, spol, v) { return stufe1Label(vrsta, spol, v).split(' / ').map(esc).join('<br>'); }
  function stufe2Label(vrsta, v) {
    return '<b>' + esc(I18n.klasaStufe2(v)) + '</b><small>' + esc(I18n.godine(vrsta, v)) + '</small>';
  }
  /** Altersklassen-Wähler (auch für die Drückjagd-Erfassung). name = Präfix der Radio-Gruppen. */
  function klasaHtml(name, vrsta, spol, value) {
    var s1 = STUFE2.indexOf(value) !== -1 ? 'starije' : value || '', s2 = STUFE2.indexOf(value) !== -1 ? value : '';
    return '<div class="klasa-pick" data-klasa-pick="' + esc(name) + '"><div class="radio-group klasa-group three">' +
      STUFE1.map(function (k) {
        return '<label><input type="radio" name="' + esc(name) + '-1" value="' + k + '"' + (s1 === k ? ' checked' : '') + '><span data-k1="' + k + '">' + stufe1Html(vrsta, spol, k) + '</span></label>';
      }).join('') + '</div>' +
      '<div class="klasa-2"' + (s1 === 'starije' && I18n.imaStufe2(vrsta) ? '' : ' hidden') + '><span class="field-label req">' + esc(t('klasaDob')) + '</span><div class="radio-group klasa-group three">' +
      STUFE2.map(function (k) {
        return '<label><input type="radio" name="' + esc(name) + '-2" value="' + esc(k) + '"' + (s2 === k ? ' checked' : '') + '><span data-k2="' + esc(k) + '">' + stufe2Label(vrsta, k) + '</span></label>';
      }).join('') + '</div></div></div>';
  }
  /** Beschriftung und zweite Zeile an Wildart/Geschlecht anpassen (gewählte Werte bleiben). */
  function klasaUpdate(root, name, vrsta, spol) {
    var box = root.querySelector('[data-klasa-pick="' + name + '"]');
    if (!box) return;
    UI.$$('[data-k1]', box).forEach(function (x) { x.innerHTML = stufe1Html(vrsta, spol, x.getAttribute('data-k1')); });
    UI.$$('[data-k2]', box).forEach(function (x) { x.innerHTML = stufe2Label(vrsta, x.getAttribute('data-k2')); });
    var s1 = box.querySelector('input[name="' + name + '-1"]:checked');
    box.querySelector('.klasa-2').hidden = !(s1 && s1.value === 'starije' && I18n.imaStufe2(vrsta));
  }
  /** Gespeicherter Sheet-Wert; '' wenn nichts oder bei „Älter“ die zweite Zeile noch fehlt. */
  function klasaValue(root, name, vrsta) {
    var s1 = root.querySelector('input[name="' + name + '-1"]:checked');
    if (!s1) return '';
    if (s1.value !== 'starije') return s1.value;
    if (!I18n.imaStufe2(vrsta)) return 'Zrela klasa';
    var s2 = root.querySelector('input[name="' + name + '-2"]:checked');
    return s2 ? s2.value : '';
  }

  /**
   * Geweih/Trophäe: 'vrhovi' (Rothirsch: Enden), 'lopata' (Damhirsch: Schaufelstufe), 'foto' (Rehbock, Widder,
   * älterer Keiler: nur Foto-Knopf) oder ''. Nüchtern gehalten — Dokumentation, keine Trophäenschau.
   */
  function trofejNacin(vrsta, spol, klasa) {
    if (spol !== 'm') return '';
    var jung = klasa === 'Tele/prase';
    if (vrsta === 'Jelen obični') return jung ? '' : 'vrhovi';
    if (vrsta === 'Jelen lopatar') return jung ? '' : 'lopata';
    if (vrsta === 'Srna' || vrsta === 'Muflon') return jung ? '' : 'foto';
    // Keilerwaffen: trophäenwürdig ab dem 3. Lebensjahr (LGO 3.2.3.1)
    if (vrsta === 'Divlja svinja') return STUFE2.indexOf(klasa) !== -1 ? 'foto' : '';
    return '';
  }

  /** HTML des Geweih-Blocks. v = { rogovlje, masa, cic, foto }, o = { photo: Foto-Knopf zeigen, ocjena: Bewertung zeigen } */
  function trofejHtml(nacin, v, o) {
    if (!nacin) return '';
    var h = '';
    if (nacin === 'vrhovi') {
      h += '<div class="field"><label class="field-label req" for="rog-vrhovi">' + esc(t('lblVrhovi')) + '</label>' +
        '<input type="number" id="rog-vrhovi" inputmode="numeric" min="2" max="30" step="1" value="' + esc(v.rogovlje || '') + '" style="max-width:140px">' +
        '<p class="hint">' + esc(t('hintVrhovi')) + '</p></div>';
    }
    if (nacin === 'lopata') {
      h += '<div class="field"><span class="field-label req">' + esc(t('lblLopata')) + '</span><div class="radio-group klasa-group">' +
        I18n.LOPATA_STUFEN.map(function (k) { return '<label><input type="radio" name="lopata" value="' + esc(k) + '"' + (v.rogovlje === k ? ' checked' : '') + '><span>' + esc(I18n.lopata(k)) + '</span></label>'; }).join('') + '</div></div>';
    }
    if (o.photo) h += '<div class="field"><button type="button" class="btn small ghost" id="trofej-foto">' + ICONS.camera + (v.foto ? '✓ ' : '') + esc(t('lblFoto')) + '</button></div>';
    if (o.ocjena) {
      h += '<div class="field"><span class="field-label">' + esc(t('trofejTitle')) + '</span><div class="grid-2">' +
        '<div><label class="hint" for="rog-masa" style="display:block;margin:0 0 4px">' + esc(t('lblTrofejMasa')) + '</label><input type="number" id="rog-masa" inputmode="decimal" step="0.01" min="0" value="' + esc(v.masa || '') + '"></div>' +
        '<div><label class="hint" for="rog-cic" style="display:block;margin:0 0 4px">' + esc(t('lblCic')) + '</label><input type="number" id="rog-cic" inputmode="decimal" step="0.01" min="0" value="' + esc(v.cic || '') + '"></div></div></div>';
    }
    return h;
  }

  /** Geweih-Block neu zeichnen, wenn Wildart, Geschlecht oder Klasse wechseln (eingegebene Werte bleiben erhalten). */
  function updateTrofej(el) {
    var wrap = el.querySelector('#trofej-wrap');
    if (!wrap || !st) return;
    readTrofej(el);
    var spol = el.querySelector('input[name=spol]:checked');
    klasaUpdate(el, 'dobnaKlasa', st.species, spol ? spol.value : '');
    var nacin = trofejNacin(st.species, spol ? spol.value : '', klasaValue(el, 'dobnaKlasa', st.species));
    if (nacin === st.trofejNacin) return;
    st.trofejNacin = nacin;
    wrap.innerHTML = trofejHtml(nacin, { rogovlje: st.rogovlje, masa: st.masa, cic: st.cic, foto: st.foto },
      { photo: !!el.querySelector('#foto'), ocjena: !!(st.edit && !st.edit._new) });
    var fb = wrap.querySelector('#trofej-foto');
    if (fb) fb.onclick = function () { el.querySelector('#foto').click(); };
  }
  function readTrofej(el) {
    var x;
    if ((x = el.querySelector('#rog-vrhovi'))) st.rogovlje = x.value.trim();
    if ((x = el.querySelector('input[name=lopata]:checked'))) st.rogovlje = x.value;
    if ((x = el.querySelector('#rog-masa'))) st.masa = x.value.trim();
    if ((x = el.querySelector('#rog-cic'))) st.cic = x.value.trim();
  }

  function setSpecies(el, v) {
    st.species = v;
    UI.$$('.species-btn', el).forEach(function (b) { b.setAttribute('aria-pressed', String(b.getAttribute('data-sp') === v)); });
    el.querySelector('#ostalo-wrap').hidden = v !== 'Ostalo';
    var svinja = v === 'Divlja svinja';
    el.querySelector('#napomena-label').classList.toggle('req', svinja);
    el.querySelector('#napomena').placeholder = svinja ? t('phNapomenaSvinja') : t('phNapomena');
    el.querySelector('#napomena-ok').hidden = !svinja;
    el.querySelector('#klasa-label').classList.toggle('req', v !== 'Ostalo');
    var asp = el.querySelector('#asp-wrap');
    if (asp) asp.hidden = !svinja;
    updateTrofej(el);
  }

  async function mount(el, ctx) {
    var edit = editTarget(ctx);
    if (ctx.params[0] === 'uredi' && !edit) return;
    st = { species: null, foto: '', lat: edit ? edit.lat : '', lon: edit ? edit.lon : '', zona: edit ? edit.zona : '', acc: null, edit: edit,
      rogovlje: edit && edit.rogovlje !== undefined ? String(edit.rogovlje) : '', masa: edit && edit.trofejMasa !== undefined ? String(edit.trofejMasa) : '',
      cic: edit && edit.trofejCic !== undefined ? String(edit.trofejCic) : '', trofejNacin: null };
    var list = el.querySelector('#lovci-list');
    var local = (await DB.get('lovciLocal')) || [];
    var seen = {};
    var lastLovac = edit ? '' : (((await DB.get('last')) || {}).lovac || '');
    var namen = [];
    [lastLovac].concat(local.slice().reverse(), Store.lovci()).forEach(function (n) {
      var k = String(n || '').trim().toLowerCase(); if (!k || seen[k]) return; seen[k] = 1;
      namen.push(String(n).trim());
      var o = document.createElement('option'); o.value = n; list.appendChild(o);
    });
    // Erleger mit einem Tipp: zuletzt gewählte zuerst, dann die Jäger aus der Liste (Freitext bleibt möglich)
    var chips = el.querySelector('#lovci-chips'), lovacIn = el.querySelector('#lovac');
    function markChips() { UI.$$('.chip', chips).forEach(function (c) { c.setAttribute('aria-pressed', String(c.textContent === lovacIn.value.trim())); }); }
    chips.innerHTML = namen.slice(0, 8).map(function (n) { return '<button type="button" class="chip">' + esc(n) + '</button>'; }).join('');
    UI.$$('.chip', chips).forEach(function (c) { c.onclick = function () { lovacIn.value = c.textContent; markChips(); }; });
    lovacIn.addEventListener('input', markChips);

    if (edit) {
      setSpecies(el, SPECIES.indexOf(edit.vrsta) === -1 ? 'Ostalo' : edit.vrsta);
      st.lovId = edit.lovId || ''; st.stajaliste = edit.stajaliste || '';
    } else {
      // „wie letzter Eintrag" auf DIESEM Handy (IndexedDB, nie vom Server): Lovište, Jäger, Jagdart; Datum nur, wenn < 12 h her
      var last = (await DB.get('last')) || {};
      var q = ctx.query || {};
      if (last.lokacija) el.querySelector('#lokacija').value = last.lokacija;
      if (last.lovac) { el.querySelector('#lovac').value = last.lovac; markChips(); }
      if (last.nacinLova) el.querySelector('#nacinLova').value = last.nacinLova;
      var recent = last.at && Date.now() - last.at < 12 * 3600e3;
      el.querySelector('#datum').value = (recent && last.datum) || UI.todayISO();
      st.lovId = ''; st.stajaliste = '';
      if (q.lov) { // alter Link „#/odstrjel/novi?lov=…" funktioniert weiter
        var lov = Store.lovovi().filter(function (l) { return l.id === q.lov; })[0];
        if (lov) { st.lovId = lov.id; el.querySelector('#nacinLova').value = 'Prigon/pogon'; if (lov.lokacija) el.querySelector('#lokacija').value = lov.lokacija; el.querySelector('#datum').value = String(lov.datum).slice(0, 10); }
      }
      if (q.vrsta) setSpecies(el, q.vrsta);
    }

    UI.$$('.species-btn', el).forEach(function (b) { b.onclick = function () { setSpecies(el, b.getAttribute('data-sp')); }; });
    UI.$$('input[name=spol], input[name^="dobnaKlasa-"]', el).forEach(function (r) { r.addEventListener('change', function () { updateTrofej(el); }); });
    updateTrofej(el);
    // Schwarzwild: Pflichtbemerkung mit einem Tipp (Wert bleibt Kroatisch, wie alles im Sheet)
    el.querySelector('#napomena-ok').onclick = function () {
      var n = el.querySelector('#napomena');
      if (!n.value.trim()) n.value = I18n._dict.hr.btnNoAnomalies.toLowerCase();
    };

    async function setLoc(pos, acc) {
      st.lat = pos.lat; st.lon = pos.lon; st.acc = acc || null;
      var box = el.querySelector('#loc-result');
      box.innerHTML = '<p class="hint">' + esc(t('loading')) + '</p>';
      var lov = await Geo.lovisteAt(pos.lat, pos.lon);
      if (lov) el.querySelector('#lokacija').value = lov;
      st.zona = await Geo.ortLabel(pos.lat, pos.lon);
      renderLoc(lov);
    }
    function renderLoc(lov) {
      var box = el.querySelector('#loc-result');
      if (!st.lat) { box.innerHTML = ''; return; }
      box.innerHTML = '<div class="loc-result">' + miniMap(st.lat, st.lon) + '<div class="loc-text"><b>' + esc(st.zona || t('locUnnamed')) + '</b>' +
        '<span class="hint">' + esc((lov === '' ? t('gpsOutside') + ' · ' : lov ? Strecke.shortLov(lov) + ' · ' : '') + st.lat + ', ' + st.lon + (st.acc ? ' (±' + st.acc + ' m)' : '')) + '</span>' +
        '<div class="btn-row"><button type="button" class="btn small" id="loc-change">' + esc(t('locChange')) + '</button><button type="button" class="btn small ghost" id="loc-clear">' + esc(t('locClear')) + '</button></div></div></div>';
      box.querySelector('#loc-change').onclick = pickMap;
      box.querySelector('#loc-clear').onclick = function () { st.lat = ''; st.lon = ''; st.zona = ''; st.acc = null; renderLoc(); };
    }
    async function pickMap() {
      var last = st.lat ? { lat: st.lat, lon: st.lon } : ((await DB.get('lastPos')) || null);
      var pos = await MapPicker.open(last);
      if (pos) { await DB.set('lastPos', pos); setLoc(pos); }
    }
    el.querySelector('#loc-map').onclick = pickMap;
    el.querySelector('#loc-gps').onclick = async function () {
      var btn = this; btn.disabled = true;
      el.querySelector('#loc-result').innerHTML = '<p class="hint">' + esc(t('gpsWaiting')) + '</p>';
      try { var p = await Geo.precise(); await setLoc(p, p.acc); }
      catch (e) { el.querySelector('#loc-result').innerHTML = '<p class="hint">' + esc(e && e.code === 1 ? t('gpsDenied') : t('gpsFailed')) + '</p>'; }
      btn.disabled = false;
    };
    if (st.lat) renderLoc(null);

    var foto = el.querySelector('#foto');
    if (foto) foto.onchange = async function (ev) {
      var prev = el.querySelector('#foto-preview');
      prev.innerHTML = ''; st.foto = '';
      try { st.foto = await UI.readPhoto(ev.target.files[0]); if (st.foto) prev.innerHTML = '<img alt="" src="' + st.foto + '">'; } catch (e) {}
      var fb = el.querySelector('#trofej-foto');
      if (fb) fb.innerHTML = ICONS.camera + (st.foto ? '✓ ' : '') + esc(t('lblFoto'));
    };

    el.querySelector('#unos-form').addEventListener('submit', function (ev) { ev.preventDefault(); save(el); });
  }

  function showError(el, msg) {
    var e = el.querySelector('#error-msg');
    e.textContent = msg; e.hidden = false;
    e.scrollIntoView({ block: 'center', behavior: 'smooth' });
  }

  async function save(el) {
    el.querySelector('#error-msg').hidden = true;
    var v = function (id) { var x = el.querySelector('#' + id); return x ? x.value.trim() : ''; };
    if (!st.species) return showError(el, t('errSelectVrsta'));
    if (st.species === 'Ostalo' && !v('vrstaOstalo')) return showError(el, t('errOstalo'));
    var spol = el.querySelector('input[name=spol]:checked');
    var klasa = klasaValue(el, 'dobnaKlasa', st.species);
    var data = {
      vrsta: st.species === 'Ostalo' ? v('vrstaOstalo') : st.species,
      tezina: v('tezina'), spol: spol ? spol.value : '', dobnaKlasa: klasa, klaseV: 2,
      brojMarkice: v('brojMarkice'), lokacija: v('lokacija'), datum: v('datum'), lovac: v('lovac'),
      napomena: v('napomena'), nacinLova: v('nacinLova'), zona: st.lat ? (st.zona || '') : (st.edit ? st.edit.zona || '' : ''),
      vrijemeOdstrjela: v('vrijemeOdstrjela'),
      lovId: st.lovId || '', stajaliste: st.stajaliste || '',
      lat: st.lat || '', lon: st.lon || ''
    };
    if (data.vrsta === 'Divlja svinja' && !data.napomena) return showError(el, t('errSvinjaNapomena'));
    if (!data.tezina || !data.spol || !data.lokacija || !data.datum || !data.lovac || !data.brojMarkice) return showError(el, t('errRequired'));
    if (!(Number(data.tezina) > 0)) return showError(el, t('errTezina'));
    if (!data.dobnaKlasa && st.species !== 'Ostalo') return showError(el, t('errKlasa'));
    // Geweih: Enden (Rothirsch) bzw. Schaufelstufe (Damhirsch) Pflicht; Gewicht/CIC nur beim Bearbeiten
    readTrofej(el);
    var nacin = trofejNacin(data.vrsta, data.spol, data.dobnaKlasa);
    if (nacin === 'vrhovi') {
      var n = Number(st.rogovlje);
      if (!st.rogovlje || !(n >= 2 && n <= 30) || Math.round(n) !== n) return showError(el, t('errVrhovi'));
      data.rogovlje = String(n);
    } else if (nacin === 'lopata') {
      if (I18n.LOPATA_STUFEN.indexOf(st.rogovlje) === -1) return showError(el, t('errLopata'));
      data.rogovlje = st.rogovlje;
    } else if (st.edit) data.rogovlje = '';
    if (st.edit && !st.edit._new && nacin) { data.trofejMasa = st.masa || ''; data.trofejCic = st.cic || ''; }

    var btn = el.querySelector('#submit-btn');
    btn.disabled = true;
    try {
      if (st.edit) {
        await Store.queueUpsert('odstrjel', Object.assign({ id: st.edit.id }, data, st.foto ? { foto: st.foto } : {}));
        App.syncNow({ quiet: true });
        UI.haptic();
        UI.toast(t('savedChanges'));
        App.go('#/odstrjel');
        return;
      }
      data.id = Store.uuid();
      if (st.foto) data.foto = st.foto;
      await Store.queueSubmit(data);
      UI.haptic();
      var cold = el.querySelector('#cold');
      if (cold && cold.checked) {
        var asp = v('aspUzorak');
        await Store.queueUpsert('wildbret', { id: data.id, hladnjacaOd: UI.nowLocalISO(), aspUzorak: asp, aspNalaz: (asp || data.vrsta === 'Divlja svinja') ? 'ceka' : '' });
      }
      await DB.set('last', { lokacija: data.lokacija, lovac: data.lovac, nacinLova: data.nacinLova, datum: data.datum, lovId: data.lovId, at: Date.now() });
      var local = (await DB.get('lovciLocal')) || [];
      if (local.map(function (n) { return n.toLowerCase(); }).indexOf(data.lovac.toLowerCase()) === -1) { local.push(data.lovac); await DB.set('lovciLocal', local); }
    } catch (e) {
      btn.disabled = false;
      return showError(el, t('errSaveFailed') + ' ' + (e && e.message ? e.message : ''));
    }
    btn.disabled = false;
    showDone(false, [], data);
    if (navigator.onLine) {
      var res = await App.syncNow({ quiet: true });
      if (res && res.sent.indexOf('odstrjel:' + data.id) !== -1) showDone(true, res.warnings, data);
    }
  }

  function showDone(sent, warnings, data) {
    var o = document.getElementById('done');
    document.getElementById('done-icon').innerHTML = ICONS.check.replace('<svg', '<svg class="success-icon"');
    document.getElementById('done-title').textContent = sent ? t('doneSent') : t('doneLocal');
    document.getElementById('done-text').textContent = kategorija(data.vrsta, data.spol, data.dobnaKlasa, I18n.lang()) + ' · ' + data.tezina + ' kg · #' + data.brojMarkice + ' — ' + (sent ? t('doneSentText') : t('doneLocalText'));
    var w = document.getElementById('done-warn');
    w.hidden = !(warnings && warnings.length);
    w.textContent = warnings && warnings.length ? warnings.join(' ') : '';
    o.classList.add('show');
    document.getElementById('done-again').onclick = function () { o.classList.remove('show'); App.render(); };
    document.getElementById('done-close').onclick = function () { o.classList.remove('show'); App.go(data.lovId ? '#/lov/' + data.lovId : '#/odstrjel'); };
  }

  return { render: render, mount: mount, trofejNacin: trofejNacin, trofejHtml: trofejHtml, klasaHtml: klasaHtml, klasaUpdate: klasaUpdate, klasaValue: klasaValue };
})();
