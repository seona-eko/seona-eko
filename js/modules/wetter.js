/**
 * Wetter-Oberfläche: Kachel (Startseite Team + Gästeseite), Seite #/wetter mit 24-h-Band,
 * Sonnenzeiten als Symbole. Windpfeil zeigt, wohin der Wind weht; Text nennt, woher er kommt.
 */
var WetterUI = (function () {
  var esc = UI.esc, t = I18n.t;
  var CENTER = [45.452, 17.957];

  function sun(date) {
    var s = Geo.sunTimes(date || new Date(), CENTER[0], CENTER[1]);
    return '<span class="sunline" role="img" aria-label="' + esc(t('sunLine', { rise: UI.fmtTime(s.rise), set: UI.fmtTime(s.set) })) + '">' +
      '<span title="' + esc(t('sunrise')) + '">' + ICONS.sunrise + '<b class="num">' + UI.fmtTime(s.rise) + '</b></span>' +
      '<span title="' + esc(t('sunset')) + '">' + ICONS.sunset + '<b class="num">' + UI.fmtTime(s.set) + '</b></span></span>';
  }

  function arrow(deg, size) {
    return '<span class="wind-arrow" style="width:' + (size || 22) + 'px;height:' + (size || 22) + 'px;transform:rotate(' + Math.round(deg) + 'deg)">' + ICONS.windArrow + '</span>';
  }
  function windText(dir, speed, gust) {
    return t('windFrom', { d: Wetter.dirName(dir, I18n.lang()) }) + ' · ' + Math.round(speed) + ' km/h' + (gust ? ' (' + t('gusts') + ' ' + Math.round(gust) + ')' : '');
  }
  function moonLine(date) {
    var m = Wetter.moon(date || new Date());
    return '<span class="moonline" title="' + esc(t('moon_' + m.phase)) + '">' + ICONS.moon(m) + '<span>' + esc(t('moon_' + m.phase)) + ' · ' + m.illum + ' %</span></span>';
  }

  /** Kachel mit aktuellem Wetter. Lädt im Hintergrund nach, wenn der Stand älter als 30 min ist. */
  function tile() {
    var c = Wetter.current();
    if (!c) {
      return '<a class="panel weather-tile" href="#/wetter"><div class="w-main"><span class="w-icon">' + ICONS.wCloudy + '</span>' +
        (navigator.onLine ? UI.skel(1) : '<span class="hint">' + esc(t('weatherOffline')) + '</span>') + '</div>' + '<div class="w-sub">' + moonLine() + '</div></a>';
    }
    var k = Wetter.kind(c.weather_code);
    var old = Date.now() - Wetter.at() > 60 * 60 * 1000;
    return '<a class="panel weather-tile" href="#/wetter" aria-label="' + esc(t('weatherTitle')) + '">' +
      '<div class="w-main"><span class="w-icon">' + ICONS.weather[k] + '</span>' +
      '<span class="w-temp num">' + Math.round(c.temperature_2m) + '°</span>' +
      '<span class="w-desc"><b>' + esc(t('w_' + k)) + '</b><span>' + esc(t('feelsLike', { t: Math.round(c.apparent_temperature) })) + '</span></span>' +
      '<span class="w-wind">' + arrow(c.wind_direction_10m, 30) + '<span><b class="num">' + Math.round(c.wind_speed_10m) + '</b> km/h<br><small>' + esc(t('windFrom', { d: Wetter.dirName(c.wind_direction_10m, I18n.lang()) })) + '</small></span></span></div>' +
      '<div class="w-sub">' + moonLine() + '<span class="hint' + (old ? ' stale' : '') + '">' + esc(t('weatherAsOf') + ' ' + UI.fmtTime(new Date(Wetter.at()))) + '</span></div></a>';
  }

  App.route('wetter', {
    nav: 'vise', // erreichbar über Mehr (und die Wetterkachel); „Mehr“ leuchtet
    render: function () {
      var hrs = Wetter.hours(24);
      var today = new Date(), tomorrow = new Date(Date.now() + 864e5);
      var s1 = Geo.sunTimes(today, CENTER[0], CENTER[1]), s2 = Geo.sunTimes(tomorrow, CENTER[0], CENTER[1]);
      var suns = [s1.rise, s1.set, s2.rise, s2.set].filter(Boolean);
      function nearSun(d) { return suns.some(function (x) { return Math.abs(d - x) <= 90 * 60 * 1000; }); }
      return UI.back('#/vise', t('navVise')) + '<div class="page-head"><div class="eyebrow">' + esc(UI.fmtLong(today)) + '</div><h1>' + esc(t('weatherTitle')) + '</h1>' +
        '<p>' + sun(today) + '</p></div>' + tile() +
        '<div class="section-title"><h2>' + esc(t('next24h')) + '</h2><span class="hint">' + esc(t('huntHoursHint')) + '</span></div>' +
        (hrs.length ? '<div class="panel flush"><ul class="list hours">' + hrs.map(function (h) {
          var k = Wetter.kind(h.code), hl = nearSun(h.time);
          return '<li class="' + (hl ? 'hunt-hour' : '') + '"><div class="row">' +
            '<span class="h-time num">' + UI.fmtTime(h.time) + '</span>' +
            '<span class="h-icon" title="' + esc(t('w_' + k)) + '">' + ICONS.weather[k] + '</span>' +
            '<span class="h-temp num">' + Math.round(h.temp) + '°</span>' +
            '<span class="h-wind">' + arrow(h.dir, 20) + '<span>' + esc(Wetter.dirName(h.dir, I18n.lang())) + ' <b class="num">' + Math.round(h.wind) + '</b>' + (h.gust != null ? '<small class="num"> / ' + Math.round(h.gust) + '</small>' : '<small> km/h</small>') + '</span></span>' +
            '<span class="h-rain num">' + (h.mm ? String(Math.round(h.mm * 10) / 10).replace('.', I18n.lang() === 'en' ? '.' : ',') + ' mm' : '') + '</span></div></li>';
        }).join('') + '</ul></div>' : '<div class="panel">' + UI.emptyState('wCloudy', t('weatherNone'), t('weatherNoneText')) + '</div>') +
        '<p class="source">' + esc(t('weatherSource', { t: Wetter.at() ? UI.fmtStamp(Wetter.at()) : '—' })) + '</p>';
    },
    mount: function () { Wetter.refresh(); }
  });

  // Neue Wetterdaten: nur Seiten mit Wetteranzeige neu zeichnen, nie ein offenes Formular/Sheet wegreißen.
  Wetter.onChange(function () {
    var h = location.hash || '#/home';
    if (/^#\/(home|gost|wetter)(\?|$)/.test(h) && !document.querySelector('.sheet')) App.render(true);
  });

  return { sun: sun, tile: tile, arrow: arrow, windText: windText, moonLine: moonLine };
})();
