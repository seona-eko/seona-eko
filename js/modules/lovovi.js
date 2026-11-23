/**
 * Skupni lovovi (Drückjagden): Liste, Detail mit Strecke der Jagd, Stände auf der Karte.
 * Anlegen/Ändern nur Verwaltung (Server prüft). Strecke = Abschüsse mit lovId.
 */
(function () {
  var esc = UI.esc, t = I18n.t;

  function lovById(id) { return Store.lovovi().filter(function (l) { return l.id === id; })[0]; }
  /** Stände der Drückjagd (eigene Punkte auf der Karte, keine Einrichtungen), nach Nummer sortiert. */
  function staendeOf(l) { return (l && Array.isArray(l.staende) ? l.staende.slice() : []).sort(function (a, b) { return a.nr - b.nr; }); }
  window.LovStaende = staendeOf;
  /** Reviere einer Drückjagd — eine Jagd kann über zwei oder drei Reviere gehen (lokacija „A, B“). */
  function revOf(l) { return String(l && l.lokacija || '').split(/,\s*/).filter(Boolean); }
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
        '<h1>' + esc(App.isUprava() ? t('lovCount', { n: all.length }) : t('lovoviTitle')) + '</h1>' +
        '<p>' + esc(next ? t('lovoviNext', { d: UI.fmtDay(String(next.datum).slice(0, 10)), l: Strecke.shortLov(next.lokacija) }) : t('noNextLov')) + '</p></div>' +
        (App.isUprava() ? '<button type="button" class="btn block" id="new-lov" style="margin-bottom:14px">' + ICONS.plus + esc(t('newLov')) + '</button>' : '') +
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
      var stands = staendeOf(l), besetzt = stands.filter(function (x) { return x.strijelac; }).length;
      var kg = s.reduce(function (a, r) { return a + (Number(r.tezina) || 0); }, 0);
      var sudionici = String(l.sudionici || '').split(/\n|,/).map(function (x) { return x.trim(); }).filter(Boolean);
      var isPast = String(l.datum).slice(0, 10) <= UI.todayISO();
      return UI.back('#/lovovi', t('lovoviTitle')) + '<div class="page-head"><div class="eyebrow">' + esc(Strecke.shortLov(l.lokacija)) + '</div>' +
        '<h1>' + esc(l.naziv || t('lovDefaultName')) + '</h1>' +
        '<p>' + esc(UI.fmtDate(String(l.datum).slice(0, 10), { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })) + (l.vodja ? ' · ' + esc(t('lblVodja')) + ': ' + esc(l.vodja) : '') + '</p></div>' +
        (isPast || s.length ? '<button type="button" class="btn primary block" id="lov-add" style="margin-bottom:12px">' + ICONS.plus + esc(t('addToLov')) + '</button>' : '') +
        '<div class="grid-2"><div class="tile"><div class="t-label">' + ICONS.list + esc(t('tileStrecke')) + '</div><div class="t-value">' + s.length + '</div><div class="t-sub">' + esc(t('pieces')) + '</div></div>' +
        '<a class="tile" href="#/lovkarta/' + encodeURIComponent(l.id) + '"><div class="t-label">' + ICONS.pin + esc(t('stands')) + '</div><div class="t-value">' + stands.length + '</div><div class="t-sub">' + esc(stands.length ? t('standsSummary', { n: stands.length, b: besetzt }) : (sudionici.length ? t('participantsN', { n: sudionici.length }) : '—')) + '</div></a></div>' +
        // Eine Liste der Stücke; darüber nur die Summen je Wildart als kleine Zeile (keine zweite Aufstellung)
        (s.length ? '<div class="section-title"><h2>' + esc(t('lovStrecke')) + '</h2><span class="hint">' +
          esc(Object.keys(bySpecies).map(function (v) { return I18n.species(v) + ' ' + bySpecies[v].n; }).join(' · ')) + '</span></div>' +
          '<div class="panel flush"><ul class="list">' + s.map(Strecke.rowHtml).join('') + '</ul></div>' : '') +
        '<div class="section-title"><h2>' + esc(t('stands')) + '</h2>' + (stands.length ? '<a href="#/lovkarta/' + encodeURIComponent(l.id) + '">' + esc(t('onMap')) + '</a>' : '') + '</div>' +
        (stands.length ? '<div class="panel flush"><ul class="list">' + stands.map(function (x) {
          var n = s.filter(function (r) { return r.stajaliste === x.id; }).length;
          return '<li><button type="button" class="row" data-stand="' + esc(x.id) + '"><span class="r-icon stand-nr">' + esc(String(x.nr)) + '</span><span class="r-main"><span class="r-title">' + esc(t('standN', { n: x.nr })) + '</span>' +
            '<span class="r-sub">' + esc(x.strijelac ? x.strijelac + (x.gostId ? ' · ' + t('guestTag') : '') : t('standFree')) + '</span></span>' +
            (n ? '<span class="r-end"><b>' + n + '</b>' + esc(t('pieces')) + '</span>' : '') + ICONS.chevron.replace('<svg', '<svg class="chev"') + '</button></li>';
        }).join('') + '</ul></div>'
          : '<div class="panel"><p class="hint" style="margin:0 0 ' + (App.isUprava() ? '12px' : '0') + '">' + esc(t('standsEmpty')) + '</p>' +
            (App.isUprava() ? '<a class="btn block" href="#/lovkarta/' + encodeURIComponent(l.id) + '">' + ICONS.pin + esc(t('standsOnMap')) + '</a>' : '') + '</div>') +
        (sudionici.length ? '<div class="section-title"><h2>' + esc(t('participants')) + '</h2></div><div class="panel"><div class="chips" style="flex-wrap:wrap">' + sudionici.map(function (p) { return '<span class="badge plain muted">' + esc(p) + '</span>'; }).join('') + '</div></div>' : '') +
        '<div class="section-title"><h2>' + esc(t('gMeeting')) + '</h2>' + (App.isUprava() ? '<a href="#/lovkarta/' + encodeURIComponent(l.id) + '?meet=1">' + esc(l.sastanakLat ? t('onMap') : t('meetSet')) + '</a>' : '') + '</div>' +
        '<div class="panel"><p style="margin:0">' + esc(l.sastanak || t('meetNone')) + '</p>' +
        (l.napomenaGost ? '<p class="hint" style="margin:8px 0 0;white-space:pre-wrap"><b>' + esc(t('lblNapomenaGost')) + ':</b> ' + esc(l.napomenaGost) + '</p>' : '') + '</div>' +
        (l.napomena ? '<div class="section-title"><h2>' + esc(t('lblNapomenaIntern')) + '</h2></div><div class="panel"><p style="margin:0;white-space:pre-wrap">' + esc(l.napomena) + '</p></div>' : '') +
        (App.isUprava() ? '<div class="btn-row" style="margin-top:16px"><button type="button" class="btn" id="edit-lov">' + ICONS.edit + esc(t('edit')) + '</button><button type="button" class="btn danger" id="del-lov">' + ICONS.trash + esc(t('delete')) + '</button></div>' : '');
    },
    mount: function (el, ctx) {
      var l = lovById(decodeURIComponent(ctx.params[0] || ''));
      if (!l) return;
      UI.$$('.row[data-id]', el).forEach(function (b) { b.onclick = function () { Strecke.openDetail(b.getAttribute('data-id')); }; });
      UI.$$('.row[data-stand]', el).forEach(function (b) {
        b.onclick = function () { openStandSheet(l.id, b.getAttribute('data-stand'), {}); };
        if (!App.isUprava()) return;
        UI.wischLoeschen(b.parentNode, { label: t('standDelete'), onDelete: async function () {
          var akt = lovById(l.id), vorher = staendeOf(akt), weg = vorher.filter(function (x) { return x.id === b.getAttribute('data-stand'); })[0];
          await Store.queueUpsert('lov', { id: l.id, staende: vorher.filter(function (x) { return x !== weg; }) });
          App.syncNow({ quiet: true });
          UI.toast(t('standDeleted', { n: weg ? weg.nr : '' }), { timeout: 6000, action: t('undo'), onAction: async function () {
            var jetzt = staendeOf(lovById(l.id));
            if (weg && !jetzt.some(function (x) { return x.id === weg.id; })) {
              await Store.queueUpsert('lov', { id: l.id, staende: jetzt.concat([weg]) });
              App.syncNow({ quiet: true });
            }
          } });
        } });
      });
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
   * Strecke der Drückjagd erfassen — so kurz wie möglich: Wildart, ein Tipp auf das Stück (Geschlecht + Altersklasse
   * in einem), Gewicht, Stand. Der Schütze kommt vom Stand. Ort = Stand, Datum/Revier/Jagdart kommen von der Jagd.
   * Das Blatt bleibt offen für das nächste Stück; die Wildart bleibt stehen (meist mehrere Sauen hintereinander).
   */
  var QUICK_SPECIES = ['Divlja svinja', 'Jelen obični', 'Jelen lopatar', 'Srna'];
  /** Stück-Kacheln einer Wildart: alle Paare Geschlecht × Klasse; gleiche Namen (z. B. Bache) bekommen die Klasse dazu. */
  function stueckKacheln(vrsta) {
    var lang = I18n.lang(), list = [];
    ['m', 'ž'].forEach(function (sp) {
      KLASE_SVE.forEach(function (k) { list.push({ spol: sp, klasa: k, name: kategorija(vrsta, sp, k, lang) }); });
    });
    var zahl = {};
    list.forEach(function (x) { zahl[x.name] = (zahl[x.name] || 0) + 1; });
    list.forEach(function (x) { if (zahl[x.name] > 1) x.name += ' · ' + String(I18n.klasaFor(vrsta, x.klasa)).split(' (')[0]; });
    // Reihenfolge wie auf der Strecke: jung → alt, je männlich/weiblich nebeneinander
    return KLASE_SVE.reduce(function (a, k) { return a.concat(list.filter(function (x) { return x.klasa === k; })); }, []);
  }
  function openQuick(l) {
    var stands = staendeOf(l), reviere = revOf(l);
    var lovci = [];
    [l.vodja].concat(String(l.sudionici || '').split(/\n|,/), stands.map(function (x) { return x.strijelac; }), Store.lovci())
      .map(function (x) { return String(x || '').trim(); }).forEach(function (n) { if (n && lovci.indexOf(n) === -1) lovci.push(n); });
    var q = { species: QUICK_SPECIES[0], stueck: null, stand: null, lovac: '', n: 0, trofej: null };
    var html = '<div class="q-kopf"><h2>' + esc(t('lovQuickTitle')) + '</h2><span class="hint" id="q-n"></span></div>' +
      '<form id="q-form" novalidate>' +
      '<div class="field-label">' + esc(t('lblVrsta')) + '</div><div class="species-grid four">' + QUICK_SPECIES.map(function (v) {
        return '<button type="button" class="species-btn" data-sp="' + esc(v) + '" aria-pressed="' + (v === q.species) + '">' + ICONS.forSpecies(v) + '<span>' + esc(I18n.species(v)) + '</span></button>';
      }).join('') + '</div>' +
      '<div class="field-label" style="margin-top:14px">' + esc(t('qPiece')) + '</div><div class="q-stueck" id="q-stueck"></div>' +
      '<div id="q-trofej"></div>' +
      '<div class="field" style="margin-top:12px"><label class="field-label req" for="q-kg">' + esc(t('lblTezinaShort')) + '</label><div class="unit-wrap"><input type="number" id="q-kg" inputmode="decimal" min="1" step="0.5"><span>kg</span></div></div>' +
      (stands.length ? '<div class="field-label">' + esc(t('lblStand')) + '</div><div class="q-staende" id="q-staende">' + stands.map(function (x) {
        return '<button type="button" data-st="' + esc(x.id) + '" aria-pressed="false">' + esc(String(x.nr)) + '</button>';
      }).join('') + '</div>' : '') +
      '<p class="q-schuetze" id="q-schuetze"></p>' +
      // Mehrere Reviere: jedes Stück gehört zu genau einem (Abschussplan je Revier) — vom Stand, sonst hier wählen
      (reviere.length > 1 ? '<div class="field-label" style="margin-top:10px">' + esc(t('lblLoviste')) + '</div><div class="q-staende q-rev" id="q-rev">' + reviere.map(function (x) {
        return '<button type="button" data-rev="' + esc(x) + '" aria-pressed="false">' + esc(Strecke.shortLov(x)) + '</button>';
      }).join('') + '</div>' : '') +
      // Schütze: vom Stand übernommen; sonst Auswahl aus den eingetragenen Jägern (kein freies Feld)
      '<div class="field" id="q-lovac-wrap" hidden><span class="field-label req">' + esc(t('lblLovac')) + '</span><div class="stand-wahl" id="q-lovci">' +
        lovci.map(function (n) { return '<button type="button" data-n="' + esc(n) + '" aria-pressed="false">' + esc(n) + '</button>'; }).join('') + '</div></div>' +
      '<details class="more"><summary>' + esc(t('lblNapomena')) + '</summary><div class="field" style="margin-top:8px"><textarea id="q-nap" rows="2"></textarea></div>' +
        '</details>' +
      '<div class="error-msg" id="q-err" hidden></div>' +
      '<button type="submit" class="btn primary block q-save">' + esc(t('qSaveNext')) + '</button></form>';
    UI.openSheet(html, function (el) {
      function markiereLovac() {
        UI.$$('#q-lovci button', el).forEach(function (b) { b.setAttribute('aria-pressed', String(b.getAttribute('data-n') === q.lovac)); });
      }
      /** Hat der Stand einen Schützen: nur „Erlegt von …“ (ändern öffnet die Auswahl). Sonst die Auswahl der Jäger. */
      function zeigeSchuetze() {
        var box = el.querySelector('#q-schuetze'), wrap = el.querySelector('#q-lovac-wrap');
        var vomStand = q.stand && q.stand.strijelac;
        if (vomStand && !q.auswahl) {
          wrap.hidden = true;
          box.innerHTML = esc(t('qShotBy')) + ' <b>' + esc(q.lovac || vomStand) + '</b> <button type="button" class="link" id="q-aendern">· ' + esc(t('qChange')) + '</button>';
          box.querySelector('#q-aendern').onclick = function () { q.auswahl = true; q.lovac = q.lovac || vomStand; zeigeSchuetze(); };
        } else {
          box.innerHTML = '';
          wrap.hidden = false;
          markiereLovac();
        }
      }
      UI.$$('#q-lovci button', el).forEach(function (b) {
        b.onclick = function () { q.lovac = b.getAttribute('data-n'); markiereLovac(); };
      });
      function trofej() {
        var x = q.stueck, nacin = x ? Odstrjel.trofejNacin(q.species, x.spol, x.klasa) : '';
        if (nacin === 'foto') nacin = '';
        if (nacin === q.trofej) return;
        q.trofej = nacin;
        el.querySelector('#q-trofej').innerHTML = Odstrjel.trofejHtml(nacin, { rogovlje: '' }, { photo: false, ocjena: false });
      }
      function zeichneStueck() {
        var k = stueckKacheln(q.species);
        el.querySelector('#q-stueck').innerHTML = k.map(function (x, i) {
          var an = q.stueck && q.stueck.spol === x.spol && q.stueck.klasa === x.klasa;
          return '<button type="button" data-i="' + i + '" aria-pressed="' + !!an + '">' + esc(x.name) + '</button>';
        }).join('');
        UI.$$('#q-stueck button', el).forEach(function (b) {
          b.onclick = function () {
            q.stueck = k[Number(b.getAttribute('data-i'))];
            UI.$$('#q-stueck button', el).forEach(function (o) { o.setAttribute('aria-pressed', String(o === b)); });
            trofej();
          };
        });
      }
      UI.$$('.species-btn', el).forEach(function (b) {
        b.onclick = function () {
          q.species = b.getAttribute('data-sp'); q.stueck = null;
          UI.$$('.species-btn', el).forEach(function (o) { o.setAttribute('aria-pressed', String(o === b)); });
          zeichneStueck(); trofej();
        };
      });
      UI.$$('#q-staende button', el).forEach(function (b) {
        b.onclick = function () {
          var neu = stands.filter(function (x) { return x.id === b.getAttribute('data-st'); })[0];
          q.stand = q.stand === neu ? null : neu;
          UI.$$('#q-staende button', el).forEach(function (o) { o.setAttribute('aria-pressed', String(!!q.stand && o === b)); });
          q.lovac = ''; q.auswahl = false;
          if (q.stand && Number(q.stand.lat) && reviere.length > 1) Geo.lovisteAt(q.stand.lat, q.stand.lon).then(function (r) { if (reviere.indexOf(r) !== -1) setzeRevier(r); });
          zeigeSchuetze();
        };
      });
      function setzeRevier(x) {
        q.revier = x || '';
        UI.$$('#q-rev button', el).forEach(function (o) { o.setAttribute('aria-pressed', String(o.getAttribute('data-rev') === q.revier)); });
      }
      UI.$$('#q-rev button', el).forEach(function (b) { b.onclick = function () { setzeRevier(b.getAttribute('data-rev')); }; });
      zeichneStueck();
      zeigeSchuetze();
      el.querySelector('#q-form').addEventListener('submit', async function (ev) {
        ev.preventDefault();
        var err = el.querySelector('#q-err'); err.hidden = true;
        function fail(m) { err.textContent = m; err.hidden = false; }
        var v = function (id) { var x = el.querySelector('#' + id); return x ? x.value.trim() : ''; };
        var lovac = q.lovac || (q.stand && q.stand.strijelac) || '';
        if (!q.stueck) return fail(t('errRequired'));
        var data = { vrsta: q.species, spol: q.stueck.spol, dobnaKlasa: q.stueck.klasa, klaseV: 2, tezina: v('q-kg'), brojMarkice: '', lovac: lovac,
          napomena: v('q-nap'), lokacija: reviere.length > 1 ? (q.revier || '') : (reviere[0] || ''), datum: String(l.datum).slice(0, 10), nacinLova: 'Prigon/pogon', lovId: l.id,
          stajaliste: q.stand ? q.stand.id : '', lat: '', lon: '', zona: '', vrijemeOdstrjela: '' };
        if (!data.tezina || !data.lovac) return fail(t('errRequired'));
        if (!data.lokacija) return fail(t('errLovRevierStueck'));
        if (!(Number(data.tezina) > 0)) return fail(t('errTezina'));
        if (q.trofej === 'vrhovi') {
          var n = Number(v('rog-vrhovi'));
          if (!(n >= 2 && n <= 30) || Math.round(n) !== n) return fail(t('errVrhovi'));
          data.rogovlje = String(n);
        } else if (q.trofej === 'lopata') {
          var lp = el.querySelector('input[name=lopata]:checked');
          if (!lp) return fail(t('errLopata'));
          data.rogovlje = lp.value;
        }
        if (q.stand && Number(q.stand.lat)) { data.lat = q.stand.lat; data.lon = q.stand.lon; data.zona = await Geo.ortLabel(q.stand.lat, q.stand.lon) || ''; }
        data.id = Store.uuid();
        await Store.queueSubmit(data);
        await Store.queueUpsert('wildbret', { id: data.id, hladnjacaOd: UI.nowLocalISO() }); // jedes Stück in die Kühlzelle
        App.syncNow({ quiet: true });
        UI.haptic && UI.haptic();
        q.n++;
        UI.toast(kategorija(data.vrsta, data.spol, data.dobnaKlasa, I18n.lang()) + ' · ' + data.tezina + ' kg — ' + t('saved'));
        // Für das nächste Stück leeren; Wildart bleibt
        el.querySelector('#q-kg').value = ''; el.querySelector('#q-nap').value = '';
        q.stueck = null; q.stand = null; q.lovac = ''; q.trofej = null; setzeRevier(''); el.querySelector('#q-trofej').innerHTML = '';
        UI.$$('#q-staende button', el).forEach(function (o) { o.setAttribute('aria-pressed', 'false'); });
        q.auswahl = false;
        zeichneStueck(); zeigeSchuetze();
        el.querySelector('#q-n').textContent = t('lovQuickN', { n: q.n });
        el.scrollTop = 0;
      });
    }, { noFocus: true });
  }

  /**
   * Stand-Blatt (aus der Liste der Jagd und von der Karte): wer steht hier — Teilnehmer und Gäste des Tages als Knöpfe,
   * sonst freier Name —, darunter die Stücke, die von diesem Stand gemeldet wurden. Nur die Verwaltung darf zuweisen.
   */
  function openStandSheet(lovId, standId, opts) {
    opts = opts || {};
    var l = lovById(lovId); if (!l) return;
    var st = staendeOf(l).filter(function (x) { return x.id === standId; })[0]; if (!st) return;
    var up = App.isUprava(), datum = String(l.datum).slice(0, 10);
    var strecke = streckeOf(l.id).filter(function (r) { return r.stajaliste === st.id; });
    var gaeste = up ? Store.gosti().filter(function (g) { return !g.deleted && String(g.od || '').slice(0, 10) <= datum && String(g.do || g.od || '').slice(0, 10) >= datum; }) : [];
    var namen = String(l.sudionici || '').split(/\n|,/).map(function (x) { return x.trim(); }).filter(Boolean);
    if (l.vodja && namen.indexOf(l.vodja) === -1) namen.unshift(l.vodja);
    var wahl = { name: st.strijelac || '', gostId: st.gostId || '' };
    if (wahl.name && !wahl.gostId && namen.indexOf(wahl.name) === -1) namen.push(wahl.name);
    if (wahl.gostId && !gaeste.some(function (g) { return g.id === wahl.gostId; })) {
      var g0 = Store.gosti().filter(function (g) { return g.id === wahl.gostId; })[0];
      if (g0) gaeste.unshift(g0);
    }
    var html = '<div class="eyebrow-sm">' + esc(l.naziv || t('lovDefaultName')) + '</div><h2>' + esc(t('standN', { n: st.nr })) + '</h2>' +
      (up ? '<div class="field-label">' + esc(t('standWho')) + '</div><div class="stand-wahl" id="st-wahl">' +
        gaeste.map(function (g) { return '<button type="button" data-g="' + esc(g.id) + '" data-n="' + esc(g.ime) + '">' + esc(g.ime) + ' · ' + esc(t('guestTag')) + '</button>'; }).join('') +
        namen.map(function (n) { return '<button type="button" data-n="' + esc(n) + '">' + esc(n) + '</button>'; }).join('') +
        '<button type="button" class="frei" data-n="">' + esc(t('standFree')) + '</button></div>' +
        '<div class="field" style="margin-top:12px"><input type="text" id="st-name" placeholder="' + esc(t('phName')) + '" value=""></div>' +
        (gaeste.length ? '<p class="hint">' + esc(t('standGuestHint')) + '</p>' : '')
        : '<p style="margin:0 0 6px"><b>' + esc(st.strijelac || t('standFree')) + '</b></p>') +
      '<div class="section-title" style="margin-top:18px"><h2>' + esc(t('standStrecke')) + '</h2></div>' +
      (strecke.length ? '<div class="panel flush"><ul class="list">' + strecke.map(Strecke.rowHtml).join('') + '</ul></div>'
        : '<p class="hint" style="margin:0">' + esc(t('standNoPieces')) + '</p>') +
      '<div class="btn-row" style="margin-top:16px">' +
      (up ? '<button type="button" class="btn primary" id="st-save">' + esc(t('btnSave')) + '</button>' : '') +
      (opts.karte ? '' : '<a class="btn" href="#/lovkarta/' + encodeURIComponent(l.id) + '">' + ICONS.map + esc(t('onMap')) + '</a>') +
      '</div>' +
      (up ? '<button type="button" class="btn ghost block small" id="st-del" style="margin-top:10px;color:var(--warn)">' + ICONS.trash + esc(t('standDelete')) + '</button>' : '');
    UI.openSheet(html, function (el, api) {
      UI.$$('.row[data-id]', el).forEach(function (b) { b.onclick = function () { api.close(); setTimeout(function () { Strecke.openDetail(b.getAttribute('data-id')); }, 260); }; });
      if (!up) return;
      function markiere() {
        UI.$$('#st-wahl button', el).forEach(function (b) {
          b.setAttribute('aria-pressed', String((b.getAttribute('data-g') || '') === wahl.gostId && b.getAttribute('data-n') === wahl.name));
        });
      }
      UI.$$('#st-wahl button', el).forEach(function (b) {
        b.onclick = function () { wahl = { name: b.getAttribute('data-n'), gostId: b.getAttribute('data-g') || '' }; el.querySelector('#st-name').value = ''; markiere(); };
      });
      el.querySelector('#st-name').oninput = function () { wahl = { name: this.value.trim(), gostId: '' }; markiere(); };
      markiere();
      async function speichere(liste) {
        await Store.queueUpsert('lov', { id: l.id, staende: liste });
        App.syncNow({ quiet: true });
      }
      el.querySelector('#st-save').onclick = async function () {
        var akt = lovById(lovId);
        api.close();
        await speichere(staendeOf(akt).map(function (x) { return x.id === standId ? Object.assign({}, x, { strijelac: wahl.name, gostId: wahl.gostId }) : x; }));
      };
      el.querySelector('#st-del').onclick = async function () {
        var akt = lovById(lovId);
        api.close();
        await speichere(staendeOf(akt).filter(function (x) { return x.id !== standId; }));
      };
    }, { noFocus: true });
  }
  window.LovStand = { open: openStandSheet };

  function openForm(l) {
    var lovci = Store.lovci();
    var html = '<h2>' + esc(l ? t('editLov') : t('newLov')) + '</h2><form id="lov-form" novalidate>' +
      '<div class="grid-2"><div class="field"><label class="field-label req" for="lov-datum">' + esc(t('lblDatum')) + '</label><input type="date" id="lov-datum" value="' + esc(l ? String(l.datum).slice(0, 10) : '') + '"></div>' +
      '</div>' +
      '<div class="field"><span class="field-label req">' + esc(t('lovReviere')) + '</span><div class="stand-wahl" id="lov-rev">' +
      Store.lovista().map(function (x, i) { var an = l ? revOf(l).indexOf(x) !== -1 : i === 0; return '<button type="button" data-rev="' + esc(x) + '" aria-pressed="' + an + '">' + esc(Strecke.shortLov(x)) + '</button>'; }).join('') + '</div></div>' +
      '<div class="field"><label class="field-label" for="lov-naziv">' + esc(t('lblLovNaziv')) + '</label><input type="text" id="lov-naziv" value="' + esc(l ? l.naziv : '') + '" placeholder="' + esc(t('phLovNaziv')) + '"></div>' +
      '<div class="field"><label class="field-label" for="lov-vodja">' + esc(t('lblVodja')) + '</label><input type="text" id="lov-vodja" list="lov-lovci" value="' + esc(l ? l.vodja : '') + '"><datalist id="lov-lovci">' + lovci.map(function (n) { return '<option value="' + esc(n) + '">'; }).join('') + '</datalist></div>' +
      '<div class="field"><label class="field-label" for="lov-sud">' + esc(t('participants')) + '</label><textarea id="lov-sud" placeholder="' + esc(t('phParticipants')) + '">' + esc(l ? l.sudionici : '') + '</textarea></div>' +
      '<div class="field"><label class="field-label" for="lov-sast">' + esc(t('gMeeting')) + '</label><input type="text" id="lov-sast" value="' + esc(l ? l.sastanak : '') + '" placeholder="' + esc(t('phMeeting')) + '"><p class="hint">' + esc(t('meetFormHint')) + '</p></div>' +
      '<div class="field"><label class="field-label" for="lov-gnap">' + esc(t('lblNapomenaGost')) + '</label><textarea id="lov-gnap" placeholder="' + esc(t('phNapomenaGost')) + '">' + esc(l ? l.napomenaGost : '') + '</textarea></div>' +
      '<div class="field"><label class="field-label" for="lov-nap">' + esc(t('lblNapomenaIntern')) + '</label><textarea id="lov-nap">' + esc(l ? l.napomena : '') + '</textarea></div>' +
      '<div class="error-msg" id="lov-err" hidden></div>' +
      '<button type="submit" class="btn primary block">' + esc(t('btnSave')) + '</button></form>';
    UI.openSheet(html, function (el, api) {
      UI.$$('#lov-rev button', el).forEach(function (b) {
        b.onclick = function () { b.setAttribute('aria-pressed', String(b.getAttribute('aria-pressed') !== 'true')); };
      });
      el.querySelector('#lov-form').addEventListener('submit', async function (ev) {
        ev.preventDefault();
        var er = el.querySelector('#lov-err');
        var datum = el.querySelector('#lov-datum').value;
        if (!datum) { er.textContent = t('errLovDatum'); er.hidden = false; return; }
        var reviere = UI.$$('#lov-rev button[aria-pressed="true"]', el).map(function (b) { return b.getAttribute('data-rev'); });
        if (!reviere.length) { er.textContent = t('errLovRevier'); er.hidden = false; return; }
        var rec = { id: l ? l.id : Store.uuid(), datum: datum, lokacija: reviere.join(', '),
          naziv: el.querySelector('#lov-naziv').value.trim(), vodja: el.querySelector('#lov-vodja').value.trim(),
          sudionici: el.querySelector('#lov-sud').value.trim(), napomena: el.querySelector('#lov-nap').value.trim(),
          sastanak: el.querySelector('#lov-sast').value.trim(), napomenaGost: el.querySelector('#lov-gnap').value.trim() };
        await Store.queueUpsert('lov', rec);
        api.close();
        App.syncNow({ quiet: true });
        App.go('#/lov/' + rec.id);
      });
    });
  }
})();
