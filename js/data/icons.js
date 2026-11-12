/** Linien-Icons im Stil der Wildart-Icons der ersten Fassung (viewBox 48, stroke). */
var ICONS = (function () {
  function svg(inner, vb) {
    return '<svg viewBox="' + (vb || '0 0 48 48') + '" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' + inner + '</svg>';
  }
  var P = {
    antler: '<path d="M24 40 V21"/><path d="M24 21c-4 0-7-4-10-12"/><path d="M24 21c-7-2-12-8-16-14"/><path d="M24 21c4 0 7-4 10-12"/><path d="M24 21c7-2 12-8 16-14"/>',
    roe: '<path d="M24 40 V27"/><path d="M24 27c-2 0-4-4-5-10"/><path d="M24 27c2 0 4-4 5-10"/><path d="M19 19l-4-3"/><path d="M29 19l4-3"/>',
    boar: '<path d="M9 27c0-8 7-13 16-13s14 5 14 11c0 4-2 7-6 8.5"/><path d="M9 27c0 3 3 5 7 6.5"/><path d="M16 33.5V39"/><path d="M27 34V39"/><path d="M39 25c2-1 4-1 5 1"/><path d="M12 22l-5-2"/><circle cx="19" cy="21" r="1.4" fill="currentColor" stroke="none"/>',
    fallow: '<path d="M24 40 V22"/><path d="M24 22c-3-1-5-4-6-9"/><path d="M24 22c3-1 5-4 6-9"/><path d="M18 13c-2.5-1-4.5-.5-6 1.5"/><path d="M30 13c2.5-1 4.5-.5 6 1.5"/>',
    mouflon: '<path d="M24 40 V29"/><path d="M24 29c6 0 9-4 8-9-1-4-5-5-7-2 3 0 5 2 4 5-1 2-4 2-5-1 1 3-1 5-3 4-2-1-1-4 1-5"/>',
    paw: '<ellipse cx="24" cy="31" rx="9" ry="7"/><circle cx="13" cy="16" r="4"/><circle cx="24" cy="11" r="4"/><circle cx="35" cy="16" r="4"/>',
    home: '<path d="M8 22 24 9l16 13"/><path d="M12 19v20h24V19"/><path d="M20 39V28h8v11"/>',
    share: '<path d="M24 6v24"/><path d="M16 14l8-8 8 8"/><path d="M14 22h-4v20h28V22h-4"/>',
    map: '<path d="M6 12l12-4 12 4 12-4v28l-12 4-12-4-12 4z"/><path d="M18 8v28"/><path d="M30 12v28"/>',
    list: '<path d="M16 13h24"/><path d="M16 24h24"/><path d="M16 35h24"/><circle cx="9" cy="13" r="1.8"/><circle cx="9" cy="24" r="1.8"/><circle cx="9" cy="35" r="1.8"/>',
    group: '<circle cx="17" cy="17" r="5"/><circle cx="32" cy="19" r="4"/><path d="M7 38c0-6 4.5-10 10-10s10 4 10 10"/><path d="M27 29c1.5-1 3-1.5 5-1.5 4.5 0 8 3.5 8 9"/>',
    more: '<circle cx="12" cy="24" r="2.2"/><circle cx="24" cy="24" r="2.2"/><circle cx="36" cy="24" r="2.2"/>',
    plus: '<path d="M24 10v28"/><path d="M10 24h28"/>',
    locate: '<circle cx="24" cy="24" r="9"/><path d="M24 6v8"/><path d="M24 34v8"/><path d="M6 24h8"/><path d="M34 24h8"/><circle cx="24" cy="24" r="2" fill="currentColor"/>',
    layers: '<path d="M24 8 6 17l18 9 18-9z"/><path d="M6 25l18 9 18-9"/><path d="M6 33l18 9 18-9"/>',
    chevron: '<path d="M18 12l12 12-12 12"/>',
    back: '<path d="M30 12 18 24l12 12"/>',
    cold: '<path d="M24 6v36"/><path d="M8.4 15l31.2 18"/><path d="M8.4 33l31.2-18"/><path d="M19 9l5 4 5-4"/><path d="M19 39l5-4 5 4"/>',
    calendar: '<rect x="8" y="11" width="32" height="29" rx="3"/><path d="M8 19h32"/><path d="M16 7v8"/><path d="M32 7v8"/>',
    sun: '<circle cx="24" cy="26" r="7"/><path d="M24 11v4"/><path d="M11 26H7"/><path d="M41 26h-4"/><path d="M14.5 16.5l-2.8-2.8"/><path d="M33.5 16.5l2.8-2.8"/><path d="M6 38h36"/>',
    sync: '<path d="M38 20a14 14 0 0 0-26-4"/><path d="M10 28a14 14 0 0 0 26 4"/><path d="M12 8v8h8"/><path d="M36 40v-8h-8"/>',
    gear: '<circle cx="24" cy="24" r="6"/><path d="M24 6v6M24 36v6M6 24h6M36 24h6M11.3 11.3l4.2 4.2M32.5 32.5l4.2 4.2M11.3 36.7l4.2-4.2M32.5 15.5l4.2-4.2"/>',
    male: '<circle cx="20" cy="28" r="11"/><path d="M28 20 40 8"/><path d="M30 8h10v10"/>',
    female: '<circle cx="24" cy="18" r="11"/><path d="M24 29v13"/><path d="M18 36h12"/>',
    camera: '<rect x="7" y="15" width="34" height="23" rx="3"/><circle cx="24" cy="26.5" r="7"/><path d="M17 15l3-5h8l3 5"/>',
    pin: '<path d="M24 42s-12-12.5-12-21a12 12 0 0 1 24 0c0 8.5-12 21-12 21z"/><circle cx="24" cy="21" r="4"/>',
    check: '<circle cx="24" cy="24" r="18"/><path d="M16 25l5.5 5.5L32.5 19"/>',
    alert: '<path d="M24 7 4 41h40z"/><path d="M24 19v10"/><circle cx="24" cy="34.5" r="1.5" fill="currentColor"/>',
    edit: '<path d="M30 9l9 9-20 20H10v-9z"/><path d="M26 13l9 9"/>',
    trash: '<path d="M10 14h28"/><path d="M19 14V9h10v5"/><path d="M13 14l2 25h18l2-25"/>',
    move: '<path d="M24 6v36M6 24h36"/><path d="M18 12l6-6 6 6M18 36l6 6 6-6M12 18l-6 6 6 6M36 18l6 6-6 6"/>',
    photo: '<rect x="7" y="11" width="34" height="27" rx="3"/><circle cx="18" cy="21" r="3.5"/><path d="M7 33l10-9 8 7 6-5 10 8"/>',
    tree: '<path d="M24 42V30"/><path d="M24 6 12 22h6L10 32h28l-8-10h6z"/>',
    chat: '<path d="M8 40l3-8a16 16 0 1 1 6 5z"/><path d="M18 18c0 6 6 12 12 12l3-3-4-3-2 2c-2-1-4-3-5-5l2-2-3-4z"/>',
    phone: '<path d="M14 6l6 8-4 4c2 5 6 9 11 11l4-4 8 6-3 7c-15 0-28-13-28-28z"/>',
    sunrise: '<path d="M6 36h36"/><path d="M14 36a10 10 0 0 1 20 0"/><path d="M24 20V8"/><path d="M19 13l5-5 5 5"/><path d="M9.5 26.5l-3-2"/><path d="M38.5 26.5l3-2"/>',
    sunset: '<path d="M6 36h36"/><path d="M14 36a10 10 0 0 1 20 0"/><path d="M24 8v12"/><path d="M19 15l5 5 5-5"/><path d="M9.5 26.5l-3-2"/><path d="M38.5 26.5l3-2"/>',
    windArrow: '<path d="M24 6v36"/><path d="M14 32l10 10 10-10"/>',
    wClear: '<circle cx="24" cy="24" r="8"/><path d="M24 6v4M24 38v4M6 24h4M38 24h4M11.3 11.3l2.8 2.8M33.9 33.9l2.8 2.8M11.3 36.7l2.8-2.8M33.9 14.1l2.8-2.8"/>',
    wPartly: '<circle cx="18" cy="18" r="6"/><path d="M18 6v3M6 18h3M9.5 9.5l2 2M26.5 9.5l-2 2"/><path d="M16 38h20a7 7 0 0 0 0-14 10 10 0 0 0-19 3 5.5 5.5 0 0 0-1 11z"/>',
    wCloudy: '<path d="M13 36h23a8 8 0 0 0 0-16 11 11 0 0 0-21 3 6.5 6.5 0 0 0-2 13z"/>',
    wFog: '<path d="M8 18h32M6 26h36M10 34h28"/>',
    wRain: '<path d="M13 28h23a8 8 0 0 0 0-16 11 11 0 0 0-21 3 6.5 6.5 0 0 0-2 13z"/><path d="M16 34l-2 5M24 34l-2 5M32 34l-2 5"/>',
    wSnow: '<path d="M13 28h23a8 8 0 0 0 0-16 11 11 0 0 0-21 3 6.5 6.5 0 0 0-2 13z"/><circle cx="16" cy="36" r="1.2" fill="currentColor"/><circle cx="24" cy="39" r="1.2" fill="currentColor"/><circle cx="32" cy="36" r="1.2" fill="currentColor"/>',
    wStorm: '<path d="M13 28h23a8 8 0 0 0 0-16 11 11 0 0 0-21 3 6.5 6.5 0 0 0-2 13z"/><path d="M25 30l-4 7h6l-4 7"/>',
    thermo: '<path d="M20 30V9a4 4 0 0 1 8 0v21a8 8 0 1 1-8 0z"/><path d="M24 33V18"/>',
    expand: '<path d="M8 18V8h10M30 8h10v10M40 30v10H30M18 40H8V30"/>',
    collapse: '<path d="M18 8v10H8M40 18H30V8M30 40V30h10M8 30h10v10"/>',
    close: '<path d="M12 12l24 24M36 12 12 36"/>',
    qr: '<rect x="7" y="7" width="12" height="12" rx="1"/><rect x="29" y="7" width="12" height="12" rx="1"/><rect x="7" y="29" width="12" height="12" rx="1"/><path d="M29 29h5v5h-5zM36 36h5v5h-5zM29 38v3M38 29h3"/>'
  };
  var I = {};
  Object.keys(P).forEach(function (k) { I[k] = svg(P[k]); });

  // Wildarten (Werte wie im Sheet, immer Kroatisch)
  I.species = {
    'Jelen obični': I.antler, 'Srna': I.roe, 'Divlja svinja': I.boar,
    'Jelen lopatar': I.fallow, 'Muflon': I.mouflon, 'Ostalo': I.paw
  };
  I.forSpecies = function (v) { return I.species[v] || I.paw; };
  I.weather = { clear: I.wClear, partly: I.wPartly, cloudy: I.wCloudy, fog: I.wFog, rain: I.wRain, snow: I.wSnow, storm: I.wStorm };
  /** Mond als gefüllte Scheibe mit Schattenanteil (0 = Neumond, 100 = Vollmond). */
  I.moon = function (m) {
    var f = m.illum / 100, r = 14, cx = 24;
    // Terminator als Ellipse: rx zwischen -r und r
    var rx = Math.abs(1 - 2 * f) * r, lit = m.waxing ? 1 : 0, sweepOuter = m.waxing ? 1 : 0, sweepInner = f > .5 ? (m.waxing ? 1 : 0) : (m.waxing ? 0 : 1);
    var d = 'M' + cx + ' ' + (24 - r) + ' A' + r + ' ' + r + ' 0 0 ' + sweepOuter + ' ' + cx + ' ' + (24 + r) + ' A' + rx.toFixed(2) + ' ' + r + ' 0 0 ' + sweepInner + ' ' + cx + ' ' + (24 - r) + 'z';
    return '<svg viewBox="0 0 48 48" aria-hidden="true"><circle cx="24" cy="24" r="14" fill="none" stroke="currentColor" stroke-width="2"/>' +
      (m.illum > 1 ? '<path d="' + d + '" fill="currentColor"/>' : '') + '</svg>';
  };

  // Reviereinrichtungen: Symbole aus der QField-Feldkarte (70_Karten/80_Fachlayer/_quellen/symbole_jagd)
  I.objekt = {
    kanzel: 'icons/objekti/hochsitz_kanzel.svg', leiter: 'icons/objekti/hochsitz_leiter.svg',
    drueckjagdbock: 'icons/objekti/drueckjagdbock.svg', bodensitz: 'icons/objekti/bodensitz.svg',
    kirrung: 'icons/objekti/kirrung.svg', salzlecke: 'icons/objekti/salzlecke.svg',
    suhle: 'icons/objekti/suhle.svg', fuetterung: 'icons/objekti/fuetterung.svg',
    schranke: 'icons/objekti/schranke.svg', kamera: 'icons/objekti/kamera.svg',
    zentrale: 'icons/objekti/zentrale.svg', jagdhuette: 'icons/objekti/jagdhuette.svg', biljeska: 'icons/objekti/biljeska.svg'
  };
  return I;
})();
