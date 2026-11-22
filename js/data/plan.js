/**
 * Abschussplan je Lovište aus der LGO Gornja Motičina XIV-191 (30_LGO/, Tabellen LGO-3 „planirani lov“). Alle drei LGOs
 * sind inhaltlich gleich (CLAUDE.md) → Gesamtbetrieb = × 3, kein Flächenfaktor.
 * Deckt sich mit Code.gs::PLAN_LGO (Tab Plan-Izvršenje) und QUOTA_PER_LOVISTE.
 *
 * Fünf Altersklassen wie in der LGO (Abschnitt 3.2.x.1 „Dobni razredi“), gezählt nach Lebensjahr (lovna godina):
 *   Sheet-Wert      LGO          Rotwild  Dam-/Rehwild  Schwarzwild
 *   Tele/prase      mladunčad    1        1             1   (Kalb · Kitz · Frischling)
 *   Pomladak        pomladak     2        2             2   (Schmalspießer/Schmaltier · Jährling/Schmalreh · Überläufer)
 *   Mlađa klasa     mladi        3–4      3–4           3
 *   Srednja klasa   srednji      5–7      5–6           4–5
 *   Zrela klasa     zreli        8+       7+            6+
 * Bis Oktober 2026 hieß der Jährlings-Knopf „Mlađa klasa“; Code.gs stellt solche Altdaten einmalig auf „Pomladak“ um.
 * `m`/`z` = Soll männlich/weiblich, wo die LGO sie festlegt (Damkälber wechseln jährlich 2/1 ↔ 1/2 → nur Summe).
 * Mehrere `klase` in einer Zeile = die LGO wechselt jährlich zwischen diesen Klassen (Schwarzwild jung/mittel) → gemeinsames Soll.
 */
var KLASE_SVE = ['Tele/prase', 'Pomladak', 'Mlađa klasa', 'Srednja klasa', 'Zrela klasa'];
var PLAN = {
  'Jelen obični': [
    { klase: ['Tele/prase'], soll: 2, m: 1, z: 1 },
    { klase: ['Pomladak'], soll: 0, m: 0, z: 0 },
    { klase: ['Mlađa klasa'], soll: 2, m: 1, z: 1 },
    { klase: ['Srednja klasa'], soll: 2, m: 1, z: 1 },
    { klase: ['Zrela klasa'], soll: 2, m: 1, z: 1 }
  ],
  'Srna': [
    { klase: ['Tele/prase'], soll: 0, m: 0, z: 0 },
    { klase: ['Pomladak'], soll: 0, m: 0, z: 0 },
    { klase: ['Mlađa klasa'], soll: 2, m: 1, z: 1 },
    { klase: ['Srednja klasa'], soll: 0, m: 0, z: 0 },
    { klase: ['Zrela klasa'], soll: 2, m: 1, z: 1 }
  ],
  'Divlja svinja': [
    { klase: ['Tele/prase'], soll: 23, m: 11, z: 12 },
    { klase: ['Pomladak'], soll: 3, m: 2, z: 1 },
    // LGO: 2 Stück aus Jung- ODER Mittelklasse, jährlich wechselnd → eine gemeinsame Zeile
    { klase: ['Mlađa klasa', 'Srednja klasa'], soll: 2, m: 1, z: 1 },
    { klase: ['Zrela klasa'], soll: 2, m: 1, z: 1 }
  ],
  'Jelen lopatar': [
    { klase: ['Tele/prase'], soll: 3 },
    { klase: ['Pomladak'], soll: 0, m: 0, z: 0 },
    { klase: ['Mlađa klasa'], soll: 2, m: 1, z: 1 },
    { klase: ['Srednja klasa'], soll: 2, m: 1, z: 1 },
    { klase: ['Zrela klasa'], soll: 2, m: 1, z: 1 }
  ]
};
var PLAN_SPECIES = ['Divlja svinja', 'Jelen obični', 'Jelen lopatar', 'Srna'];

/** Lebensjahre der Klassen mladi · srednji · zreli je Wildart (LGO 3.2.x.1); [von, bis], bis = null → „und älter“. */
var KLASE_GODINE = {
  'Jelen obični': [[3, 4], [5, 7], [8, null]],
  'Jelen lopatar': [[3, 4], [5, 6], [7, null]],
  'Srna': [[3, 4], [5, 6], [7, null]],
  'Divlja svinja': [[3, 3], [4, 5], [6, null]]
};

/**
 * Jägersprachliche Bezeichnung aus Wildart + Geschlecht + Altersklasse: [HR, EN, DE].
 * HR = Text im Sheet (Tab Kategorije, Spalte P in Unos — Code.gs::KATEGORIJE_HR muss gleich lauten).
 * Weibliches Wild ab dem 3. Lebensjahr hat in allen drei Sprachen nur einen Namen (košuta · hind · Alttier usw.).
 */
var KATEGORIJA = (function () {
  function k(m, z) { return { m: m, z: z }; }
  function stariji(m3, m5, m8, z) {
    return { 'Mlađa klasa': k(m3, z), 'Srednja klasa': k(m5, z), 'Zrela klasa': k(m8, z) };
  }
  function art(tele, pomladak, starije) { return Object.assign({ 'Tele/prase': tele, 'Pomladak': pomladak }, starije); }
  return {
    'Jelen obični': art(
      k(['muško tele', 'stag calf', 'Hirschkalb'], ['žensko tele', 'hind calf', 'Wildkalb']),
      k(['šilaš', 'yearling stag', 'Schmalspießer'], ['junica', 'yearling hind', 'Schmaltier']),
      stariji(['mladi jelen', 'young stag', 'junger Hirsch'], ['srednji jelen', 'middle-aged stag', 'mittelalter Hirsch'],
        ['zreli jelen', 'mature stag', 'reifer Hirsch'], ['košuta', 'hind', 'Alttier'])),
    'Jelen lopatar': art(
      k(['muško tele', 'buck fawn', 'Hirschkalb'], ['žensko tele', 'doe fawn', 'Wildkalb']),
      k(['šilaš', 'pricket', 'Spießer'], ['junica', 'yearling doe', 'Schmaltier']),
      stariji(['mladi jelen lopatar', 'young buck', 'junger Damhirsch'], ['srednji jelen lopatar', 'middle-aged buck', 'mittelalter Damhirsch'],
        ['zreli jelen lopatar', 'mature buck', 'reifer Damhirsch'], ['košuta', 'doe', 'Alttier'])),
    'Srna': art(
      k(['muško lane', 'buck kid', 'Bockkitz'], ['žensko lane', 'doe kid', 'Rickenkitz']),
      k(['jednogodišnji srnjak', 'yearling buck', 'Jährling'], ['jednogodišnja srna', 'yearling doe', 'Schmalreh']),
      stariji(['mladi srnjak', 'young buck', 'junger Bock'], ['srednji srnjak', 'middle-aged buck', 'mittelalter Bock'],
        ['zreli srnjak', 'mature buck', 'reifer Bock'], ['srna', 'doe', 'Ricke'])),
    'Divlja svinja': art(
      k(['muško prase', 'male piglet', 'Frischlingskeiler'], ['žensko prase', 'female piglet', 'Frischlingsbache']),
      k(['nazimac', 'yearling boar', 'Überläuferkeiler'], ['nazimica', 'yearling sow', 'Überläuferbache']),
      stariji(['mladi vepar', 'young boar', 'junger Keiler'], ['srednji vepar', 'middle-aged boar', 'mittelalter Keiler'],
        ['zreli vepar', 'mature boar', 'reifer Keiler'], ['krmača', 'sow', 'Bache'])),
    // Muffelwild hat in der LGO keinen Plan; „Starije“ wird ohne Unterklasse als Zrela klasa gespeichert
    'Muflon': art(
      k(['muško janje', 'ram lamb', 'Widderlamm'], ['žensko janje', 'ewe lamb', 'Schaflamm']),
      k(['jednogodišnji muflon', 'yearling ram', 'Jährlingswidder'], ['jednogodišnja muflonka', 'yearling ewe', 'Schmalschaf']),
      stariji(['muflon', 'ram', 'Widder'], ['muflon', 'ram', 'Widder'], ['muflon', 'ram', 'Widder'], ['muflonka', 'ewe', 'Schaf']))
  };
})();
function kategorija(vrsta, spol, klasa, lang) {
  var li = { hr: 0, en: 1, de: 2 }[lang] || 0;
  var s = spol === 'ž' ? 'z' : 'm';
  var tab = KATEGORIJA[vrsta];
  if (!tab) return vrsta;
  var entry = (klasa && tab[klasa]) || tab['Zrela klasa'];
  return entry && entry[s] ? entry[s][li] : vrsta;
}
