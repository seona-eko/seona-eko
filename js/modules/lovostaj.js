/**
 * Lovostaj — „Was darf ich heute jagen?": oben die heute offenen Kategorien, darunter das Jahresband
 * April → März (Jagdjahr). Daten: js/data/lovostaj.js (Pravilnik o lovostaju, NN 94/2019).
 */
(function () {
  var esc = UI.esc, t = I18n.t;
  var MONTHS = [3, 4, 5, 6, 7, 8, 9, 10, 11, 0, 1, 2]; // April … März
  var openGroups = {};
  try { openGroups = JSON.parse(localStorage.getItem('seona_lovostaj_open') || '{}'); } catch (e) {}

  function changeText(row, today) {
    var c = Lovostaj.nextChange(row, today);
    if (!c) return t('allYear');
    // öffnet: erster offener Tag · schließt: letzter offener Tag (der Tag vor Beginn der Schonzeit)
    var d = UI.fmtDate(c.opens ? c.date : Lovostaj.addDays(c.date, -1), { day: 'numeric', month: 'numeric' });
    return c.opens ? t('opensOn', { d: d, n: c.days }) : t('closesIn', { d: d, n: c.days - 1 });
  }

  App.route('lovostaj', {
    nav: 'vise',
    render: function () {
      var today = UI.todayISO();
      var jj = Store.jagdjahr();
      var dayIdx = Math.round((UI.parseISO(today) - UI.parseISO(jj.start)) / 864e5);
      var todayPos = Math.max(0, Math.min(1, dayIdx / 365));
      var all = [];
      LOVOSTAJ.groups.forEach(function (g) { g.rows.forEach(function (r) { all.push({ g: g, r: r, open: Lovostaj.isOpen(r, today) }); }); });
      var openN = all.filter(function (x) { return x.open && x.g.vrsta !== 'Ostalo'; }).length;
      var ordered = all.filter(function (x) { return x.g.vrsta !== 'Ostalo'; }).sort(function (a, b) { return (b.open - a.open); });

      var monthHead = '<div class="band-head"><span></span><div class="band-months">' + MONTHS.map(function (m) {
        return '<span>' + esc(new Date(2026, m, 1).toLocaleDateString(I18n.locale(), { month: 'narrow' })) + '</span>';
      }).join('') + '</div></div>';

      var bands = LOVOSTAJ.groups.map(function (g) {
        var isOpen = openGroups[g.key] !== false && (openGroups[g.key] || g.vrsta !== 'Ostalo');
        return '<button type="button" class="band-group" data-g="' + g.key + '" aria-expanded="' + !!isOpen + '">' +
          (ICONS.forSpecies(g.vrsta)).replace('<svg', '<svg style="width:22px;height:22px;color:var(--bark);transform:none"') + '<b>' + esc(t(g.key)) + '</b>' + ICONS.chevron + '</button>' +
          (isOpen ? '<div class="band">' + monthHead + g.rows.map(function (r) {
            var segs = Lovostaj.segments(r, jj.start);
            return '<div class="band-row"><span class="b-name">' + esc(t(r.key)) + '<small>' + esc(changeText(r, today)) + '</small></span>' +
              '<div class="band-track" role="img" aria-label="' + esc(t(r.key) + ': ' + changeText(r, today)) + '">' +
              segs.map(function (s) { return '<span class="' + (r.note ? 'seg-note' : 'seg-open') + '" style="left:' + (s[0] * 100).toFixed(2) + '%;width:' + ((s[1] - s[0]) * 100).toFixed(2) + '%"></span>'; }).join('') +
              '<span class="today" style="left:' + (todayPos * 100).toFixed(2) + '%"></span></div></div>' +
              (r.note ? '<p class="hint" style="margin:-2px 0 6px 128px">' + esc(t(r.note)) + '</p>' : '');
          }).join('') + '</div>' : '');
      }).join('');

      return UI.back('#/vise', t('navVise')) + '<div class="page-head"><div class="eyebrow">' + esc(UI.fmtLong(new Date())) + '</div>' +
        '<h1>' + esc(t('lovostajTitle', { n: openN })) + '</h1></div>' +
        '<div class="panel flush open-list"><ul class="list">' + ordered.map(function (x) {
          return '<li><div class="row' + (x.open ? '' : ' closed') + '"><span class="r-icon">' + ICONS.forSpecies(x.g.vrsta) + '</span>' +
            '<span class="r-main"><span class="r-title">' + esc(t(x.r.key)) + '</span><span class="r-sub">' + esc(t(x.g.key)) + (x.r.note ? ' · ' + esc(t('withLimits')) : '') + '</span></span>' +
            // „offen“ steht schon in der Überschrift — Kennzeichen nur noch bei Schonzeit
            '<span class="r-end">' + (x.open ? '' : '<span class="badge muted">' + esc(t('closed')) + '</span>') + '<span style="display:block;margin-top:4px">' + esc(changeText(x.r, today)) + '</span></span></div></li>';
        }).join('') + '</ul></div>' +
        '<div class="section-title"><h2>' + esc(t('yearBand')) + '</h2><span class="hint">' + esc(t('huntYear')) + ' ' + esc(jj.label) + '</span></div>' +
        '<div class="panel">' + bands +
        '<div class="legend-line"><span><i style="background:var(--ok)"></i>' + esc(t('open')) + '</span><span><i style="background:repeating-linear-gradient(135deg,var(--ok) 0 5px,var(--ok-soft) 5px 9px)"></i>' + esc(t('withLimits')) + '</span>' +
        '<span><i style="background:var(--accent);width:3px"></i>' + esc(t('today')) + '</span></div></div>' +
        '<p class="source">' + esc(t('lovostajSource', { izvor: LOVOSTAJ.izvor, stanje: UI.fmtDate(LOVOSTAJ.stanje) })) + '</p>' +
        '<p class="source">' + esc(t('lovostajNote')) + '</p>';
    },
    mount: function (el) {
      UI.$$('.band-group', el).forEach(function (b) {
        b.onclick = function () {
          var k = b.getAttribute('data-g');
          openGroups[k] = b.getAttribute('aria-expanded') !== 'true';
          try { localStorage.setItem('seona_lovostaj_open', JSON.stringify(openGroups)); } catch (e) {}
          App.render(true);
        };
      });
    }
  });
})();
