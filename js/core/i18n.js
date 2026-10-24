/**
 * Texte HR / EN / DE. Nur Anzeige — ins Sheet geschriebene Werte (Wildart, Klasse, Lovište …)
 * bleiben immer Kroatisch, sonst matchen die Formeln in Kategorije/Plan-Izvršenje nicht mehr.
 */
var I18n = (function () {
  var S = {
    hr: {
      brandSub: 'Revir', roleUprava: 'Tim',
      lblMjesto: 'Mjesto odstrjela', pickOnMap: 'Odaberi na karti', locHint: 'Na mjestu odstrjela: „Moja lokacija". Kasnije (npr. kod hladnjače): odaberite mjesto na karti.', locUnnamed: 'Mjesto odabrano', locChange: 'Promijeni', locClear: 'Ukloni', lblVrijeme: 'Vrijeme (nije obavezno)', moreDetailsTitle: 'Više podataka', pickHint: 'Pomaknite kartu tako da je križić na mjestu odstrjela.',
      fullscreen: 'Karta preko cijelog zaslona', fullscreenExit: 'Zatvori prikaz preko cijelog zaslona', showOriginal: 'Izvorni tekst',
      sunrise: 'Izlazak sunca', sunset: 'Zalazak sunca', windFrom: 'iz {d}', gusts: 'udari', moon_new: 'Mlađak', moon_waxCres: 'Mladi mjesec', moon_firstQ: 'Prva četvrt', moon_waxGib: 'Rastući mjesec', moon_full: 'Uštap', moon_wanGib: 'Opadajući mjesec', moon_lastQ: 'Zadnja četvrt', moon_wanCres: 'Stari mjesec', weatherOffline: 'Vrijeme se učitava kad ima interneta.', weatherTitle: 'Vrijeme i vjetar', w_clear: 'Vedro', w_partly: 'Djelomično oblačno', w_cloudy: 'Oblačno', w_fog: 'Magla', w_rain: 'Kiša', w_snow: 'Snijeg', w_storm: 'Grmljavina', feelsLike: 'osjećaj {t}°', weatherAsOf: 'Stanje', next24h: 'Sljedeća 24 sata', huntHoursHint: 'istaknuto: oko izlaska i zalaska sunca', weatherNone: 'Još nema prognoze', weatherNoneText: 'Prognoza se učitava čim ima interneta.', weatherSource: 'Izvor: MET Norway (api.met.no), licenca CC BY 4.0; sredina lovišta. Stanje: {t}. Strelica pokazuje kamo vjetar puše.', aspSentDays: 'poslano prije {n} d.', aspNotSent: 'nije poslano', next_sample: 'Upiši ASK uzorak', next_send: 'Uzorak poslan', next_result: 'Upiši nalaz', next_out: 'Izuzmi iz hladnjače', sampleNo: 'Uzorak', stepsLegend: 'Uskladišteno · uzorak · poslano · nalaz · izuzeto', outTitle: 'Izuzeto iz hladnjače', izlaz_kupac: 'Kupac', izlaz_vlastito: 'Vlastita potrošnja', izlaz_uklanjanje: 'Neškodljivo uklanjanje', aspGroup_noSample: 'Bez uzorka', aspGroup_notSent: 'Nije poslano', aspGroup_sent: 'Poslano — čeka nalaz', aspGroup_result: 'Nalaz stigao (30 dana)', selectAll: 'Označi sve', batch_notSent: 'Označi kao poslano ({n})', batch_sent: 'Upiši nalaz ({n})', aspGroupEmpty: 'Ništa.', aspFlowHint: 'Uzorak uzet → poslan → nalaz. Označite više uzoraka odjednom kada idu zajedno u laboratorij.', aspSummary: '{a} uzoraka nije poslano · {b} čeka nalaz', aspTileLine: '{a} nije poslano · {b} čeka nalaz', tabCold: 'U hladnjači', tabAsp: 'ASK uzorci', sentOn: 'Poslano dana', lab: 'Laboratorij / služba', phLab: 'npr. veterinarska stanica', savedN: 'Spremljeno ({n}).', resultHint: 'Svi su unaprijed „negativan" — promijenite pojedinačne ako treba.', resultOn: 'Nalaz od', outOnlyDisposal: 'Kod pozitivnog nalaza dopušteno je samo neškodljivo uklanjanje.', outNoResultTitle: 'Nema negativnog nalaza ASK', outNoResultText: 'Divlja svinja iz zone ograničenja smije izaći tek s negativnim nalazom. Nastavite samo ako je veterinarska služba drukčije odredila.', outConfirm: 'Potvrđujem da je izlaz dopušten', izlazKind: 'Vrsta izlaza', outOn: 'Datum izlaza', outConfirmNeeded: 'Potvrdite izlaz bez negativnog nalaza.', step_in: 'Uskladišteno', step_sample: 'ASK uzorak', step_send: 'Poslano', step_result: 'Nalaz', step_out: 'Izuzeto', editData: 'Uredi podatke', gToday: 'Danas', gPickup: 'Polazak', gSeat: 'Čeka', gReturn: 'Povratak oko', gGuide: 'Pratitelj', gWriteGuide: 'WhatsApp — {n}', gWelcomeName: 'Dobrodošli, {n}', gYourAnsitz: 'Vaš lov danas', gNextAnsitz: 'Sljedeći lov', gMoreAnsitz: 'Daljnji termini', gSeasonToday: 'Danas u sezoni lova', gSeasonHint: 'Što smijete loviti, dogovorit ćete s pratiteljem.', gAnsitzRules: 'Na čeki', gA1: 'Prije penjanja provjerite ljestve i čeku.', gA2: 'Pri penjanju i silasku oružje je prazno.', gA3: 'Pucajte samo uz siguran zaustavljač metka — nikad prema horizontu.', gA4: 'Pucajte samo na sigurno prepoznatu divljač, kako je dogovoreno s pratiteljem.', gA5: 'Nakon pucnja ostanite na čeki i javite se pratitelju; ne tražite divljač sami.', gA6: 'Ostanite na čeki do dolaska pratitelja. Mobitel utišan, ali dostupan.', gAnsitzNote: 'Opći savjeti — mjerodavne su upute pratitelja.', gLegalAnsitz: 'Seona Eko — informacije za goste. Lovostaj je informativan; o odstrjelu odlučuje pratitelj na terenu.', guestsTitle: 'Gosti i čeke', guestsSub: 'Gosti dobivaju QR kod i vide svoje termine.', newGuest: 'Novi gost', editGuest: 'Uredi gosta', guestsCurrent: 'Trenutni i nadolazeći', guestsPast: 'Raniji', guestsEmpty: 'Još nema gostiju', guestsEmptyText: 'Dodajte gosta — dobit će QR kod za svoj mobitel.', linkCopied: 'Poveznica kopirana.', guestLinkMsg: 'Dobrodošli, {n}! Aplikacija za lov:', confirmDeleteGuest: 'Obrisati gosta {n} i njegove termine?', qrTitle: 'QR kod za mobitel gosta', qrHint: 'Gost skenira kod kamerom — aplikacija se otvara već postavljena.', copyLink: 'Kopiraj poveznicu', sendWhatsApp: 'Pošalji WhatsAppom', ansitzTitle: 'Termini lova', newAnsitz: 'Novi termin', editAnsitz: 'Uredi termin', ansitzEmpty: 'Još nema termina.', guestName: 'Ime gosta', stayFrom: 'Boravak od', stayTo: 'do', errGuestName: 'Upišite ime gosta.', phReturn: 'npr. 21:00', phPickup: 'npr. 16:30 lovačka kuća', phSeat: 'npr. Čeka 12 — Strmac', seatHint: 'Gost vidi samo naziv, ne i položaj na karti.', phAnsitzNote: 'npr. topla odjeća, termos', guestsToday: 'Gosti danas', guestsViseSub: 'QR kod, termini lova',
      roleGost: 'Gost', roleGostHint: 'Gost: pregled, karta, kontakt — bez unosa.', navGost: 'Pregled', whatsapp: 'WhatsApp', call: 'Nazovi', noContacts: 'Kontakt još nije upisan.', emergency: 'Hitni slučaj', emergencySub: 'Hitna pomoć, policija, vatrogasci', gWelcome: 'Dobrodošli', gContact: 'Kontakt', gYourHunt: 'Vaš lov', gNextHunt: 'Sljedeći lov', gFreeToday: 'Što je danas dopušteno', gFreeN: 'slobodno: {n}', gPlanDone: 'plan ispunjen', opensShort: 'od {d}', gFreeHint: 'Prema lovostaju i planu odstrjela. Konačno odobrenje odstrjela daje voditelj lova ili pratitelj na terenu.', gPrasad: 'Prasad', gNazimad: 'Nazimad', gZrelaSvinja: 'Vepar / krmača', gLopatarOdrasli: 'Jelen lopatar i košuta', gSafety: 'Sigurnost u skupnom lovu', gSafetyOpen: 'Osnovna pravila (prikaži)', gS1: 'Oružje punite tek na stajalištu; pri napuštanju stajališta ispraznite ga.', gS2: 'Ne napuštajte stajalište prije znaka za kraj pogona.', gS3: 'Pucajte samo uz siguran zaustavljač metka — nikad u pogon, prema susjednim stajalištima, putovima ili kućama.', gS4: 'Pucajte samo u sektoru koji vam je odredio voditelj lova.', gS5: 'Nosite signalnu odjeću (narančasti prsluk ili kapa).', gS6: 'Pucajte samo na sigurno prepoznatu i odobrenu divljač — ako niste sigurni, ne pucajte.', gS7: 'Zapamtite mjesto nastrijela i javite ga; ne tražite ranjenu divljač sami — traženje organizira voditelj lova.', gSafetyNote: 'Opći savjeti — mjerodavan je sigurnosni brifing voditelja lova.', gHunts: 'Lovovi', gMeeting: 'Sastanak', gRoute: 'Navigacija', gLegal: 'Seona Eko — informacije za goste. Lovostaj i plan su informativni; odobrenje odstrjela i upute na terenu daje voditelj lova.', guestPreviewNote: 'Ovako gosti vide ovu stranicu.', contacts: 'Kontakti', contactsHint: 'Kontakte uređujete u tablici, list „Kontakti".', guestView: 'Prikaz za goste', guestViewSub: 'Kako gosti vide aplikaciju', meetPlaceHint: 'Pomaknite kartu tako da je križić na mjestu sastanka.', meetSaved: 'Mjesto sastanka spremljeno.', meetSet: 'Postavi na karti', meetNone: 'Mjesto sastanka nije upisano.', lblNapomenaGost: 'Napomena za goste', lblNapomenaIntern: 'Napomena (interno)', phMeeting: 'npr. 7:30, lovačka kuća Klanac', meetFormHint: 'Gosti vide sastanak i napomenu za goste — ne vide interne napomene, stajališta ni sudionike.', phNapomenaGost: 'npr. ponesite narančasti prsluk; doručak nakon lova',
      navHome: 'Početna', navKarta: 'Karta', navOdstrjel: 'Odstrjel', navLovovi: 'Lov', navVise: 'Više', tabGuests: 'Gosti', nextGuest: 'Sljedeći gost',
      pillSynced: 'Sinkronizirano', pillPending: '{n} čeka slanje', pillSending: 'Slanje…', pillOffline: 'Bez interneta', pillErrors: '{n} greška', pillCode: 'Provjerite kod',
      cancel: 'Odustani', close: 'Zatvori', btnSave: 'Spremi', btnSaveChanges: 'Spremi izmjene', btnSaveOdstrjel: 'Spremi odstrjel', btnAnother: 'Još jedan unos', btnDone: 'Gotovo', btnUpdate: 'Osvježi',
      edit: 'Uredi', delete: 'Obriši', discard: 'Odbaci', back: 'Natrag', details: 'Detalji', all: 'Sve', loading: 'Učitavanje…', checking: 'Provjera…', notFound: 'Nije pronađeno',
      today: 'danas', open: 'otvoreno', closed: 'lovostaj', years: 'god.', daysShort: 'dana', pieces: ' kom.',
      setupText: 'Skenirajte svoj QR kod ili upišite kod.',
      lblLang: 'Jezik', lblCode: 'Kod revira', lblDevice: 'Vaše ime / uređaj', phDevice: 'npr. Marko – Samsung', phCodeKeep: 'prazno = zadrži postojeći kod',
      errCodeEmpty: 'Upišite kod.', errCodeWrong: 'Kod nije ispravan.', setupOffline: 'Nema interneta — kod će se provjeriti pri prvom slanju.',
      updateText: 'Dostupna je nova verzija aplikacije.', updateCheck: 'Provjeri ažuriranje', updateLoading: 'Nova verzija se učitava…', updateNone: 'Aplikacija je ažurna.',
      huntYear: 'Lovna godina', homeTitle: 'Danas u reviru', sunLine: 'Izlazak {rise} · zalazak {set}',
      homeErrors: '{n} unos(a) nije prihvaćeno', homeErrorsHint: 'Pogledajte razlog i ispravite ili odbacite.',
      newOdstrjel: 'Novi odstrjel', newOdstrjelSub: 'radi i bez interneta', quickObjekt: 'Objekt na karti', quickLovostaj: 'Lovostaj',
      tileStrecke: 'Odstrjel', tileStreckeSub: 'od plana (sva tri lovišta)', tileCold: 'Hladnjača', tileColdSub: 'komada u hladnjači',
      openToday: 'Danas otvoreno', allSeasons: 'Cijela godina', nothingOpen: 'Danas je za krupnu divljač svugdje lovostaj.',
      openTodayHint: 'Divlja svinja bez lovostaja osim visoko bređe ženke ili ženke s mladima. Vrijedi samo do broja iz lovnogospodarske osnove.',
      planTitle: 'Plan odstrjela', planPrasad: 'Prasad', planKrmace: 'Krmače i nazimice', femaleShare: 'Udio ženskih grla',
      planHint: 'Za smanjenje brojnosti presudan je odstrjel ženskih grla i mladi — ne broj trofeja.',
      nextLov: 'Sljedeći skupni lov', noNextLov: 'Nije planiran skupni lov.', recent: 'Zadnji unosi', lovDefaultName: 'Skupni lov',
      aspPositiveShort: 'POZITIVAN nalaz ASK', coldOld: '{n} komada dulje od 7 dana', aspWaiting: '{n} čeka nalaz ASK',
      streckeTitle: '{n} komada', streckeSub: '{ist} od {soll} po planu', pendingN: '{n} čeka slanje', tabList: 'Popis', tabPlan: 'Plan',
      allGrounds: 'Sva lovišta', allSpecies: 'Sve vrste', stError: 'Greška', stPending: 'Čeka slanje', inCold: 'U hladnjači',
      emptyStreckeTitle: 'Još nema odstrjela', emptyStreckeText: 'U ovoj lovnoj godini još ništa nije uneseno.',
      klasa: 'Dobna klasa', istSoll: 'Ostvareno / plan', noClass: '{n} bez dobne klase', planSource: 'Plan po LGO Gornja Motičina XIV-191, isti za sva tri lovišta (ukupno ×3).',
      lblDatum: 'Datum', lblLoviste: 'Lovište', lblZona: 'Predio / mjesto', lblVrsta: 'Vrsta divljači', lblSpol: 'Spol', spolM: 'Muško', spolZ: 'Žensko',
      lblTezina: 'Težina', lblTezinaShort: 'Težina', lblMarkica: 'Broj markice', lblLovac: 'Lovac', lblNacinLova: 'Način lova', lblLov: 'Skupni lov', lblStand: 'Stajalište',
      lblNapomena: 'Napomena', lblGps: 'Položaj (GPS)', lblFoto: 'Fotografija', lblKojaVrsta: 'Koja vrsta?', spOstalo: 'Ostale vrste',
      phVrsta: 'npr. lisica, čagalj, jazavac', phLovac: 'Ime i prezime', phZona: 'npr. Čifutski put',
      phNapomena: 'npr. bolesno, prometna nesreća, dodatne informacije', phNapomenaSvinja: 'npr. bolest, ozljede, netipičan izgled (križanac s domaćom svinjom) — ili "bez posebnosti"',
      onMap: 'Na karti', showPhoto: 'Prikaži fotografiju', photoOffline: 'Fotografija se može učitati samo s internetom.',
      confirmDiscard: 'Ovaj unos još nije poslan. Obrisati ga s uređaja?',
      editOdstrjel: 'Uredi odstrjel', editSentHint: 'Unos je već u evidenciji — izmjena se bilježi u tablici.',
      klasaHint: 'Važno za plan: prase/tele, mlađa, srednja, zrela klasa.', tezinaHint: 'Težina s izvađenom utrobom.',
      gpsNone: 'nije dodano', gpsTake: 'Uzmi', gpsWaiting: 'Traženje položaja…', gpsOutside: 'izvan lovišta', gpsDenied: 'Pristup lokaciji nije dopušten.', gpsFailed: 'Položaj nije dostupan.', gpsAcc: 'Točnost ± {m} m',
      coldCheck: 'Grlo ide u hladnjaču', lblAspUzorak: 'Broj ASK uzorka', phAspUzorak: 'broj s tube / obrasca',
      moreDetails: 'Više podataka (skupni lov, način lova, fotografija)', noLov: 'bez skupnog lova',
      errSelectVrsta: 'Odaberite vrstu divljači.', errOstalo: 'Upišite koja je vrsta.', errSvinjaNapomena: 'Kod divlje svinje upišite napomenu o izgledu/ponašanju (ili "bez posebnosti").',
      errRequired: 'Popunite sva obavezna polja (*).', errTezina: 'Neispravna težina.', errSaveFailed: 'Spremanje na uređaju nije uspjelo.',
      savedChanges: 'Izmjene spremljene.', doneLocal: 'Spremljeno na uređaju', doneLocalText: 'poslat će se automatski čim bude interneta.', doneSent: 'Poslano', doneSentText: 'spremljeno u evidenciju.',
      layer_objekti: 'Objekti', layer_odstrjel: 'Odstrjel', layer_odjeli: 'Odjeli', myLocation: 'Moja lokacija', addObjekt: 'Novi objekt', placeHere: 'Postavi ovdje',
      placeHint: 'Pomaknite kartu tako da je križić na mjestu objekta.', moveHint: 'Premjesti: {name} — pomaknite kartu i potvrdite.', moved: 'Položaj promijenjen.',
      mapNotSaved: 'Karta još nije spremljena za rad bez interneta.', saveMap: 'Spremi kartu (≈ 12 MB)', updateMap: 'Ponovno spremi kartu', savingMap: 'Spremanje karte… {p} %',
      mapSaved: 'Karta je spremljena za rad bez interneta.', saveMapPartial: '{n} dijelova nije spremljeno — pokušajte ponovno s boljom vezom.', saveMapFailed: 'Spremanje karte nije uspjelo.',
      mapSavedAt: 'Spremljeno {t} ({n} pločica).', mapDataMissing: 'Podaci karte nisu dostupni.', mapDataMissingText: 'Otvorite aplikaciju jednom s internetom.',
      odjeliLegend: 'Bakreno: pomladak (I. dobni razred). Žuto: oplodna sječa (≥ VI. razred, prorijeđen sklop).',
      verjPomladak: 'Pomladak — ugrožen brstom', verjOplodna: 'Oplodna sječa — pomlađivanje', verjHint: 'Izvedeno iz osnove gospodarenja (dobni razred, sklop) — nije terenska procjena. Ovdje je lov najvažniji.',
      odGj: 'Gospodarska jedinica', odOdjel: 'Odjel', odHa: 'Površina', odRazred: 'Uređajni razred', odStarost: 'Starost', odDobni: 'Dobni razred', odSklop: 'Sklop', odBonitet: 'Bonitet', odUzgoj: 'Uzgojni oblik', odGodina: 'Stanje osnove', odSource: 'Izvor: Hrvatske šume, osnove gospodarenja (QField terenska karta).',
      objArt: 'Vrsta objekta', objBroj: 'Broj', objNaziv: 'Naziv', objStanje: 'Stanje', phObjNapomena: 'npr. ljestve oštećene, pristup s ceste',
      newObjekt: 'Novi objekt', editObjekt: 'Uredi objekt', reportState: 'Prijavi stanje', move: 'Premjesti', lastChange: 'Zadnja izmjena',
      uklonjenHint: 'Uklanjanje (npr. hranilišta) označava uprava.', outsideGrounds: 'izvan lovišta', confirmDeleteObj: 'Obrisati „{name}"?',
      savedSending: 'Spremljeno — šalje se.', savedLocal: 'Spremljeno na uređaju — šalje se kad bude interneta.',
      lovoviTitle: 'Skupni lovovi', lovoviNext: 'Sljedeći: {d} · {l}', newLov: 'Novi skupni lov', editLov: 'Uredi skupni lov', upcoming: 'Planirano', past: 'Održano',
      emptyLovTitle: 'Još nema skupnih lovova', emptyLovUprava: 'Planirajte prvi skupni lov — stajališta birate s karte.', emptyLovLovac: 'Uprava ovdje objavljuje skupne lovove.',
      addToLov: 'Unesi odstrjel', lovQuickTitle: 'Odstrjel u lovu', lovQuickN: 'upisano: {n}', saved: 'spremljeno', stands: 'Stajališta', participants: 'Sudionici', participantsN: '{n} sudionika', lovStrecke: 'Odstrjel na lovu',
      noStands: 'Stajališta nisu dodijeljena.', standsHint: 'Čeke i stajališta u odabranom lovištu (unose se na karti).', noStandsInGround: 'U ovom lovištu još nema čeka — unesite ih na karti.',
      lblVodja: 'Voditelj lova', lblLovNaziv: 'Naziv', phLovNaziv: 'npr. Skupni lov Klanac — istok', phParticipants: 'jedno ime po retku', errLovDatum: 'Upišite datum.', confirmDeleteLov: 'Obrisati ovaj skupni lov? Odstrjel ostaje u evidenciji.',
      wildbret: 'Divljačina', coldTitle: '{n} u hladnjači', coldSub: 'Prijevoz u odobreni objekt najkasnije 7 dana nakon pregleda.',
      aspPositiveTitle: 'Pozitivan nalaz ASK',
      coldOldHint: 'Prema Uredbi (EZ) 853/2004 krupna divljač mora u odobreni objekt u roku od 7 dana.', coldEmpty: 'Hladnjača je prazna', coldEmptyText: 'Komadi se ovdje pojavljuju kad se pri unosu označi „u hladnjaču".',
      notInCold: 'Nije evidentirano u hladnjači', putInCold: 'U hladnjaču', handedOver: 'Predano', sinceDate: 'od {d}', unknownPiece: 'Komad', trich: 'Trihinela',
      aspNalaz: 'Nalaz ASK', aspShort: 'ASK', predano: 'Predano', kupac: 'Kupac / primatelj', onlyUprava: 'Nalaze i predaju unosi uprava.', coldSource: 'Rok od 7 dana: Uredba (EZ) 853/2004, Prilog III, Odjeljak IV.',
      lovostajTitle: 'Danas otvoreno: {n}', lovostajSub: 'Kategorije krupne divljači u kojima danas nije lovostaj.', yearBand: 'Kroz godinu', withLimits: 'uz ograničenja',
      allYear: 'cijele godine', opensOn: 'otvara {d} (za {n} d.)', closesIn: 'do {d} (još {n} d.)',
      lovostajSource: 'Izvor: {izvor}; provjereno {stanje}.', lovostajNote: 'Uvijek vrijedi i plan odstrjela iz LGO te naredbe veterinarske službe (ASK). Aplikacija ne zamjenjuje propis.',
      grpJelen: 'Jelen obični', grpLopatar: 'Jelen lopatar', grpSvinja: 'Divlja svinja', grpSrna: 'Srna', grpMuflon: 'Muflon', grpSitna: 'Sitna divljač',
      lsJelenM: 'Jelen', lsKosuta: 'Košuta', lsTele: 'Tele', lsLopatarM: 'Jelen lopatar', lsLopatarZ: 'Košuta lopatara', lsLopatarTele: 'Tele lopatara',
      lsSvinja: 'Divlja svinja', lsSrnjak: 'Srnjak', lsSrnaLane: 'Srna i lane', lsMuflonM: 'Muflon', lsMuflonZ: 'Muflonka i janje',
      lsLisica: 'Lisica', lsCagalj: 'Čagalj', lsJazavac: 'Jazavac', lsKunaB: 'Kuna bjelica', lsKunaZ: 'Kuna zlatica', lsZec: 'Zec',
      noteBredja: 'Osim ženke kad je visoko bređa ili vodi mladunčad.', noteBredjaSitna: 'Osim ženke kad je visoko bređa ili vodi sitnu mladunčad.',
      viseLovostajSub: 'Što je danas otvoreno', viseColdSub: 'Hladnjača, ASK, predaja', visePlanSub: 'Po dobnim razredima i spolu',
      syncTitle: 'Slanje podataka', allSent: 'Sve je poslano', lastPull: 'Zadnje ažuriranje: {t}', subKeep: 'Ne brišite podatke preglednika dok sve nije poslano.', subOffline: 'Nema interneta — šalje se kasnije.',
      syncNow: 'Pošalji i ažuriraj sada', syncDone: 'Ažurirano.', qNewOdstrjel: 'Novi odstrjel', qEditOdstrjel: 'Izmjena odstrjela', qObjekt: 'Objekt', qLov: 'Skupni lov', qWildbret: 'Hladnjača / ASK',
      offlineMap: 'Karta bez interneta', settings: 'Postavke', role: 'Uloga', changeCode: 'Promijeni kod', roleUpravaHint: 'Tim: sve funkcije — odstrjel, karta, skupni lovovi, hladnjača/ASK, gosti, ispravci.',
      about: 'O aplikaciji',
      legal: 'Seona Eko — interni pomoćni alat za upravljanje revirom. Ne zamjenjuje zakonsku obvezu markiranja, potvrdu o podrijetlu divljači ni prijavu u Središnju lovnu evidenciju (SLE) — te obveze i dalje vodi stručna osoba.',
      aboutData: 'Karta: QField karta revira (DGU, OpenStreetMap, Hrvatske šume). Lovostaj: Pravilnik o lovostaju (NN 94/2019). Plan: LGO Gornja Motičina XIV-191.'
    },
    en: {
      brandSub: 'Hunting ground', roleUprava: 'Team',
      lblMjesto: 'Location', pickOnMap: 'Choose on map', locHint: 'At the spot: "My location". Later (e.g. at the cold room): choose the place on the map.', locUnnamed: 'Place selected', locChange: 'Change', locClear: 'Remove', lblVrijeme: 'Time (optional)', moreDetailsTitle: 'More details', pickHint: 'Move the map so the crosshair is on the location.',
      fullscreen: 'Full-screen map', fullscreenExit: 'Exit full screen', showOriginal: 'Original text',
      sunrise: 'Sunrise', sunset: 'Sunset', windFrom: 'from {d}', gusts: 'gusts', moon_new: 'New moon', moon_waxCres: 'Waxing crescent', moon_firstQ: 'First quarter', moon_waxGib: 'Waxing gibbous', moon_full: 'Full moon', moon_wanGib: 'Waning gibbous', moon_lastQ: 'Last quarter', moon_wanCres: 'Waning crescent', weatherOffline: 'Weather loads when there is internet.', weatherTitle: 'Weather & wind', w_clear: 'Clear', w_partly: 'Partly cloudy', w_cloudy: 'Cloudy', w_fog: 'Fog', w_rain: 'Rain', w_snow: 'Snow', w_storm: 'Thunderstorm', feelsLike: 'feels {t}°', weatherAsOf: 'As of', next24h: 'Next 24 hours', huntHoursHint: 'highlighted: around sunrise and sunset', weatherNone: 'No forecast yet', weatherNoneText: 'The forecast loads as soon as there is internet.', weatherSource: 'Source: MET Norway (api.met.no), licence CC BY 4.0; centre of the grounds. As of {t}. The arrow shows where the wind blows to.', aspSentDays: 'sent {n} d ago', aspNotSent: 'not sent', next_sample: 'Enter ASF sample', next_send: 'Sample sent', next_result: 'Enter result', next_out: 'Remove from cold room', sampleNo: 'Sample', stepsLegend: 'Stored · sample · sent · result · removed', outTitle: 'Removed from cold room', izlaz_kupac: 'Buyer', izlaz_vlastito: 'Own use', izlaz_uklanjanje: 'Safe disposal', aspGroup_noSample: 'No sample', aspGroup_notSent: 'Not sent', aspGroup_sent: 'Sent — awaiting result', aspGroup_result: 'Result received (30 days)', selectAll: 'Select all', batch_notSent: 'Mark as sent ({n})', batch_sent: 'Enter result ({n})', aspGroupEmpty: 'Nothing.', aspFlowHint: 'Sample taken → sent → result. Select several samples at once when they go to the lab together.', aspSummary: '{a} samples not sent · {b} awaiting result', aspTileLine: '{a} not sent · {b} awaiting result', tabCold: 'In cold room', tabAsp: 'ASF samples', sentOn: 'Sent on', lab: 'Lab / office', phLab: 'e.g. veterinary station', savedN: 'Saved ({n}).', resultHint: 'All preset to "negative" — change individual ones if needed.', resultOn: 'Result of', outOnlyDisposal: 'With a positive result only safe disposal is allowed.', outNoResultTitle: 'No negative ASF result', outNoResultText: 'Wild boar from a restriction zone may only leave with a negative result. Continue only if the veterinary service has ordered otherwise.', outConfirm: 'I confirm removal is permitted', izlazKind: 'Type of removal', outOn: 'Removal date', outConfirmNeeded: 'Please confirm removal without a negative result.', step_in: 'Stored', step_sample: 'ASF sample', step_send: 'Sent', step_result: 'Result', step_out: 'Removed', editData: 'Edit data', gToday: 'Today', gPickup: 'Pick-up', gSeat: 'High seat', gReturn: 'Back around', gGuide: 'Guide', gWriteGuide: 'WhatsApp — {n}', gWelcomeName: 'Welcome, {n}', gYourAnsitz: 'Your hunt today', gNextAnsitz: 'Next hunt', gMoreAnsitz: 'Further dates', gSeasonToday: 'In season today', gSeasonHint: 'What you may take will be agreed with your guide.', gAnsitzRules: 'On the high seat', gA1: 'Check the ladder and seat before climbing.', gA2: 'Your firearm is unloaded while climbing up or down.', gA3: 'Shoot only with a safe backstop — never towards the horizon.', gA4: 'Shoot only at clearly identified game, as agreed with your guide.', gA5: 'After a shot, stay on the seat and contact your guide; do not track game yourself.', gA6: 'Stay on the seat until your guide collects you. Phone silent but reachable.', gAnsitzNote: 'General advice — your guide’s instructions are what counts.', gLegalAnsitz: 'Seona Eko — guest information. Seasons are for information; your guide decides on site.', guestsTitle: 'Guests & stands', guestsSub: 'Guests get a QR code and see their own dates.', newGuest: 'New guest', editGuest: 'Edit guest', guestsCurrent: 'Current and upcoming', guestsPast: 'Earlier', guestsEmpty: 'No guests yet', guestsEmptyText: 'Add a guest — they get a QR code for their phone.', linkCopied: 'Link copied.', guestLinkMsg: 'Welcome, {n}! Your hunting app:', confirmDeleteGuest: 'Delete guest {n} and their dates?', qrTitle: 'QR code for the guest’s phone', qrHint: 'The guest scans it with the camera — the app opens already set up.', copyLink: 'Copy link', sendWhatsApp: 'Send via WhatsApp', ansitzTitle: 'Hunting dates', newAnsitz: 'New date', editAnsitz: 'Edit date', ansitzEmpty: 'No dates yet.', guestName: 'Guest name', stayFrom: 'Stay from', stayTo: 'to', errGuestName: 'Please enter the guest’s name.', phReturn: 'e.g. 21:00', phPickup: 'e.g. 16:30 hunting lodge', phSeat: 'e.g. High seat 12 — Strmac', seatHint: 'The guest sees only the name, not the position on the map.', phAnsitzNote: 'e.g. warm clothes, thermos', guestsToday: 'Guests today', guestsViseSub: 'QR code, hunting dates',
      roleGost: 'Guest', roleGostHint: 'Guest: overview, map, contact — no data entry.', navGost: 'Overview', whatsapp: 'WhatsApp', call: 'Call', noContacts: 'No contact entered yet.', emergency: 'Emergency', emergencySub: 'Ambulance, police, fire brigade', gWelcome: 'Welcome', gContact: 'Contact', gYourHunt: 'Your hunt', gNextHunt: 'Next hunt', gFreeToday: 'What may be taken today', gFreeN: 'open: {n}', gPlanDone: 'plan fulfilled', opensShort: 'from {d}', gFreeHint: 'Based on hunting seasons and the harvest plan. The final decision on each animal is made by the hunt leader or your guide on site.', gPrasad: 'Piglets', gNazimad: 'Yearlings', gZrelaSvinja: 'Boar / sow', gLopatarOdrasli: 'Fallow buck and doe', gSafety: 'Safety on driven hunts', gSafetyOpen: 'Basic rules (show)', gS1: 'Load your firearm only on the stand; unload it before leaving the stand.', gS2: 'Do not leave your stand before the end-of-drive signal.', gS3: 'Shoot only with a safe backstop — never into the drive, towards neighbouring stands, roads or houses.', gS4: 'Shoot only within the sector assigned by the hunt leader.', gS5: 'Wear blaze orange (vest or hat).', gS6: 'Shoot only at game you have clearly identified and that is released — if in doubt, do not shoot.', gS7: 'Note the place of the shot and report it; do not track wounded game yourself — the hunt leader organises the search.', gSafetyNote: 'General advice — the hunt leader’s safety briefing is what counts.', gHunts: 'Hunts', gMeeting: 'Meeting point', gRoute: 'Directions', gLegal: 'Seona Eko — guest information. Seasons and plan are for information; the release of game and instructions on site are given by the hunt leader.', guestPreviewNote: 'This is how guests see this page.', contacts: 'Contacts', contactsHint: 'Contacts are maintained in the sheet, tab "Kontakti".', guestView: 'Guest view', guestViewSub: 'How guests see the app', meetPlaceHint: 'Move the map so the crosshair is on the meeting point.', meetSaved: 'Meeting point saved.', meetSet: 'Set on map', meetNone: 'No meeting point entered.', lblNapomenaGost: 'Note for guests', lblNapomenaIntern: 'Note (internal)', phMeeting: 'e.g. 7:30, hunting lodge Klanac', meetFormHint: 'Guests see the meeting point and the note for guests — not internal notes, stands or participants.', phNapomenaGost: 'e.g. bring a blaze orange vest; breakfast after the hunt',
      navHome: 'Home', navKarta: 'Map', navOdstrjel: 'Harvest', navLovovi: 'Hunts', navVise: 'More', tabGuests: 'Guests', nextGuest: 'Next guest',
      pillSynced: 'Synced', pillPending: '{n} waiting', pillSending: 'Sending…', pillOffline: 'Offline', pillErrors: '{n} error(s)', pillCode: 'Check code',
      cancel: 'Cancel', close: 'Close', btnSave: 'Save', btnSaveChanges: 'Save changes', btnSaveOdstrjel: 'Save entry', btnAnother: 'Add another', btnDone: 'Done', btnUpdate: 'Reload',
      edit: 'Edit', delete: 'Delete', discard: 'Discard', back: 'Back', details: 'Details', all: 'All', loading: 'Loading…', checking: 'Checking…', notFound: 'Not found',
      today: 'today', open: 'open', closed: 'closed season', years: 'yrs', daysShort: 'days', pieces: ' head',
      setupText: 'Scan your QR code or enter your code.',
      lblLang: 'Language', lblCode: 'Hunting ground code', lblDevice: 'Your name / device', phDevice: 'e.g. Marko – Samsung', phCodeKeep: 'empty = keep current code',
      errCodeEmpty: 'Please enter the code.', errCodeWrong: 'The code is wrong.', setupOffline: 'No internet — the code will be checked on the first send.',
      updateText: 'A new version of the app is available.', updateCheck: 'Check for update', updateLoading: 'Loading the new version…', updateNone: 'The app is up to date.',
      huntYear: 'Hunting year', homeTitle: 'Today on the ground', sunLine: 'Sunrise {rise} · sunset {set}',
      homeErrors: '{n} entr(y/ies) rejected', homeErrorsHint: 'See the reason and fix or discard.',
      newOdstrjel: 'New harvest entry', newOdstrjelSub: 'works without internet', quickObjekt: 'Facility on map', quickLovostaj: 'Seasons',
      tileStrecke: 'Harvest', tileStreckeSub: 'of plan (all three grounds)', tileCold: 'Cold room', tileColdSub: 'head in the cold room',
      openToday: 'Open today', allSeasons: 'Full year', nothingOpen: 'Closed season for all large game today.',
      openTodayHint: 'Wild boar has no closed season except heavily pregnant females or females with young. Only up to the number in the management plan.',
      planTitle: 'Harvest plan', planPrasad: 'Piglets', planKrmace: 'Sows and yearling sows', femaleShare: 'Share of females',
      planHint: 'To reduce numbers, taking females and young is what counts — not trophies.',
      nextLov: 'Next driven hunt', noNextLov: 'No driven hunt planned.', recent: 'Latest entries', lovDefaultName: 'Driven hunt',
      aspPositiveShort: 'POSITIVE ASF result', coldOld: '{n} head longer than 7 days', aspWaiting: '{n} awaiting ASF result',
      streckeTitle: '{n} head', streckeSub: '{ist} of {soll} planned', pendingN: '{n} waiting to send', tabList: 'List', tabPlan: 'Plan',
      allGrounds: 'All grounds', allSpecies: 'All species', stError: 'Error', stPending: 'Waiting', inCold: 'In cold room',
      emptyStreckeTitle: 'No harvest yet', emptyStreckeText: 'Nothing has been entered in this hunting year yet.',
      klasa: 'Age class', istSoll: 'Actual / plan', noClass: '{n} without age class', planSource: 'Plan per LGO Gornja Motičina XIV-191, identical for all three grounds (total ×3).',
      lblDatum: 'Date', lblLoviste: 'Hunting ground', lblZona: 'Area / place', lblVrsta: 'Species', lblSpol: 'Sex', spolM: 'Male', spolZ: 'Female',
      lblTezina: 'Weight', lblTezinaShort: 'Weight', lblMarkica: 'Tag number', lblLovac: 'Hunter', lblNacinLova: 'Method', lblLov: 'Driven hunt', lblStand: 'Stand',
      lblNapomena: 'Notes', lblGps: 'Position (GPS)', lblFoto: 'Photo', lblKojaVrsta: 'Which species?', spOstalo: 'Other species',
      phVrsta: 'e.g. fox, jackal, badger', phLovac: 'Full name', phZona: 'e.g. Čifutski put',
      phNapomena: 'e.g. sick, road accident, further details', phNapomenaSvinja: 'e.g. illness, injuries, atypical look (domestic pig hybrid) — or "no anomalies"',
      onMap: 'On map', showPhoto: 'Show photo', photoOffline: 'Photos can only be loaded with internet.',
      confirmDiscard: 'This entry has not been sent yet. Delete it from this device?',
      editOdstrjel: 'Edit entry', editSentHint: 'This entry is already transferred. The correction is recorded.',
      klasaHint: 'Matters for the plan: calf/piglet, young, middle, mature class.', tezinaHint: 'Field-dressed weight.',
      gpsNone: 'not added', gpsTake: 'Get', gpsWaiting: 'Finding position…', gpsOutside: 'outside the grounds', gpsDenied: 'Location access not allowed.', gpsFailed: 'Position not available.', gpsAcc: 'Accuracy ± {m} m',
      coldCheck: 'Goes into the cold room', lblAspUzorak: 'ASF sample number', phAspUzorak: 'number on tube / form',
      moreDetails: 'More details (driven hunt, method, photo)', noLov: 'no driven hunt',
      errSelectVrsta: 'Please select a species.', errOstalo: 'Please enter which species.', errSvinjaNapomena: 'For wild boar enter a note on look/behaviour (or "no anomalies").',
      errRequired: 'Please fill in all required fields (*).', errTezina: 'Invalid weight.', errSaveFailed: 'Could not save on this device.',
      savedChanges: 'Changes saved.', doneLocal: 'Saved on this device', doneLocalText: 'will be sent automatically once there is internet.', doneSent: 'Sent', doneSentText: 'saved to the log.',
      layer_objekti: 'Facilities', layer_odstrjel: 'Harvest', layer_odjeli: 'Compartments', myLocation: 'My location', addObjekt: 'New facility', placeHere: 'Place here',
      placeHint: 'Move the map so the crosshair is on the facility.', moveHint: 'Move: {name} — pan the map and confirm.', moved: 'Position changed.',
      mapNotSaved: 'The map is not saved for offline use yet.', saveMap: 'Save map (≈ 12 MB)', updateMap: 'Save map again', savingMap: 'Saving map… {p} %',
      mapSaved: 'Map saved for offline use.', saveMapPartial: '{n} parts not saved — try again with a better connection.', saveMapFailed: 'Saving the map failed.',
      mapSavedAt: 'Saved {t} ({n} tiles).', mapDataMissing: 'Map data not available.', mapDataMissingText: 'Open the app once with internet.',
      odjeliLegend: 'Copper: young stands (age class I). Yellow: shelterwood (class ≥ VI, opened canopy).',
      verjPomladak: 'Young stand — at risk from browsing', verjOplodna: 'Shelterwood — regeneration', verjHint: 'Derived from the forest management plan (age class, canopy) — not a field survey. Hunting matters most here.',
      odGj: 'Management unit', odOdjel: 'Compartment', odHa: 'Area', odRazred: 'Management class', odStarost: 'Age', odDobni: 'Age class', odSklop: 'Canopy', odBonitet: 'Site class', odUzgoj: 'Silvicultural form', odGodina: 'Plan status', odSource: 'Source: Hrvatske šume management plans (QField field map).',
      objArt: 'Type', objBroj: 'Number', objNaziv: 'Name', objStanje: 'Condition', phObjNapomena: 'e.g. ladder damaged, access from the road',
      newObjekt: 'New facility', editObjekt: 'Edit facility', reportState: 'Report condition', move: 'Move', lastChange: 'Last change',
      uklonjenHint: 'Removal (e.g. of a baiting site) is marked by management.', outsideGrounds: 'outside the grounds', confirmDeleteObj: 'Delete "{name}"?',
      savedSending: 'Saved — sending.', savedLocal: 'Saved on this device — will be sent when online.',
      lovoviTitle: 'Driven hunts', lovoviNext: 'Next: {d} · {l}', newLov: 'New driven hunt', editLov: 'Edit driven hunt', upcoming: 'Planned', past: 'Held',
      emptyLovTitle: 'No driven hunts yet', emptyLovUprava: 'Plan the first driven hunt — stands are picked from the map.', emptyLovLovac: 'Management publishes driven hunts here.',
      addToLov: 'Add harvest', lovQuickTitle: 'Harvest of this hunt', lovQuickN: '{n} entered', saved: 'saved', stands: 'Stands', participants: 'Participants', participantsN: '{n} participants', lovStrecke: 'Bag of this hunt',
      noStands: 'No stands assigned.', standsHint: 'Seats and stands in the selected ground (entered on the map).', noStandsInGround: 'No seats in this ground yet — add them on the map.',
      lblVodja: 'Hunt leader', lblLovNaziv: 'Name', phLovNaziv: 'e.g. Klanac east drive', phParticipants: 'one name per line', errLovDatum: 'Please enter a date.', confirmDeleteLov: 'Delete this driven hunt? The harvest stays in the log.',
      wildbret: 'Game meat', coldTitle: '{n} in cold room', coldSub: 'Transport to an approved establishment within 7 days after inspection.',
      aspPositiveTitle: 'Positive ASF result',
      coldOldHint: 'Under Regulation (EC) 853/2004 large game must reach an approved establishment within 7 days.', coldEmpty: 'The cold room is empty', coldEmptyText: 'Items appear here when "put in cold room" is ticked on entry.',
      notInCold: 'Not recorded in cold room', putInCold: 'To cold room', handedOver: 'Handed over', sinceDate: 'since {d}', unknownPiece: 'Item', trich: 'Trichinella',
      aspNalaz: 'ASF result', aspShort: 'ASF', predano: 'Handed over', kupac: 'Buyer / recipient', onlyUprava: 'Results and hand-over are entered by management.', coldSource: '7-day limit: Regulation (EC) 853/2004, Annex III, Section IV.',
      lovostajTitle: 'Open today: {n}', lovostajSub: 'Large game categories without closed season today.', yearBand: 'Through the year', withLimits: 'with limits',
      allYear: 'all year', opensOn: 'opens {d} (in {n} d)', closesIn: 'until {d} ({n} d left)',
      lovostajSource: 'Source: {izvor}; checked {stanje}.', lovostajNote: 'The management plan (LGO) and veterinary (ASF) orders always apply as well. The app does not replace the regulation.',
      grpJelen: 'Red deer', grpLopatar: 'Fallow deer', grpSvinja: 'Wild boar', grpSrna: 'Roe deer', grpMuflon: 'Mouflon', grpSitna: 'Small game',
      lsJelenM: 'Stag', lsKosuta: 'Hind', lsTele: 'Calf', lsLopatarM: 'Fallow buck', lsLopatarZ: 'Fallow doe', lsLopatarTele: 'Fallow fawn',
      lsSvinja: 'Wild boar', lsSrnjak: 'Roebuck', lsSrnaLane: 'Roe doe and fawn', lsMuflonM: 'Mouflon ram', lsMuflonZ: 'Ewe and lamb',
      lsLisica: 'Fox', lsCagalj: 'Golden jackal', lsJazavac: 'Badger', lsKunaB: 'Stone marten', lsKunaZ: 'Pine marten', lsZec: 'Hare',
      noteBredja: 'Except females heavily pregnant or with young.', noteBredjaSitna: 'Except females heavily pregnant or with small young.',
      viseLovostajSub: 'What is open today', viseColdSub: 'Cold room, ASF, hand-over', visePlanSub: 'By age class and sex',
      syncTitle: 'Sending data', allSent: 'Everything sent', lastPull: 'Last update: {t}', subKeep: 'Do not clear browser data until everything is sent.', subOffline: 'No internet — will send later.',
      syncNow: 'Send and update now', syncDone: 'Updated.', qNewOdstrjel: 'New entry', qEditOdstrjel: 'Correction', qObjekt: 'Facility', qLov: 'Driven hunt', qWildbret: 'Cold room / ASF',
      offlineMap: 'Offline map', settings: 'Settings', role: 'Role', changeCode: 'Change code', roleUpravaHint: 'Team: all features — entries, map, driven hunts, cold room/ASF, guests, corrections.',
      about: 'About',
      legal: 'Seona Eko — internal tool for managing the hunting ground. It does not replace the legal tagging requirement, the certificate of origin or the report to the Central Hunting Registry (SLE) — the designated expert remains responsible for those.',
      aboutData: 'Map: QField map of the grounds (DGU, OpenStreetMap, Hrvatske šume). Seasons: Pravilnik o lovostaju (NN 94/2019). Plan: LGO Gornja Motičina XIV-191.'
    },
    de: {
      brandSub: 'Revier', roleUprava: 'Team',
      lblMjesto: 'Ort des Abschusses', pickOnMap: 'Auf der Karte wählen', locHint: 'Am Anschuss: „Mein Standort". Später (z. B. an der Kühlzelle): Ort auf der Karte wählen.', locUnnamed: 'Ort gewählt', locChange: 'Ändern', locClear: 'Entfernen', lblVrijeme: 'Uhrzeit (freiwillig)', moreDetailsTitle: 'Weitere Angaben', pickHint: 'Karte verschieben, bis das Fadenkreuz auf dem Anschuss liegt.',
      fullscreen: 'Karte im Vollbild', fullscreenExit: 'Vollbild beenden', showOriginal: 'Originaltext',
      sunrise: 'Sonnenaufgang', sunset: 'Sonnenuntergang', windFrom: 'aus {d}', gusts: 'Böen', moon_new: 'Neumond', moon_waxCres: 'Zunehmende Sichel', moon_firstQ: 'Erstes Viertel', moon_waxGib: 'Zunehmender Mond', moon_full: 'Vollmond', moon_wanGib: 'Abnehmender Mond', moon_lastQ: 'Letztes Viertel', moon_wanCres: 'Abnehmende Sichel', weatherOffline: 'Wetter lädt, sobald Netz da ist.', weatherTitle: 'Wetter & Wind', w_clear: 'Klar', w_partly: 'Heiter bis wolkig', w_cloudy: 'Bewölkt', w_fog: 'Nebel', w_rain: 'Regen', w_snow: 'Schnee', w_storm: 'Gewitter', feelsLike: 'gefühlt {t}°', weatherAsOf: 'Stand', next24h: 'Nächste 24 Stunden', huntHoursHint: 'hervorgehoben: um Sonnenauf- und -untergang', weatherNone: 'Noch keine Vorhersage', weatherNoneText: 'Die Vorhersage lädt, sobald Netz da ist.', weatherSource: 'Quelle: MET Norway (api.met.no), Lizenz CC BY 4.0; Mitte der Reviere. Stand: {t}. Der Pfeil zeigt, wohin der Wind weht.', aspSentDays: 'vor {n} T. verschickt', aspNotSent: 'nicht verschickt', next_sample: 'ASP-Probe eintragen', next_send: 'Probe verschickt', next_result: 'Befund eintragen', next_out: 'Aus der Kühlzelle entnehmen', sampleNo: 'Probe', stepsLegend: 'Eingelagert · Probe · verschickt · Befund · entnommen', outTitle: 'Entnommen', izlaz_kupac: 'Abnehmer', izlaz_vlastito: 'Eigenverbrauch', izlaz_uklanjanje: 'Unschädliche Beseitigung', aspGroup_noSample: 'Ohne Probe', aspGroup_notSent: 'Nicht verschickt', aspGroup_sent: 'Unterwegs — Befund ausstehend', aspGroup_result: 'Befund da (30 Tage)', selectAll: 'Alle wählen', batch_notSent: 'Als verschickt markieren ({n})', batch_sent: 'Befund eintragen ({n})', aspGroupEmpty: 'Nichts.', aspFlowHint: 'Probe genommen → verschickt → Befund. Mehrere Proben gemeinsam markieren, wenn sie zusammen ins Labor gehen.', aspSummary: '{a} Proben nicht verschickt · {b} warten auf Befund', aspTileLine: '{a} nicht verschickt · {b} warten auf Befund', tabCold: 'In der Zelle', tabAsp: 'ASP-Proben', sentOn: 'Verschickt am', lab: 'Labor / Stelle', phLab: 'z. B. Veterinärstation', savedN: 'Gespeichert ({n}).', resultHint: 'Alle sind auf „negativ" vorbelegt — einzelne bei Bedarf ändern.', resultOn: 'Befund vom', outOnlyDisposal: 'Bei positivem Befund nur unschädliche Beseitigung.', outNoResultTitle: 'Kein negativer ASP-Befund', outNoResultText: 'Schwarzwild aus der Restriktionszone darf erst mit negativem Befund die Zelle verlassen. Nur fortfahren, wenn die Veterinärverwaltung etwas anderes angeordnet hat.', outConfirm: 'Ich bestätige, dass die Entnahme zulässig ist', izlazKind: 'Art der Entnahme', outOn: 'Entnommen am', outConfirmNeeded: 'Bitte die Entnahme ohne negativen Befund bestätigen.', step_in: 'Eingelagert', step_sample: 'ASP-Probe', step_send: 'Verschickt', step_result: 'Befund', step_out: 'Entnommen', editData: 'Daten bearbeiten', gToday: 'Heute', gPickup: 'Abholung', gSeat: 'Hochsitz', gReturn: 'Zurück gegen', gGuide: 'Begleiter', gWriteGuide: 'WhatsApp — {n}', gWelcomeName: 'Willkommen, {n}', gYourAnsitz: 'Ihr Ansitz heute', gNextAnsitz: 'Nächster Ansitz', gMoreAnsitz: 'Weitere Termine', gSeasonToday: 'Heute Jagdzeit', gSeasonHint: 'Was Sie schießen dürfen, bespricht Ihr Begleiter mit Ihnen.', gAnsitzRules: 'Auf dem Hochsitz', gA1: 'Leiter und Sitz vor dem Aufsteigen prüfen.', gA2: 'Beim Auf- und Abbaumen ist die Waffe entladen.', gA3: 'Nur mit sicherem Kugelfang schießen — nie gegen den Horizont.', gA4: 'Nur auf sicher angesprochenes Wild schießen, wie mit dem Begleiter besprochen.', gA5: 'Nach dem Schuss auf dem Sitz bleiben und den Begleiter anrufen oder schreiben; nicht selbst nachsuchen.', gA6: 'Auf dem Sitz bleiben, bis der Begleiter Sie abholt. Handy stumm, aber erreichbar.', gAnsitzNote: 'Allgemeine Hinweise — maßgeblich sind die Anweisungen Ihres Begleiters.', gLegalAnsitz: 'Seona Eko — Informationen für Gäste. Jagdzeiten dienen der Information; über den Abschuss entscheidet der Begleiter vor Ort.', guestsTitle: 'Gäste & Ansitze', guestsSub: 'Gäste bekommen einen QR-Code und sehen ihre eigenen Termine.', newGuest: 'Neuer Gast', editGuest: 'Gast bearbeiten', guestsCurrent: 'Aktuell und demnächst', guestsPast: 'Frühere', guestsEmpty: 'Noch keine Gäste', guestsEmptyText: 'Gast anlegen — er bekommt einen QR-Code für sein Handy.', linkCopied: 'Link kopiert.', guestLinkMsg: 'Willkommen, {n}! Ihre Jagd-App:', confirmDeleteGuest: 'Gast {n} und seine Termine löschen?', qrTitle: 'QR-Code für das Gästehandy', qrHint: 'Der Gast scannt ihn mit der Kamera — die App öffnet sich schon eingerichtet.', copyLink: 'Link kopieren', sendWhatsApp: 'Per WhatsApp senden', ansitzTitle: 'Ansitz-Termine', newAnsitz: 'Neuer Termin', editAnsitz: 'Termin bearbeiten', ansitzEmpty: 'Noch keine Termine.', guestName: 'Name des Gastes', stayFrom: 'Aufenthalt von', stayTo: 'bis', errGuestName: 'Bitte den Namen des Gastes eintragen.', phReturn: 'z. B. 21:00', phPickup: 'z. B. 16:30 Jagdhaus', phSeat: 'z. B. Kanzel 12 — Strmac', seatHint: 'Der Gast sieht nur den Namen, nicht die Lage auf der Karte.', phAnsitzNote: 'z. B. warme Kleidung, Thermoskanne', guestsToday: 'Gäste heute', guestsViseSub: 'QR-Code, Ansitz-Termine',
      roleGost: 'Gast', roleGostHint: 'Gast: Übersicht, Karte, Kontakt — ohne Eingaben.', navGost: 'Übersicht', whatsapp: 'WhatsApp', call: 'Anrufen', noContacts: 'Noch kein Kontakt eingetragen.', emergency: 'Notfall', emergencySub: 'Rettung, Polizei, Feuerwehr', gWelcome: 'Willkommen', gContact: 'Kontakt', gYourHunt: 'Ihre Jagd', gNextHunt: 'Nächste Jagd', gFreeToday: 'Was heute frei ist', gFreeN: 'frei: {n}', gPlanDone: 'Plan erfüllt', opensShort: 'ab {d}', gFreeHint: 'Nach Jagdzeiten und Abschussplan. Die Freigabe des einzelnen Stücks gibt vor Ort der Jagdleiter bzw. Ihr Begleiter.', gPrasad: 'Frischlinge', gNazimad: 'Überläufer', gZrelaSvinja: 'Keiler / Bache', gLopatarOdrasli: 'Damhirsch und Damtier', gSafety: 'Sicherheit bei der Drückjagd', gSafetyOpen: 'Grundregeln (anzeigen)', gS1: 'Waffe erst auf dem Stand laden; vor dem Verlassen des Standes entladen.', gS2: 'Den Stand nicht vor dem Signal „Treiben vorbei" verlassen.', gS3: 'Nur mit sicherem Kugelfang schießen — nie ins Treiben, auf Nachbarstände, Wege oder Häuser zu.', gS4: 'Nur in dem vom Jagdleiter zugewiesenen Schussbereich schießen.', gS5: 'Signalfarbe tragen (Warnweste oder Hutband).', gS6: 'Nur sicher angesprochenes, freigegebenes Wild beschießen — im Zweifel nicht schießen.', gS7: 'Anschuss merken und melden; nicht selbst nachsuchen — die Nachsuche organisiert der Jagdleiter.', gSafetyNote: 'Allgemeine Hinweise — maßgeblich ist die Sicherheitseinweisung des Jagdleiters.', gHunts: 'Jagden', gMeeting: 'Treffpunkt', gRoute: 'Route', gLegal: 'Seona Eko — Informationen für Gäste. Jagdzeiten und Plan dienen der Information; Freigabe und Anweisungen vor Ort gibt der Jagdleiter.', guestPreviewNote: 'So sehen Gäste diese Seite.', contacts: 'Kontakte', contactsHint: 'Kontakte werden im Sheet gepflegt, Tab „Kontakti".', guestView: 'Gästeansicht', guestViewSub: 'So sehen Gäste die App', meetPlaceHint: 'Karte verschieben, bis das Fadenkreuz auf dem Treffpunkt liegt.', meetSaved: 'Treffpunkt gespeichert.', meetSet: 'Auf der Karte setzen', meetNone: 'Kein Treffpunkt eingetragen.', lblNapomenaGost: 'Hinweis für Gäste', lblNapomenaIntern: 'Bemerkung (intern)', phMeeting: 'z. B. 7:30, Jagdhaus Klanac', meetFormHint: 'Gäste sehen Treffpunkt und Hinweis für Gäste — nicht die interne Bemerkung, Stände oder Teilnehmer.', phNapomenaGost: 'z. B. Warnweste mitbringen; Frühstück nach der Jagd',
      navHome: 'Start', navKarta: 'Karte', navOdstrjel: 'Strecke', navLovovi: 'Jagden', navVise: 'Mehr', tabGuests: 'Gäste', nextGuest: 'Nächster Gast',
      pillSynced: 'Abgeglichen', pillPending: '{n} warten', pillSending: 'Sendet…', pillOffline: 'Offline', pillErrors: '{n} Fehler', pillCode: 'Code prüfen',
      cancel: 'Abbrechen', close: 'Schließen', btnSave: 'Speichern', btnSaveChanges: 'Änderungen speichern', btnSaveOdstrjel: 'Abschuss speichern', btnAnother: 'Weiteren erfassen', btnDone: 'Fertig', btnUpdate: 'Neu laden',
      edit: 'Bearbeiten', delete: 'Löschen', discard: 'Verwerfen', back: 'Zurück', details: 'Details', all: 'Alle', loading: 'Lädt…', checking: 'Prüfe…', notFound: 'Nicht gefunden',
      today: 'heute', open: 'offen', closed: 'Schonzeit', years: 'J.', daysShort: 'Tage', pieces: ' Stück',
      setupText: 'Scannen Sie Ihren QR-Code oder geben Sie den Code ein.',
      lblLang: 'Sprache', lblCode: 'Revier-Code', lblDevice: 'Ihr Name / Gerät', phDevice: 'z. B. Marko – Samsung', phCodeKeep: 'leer = bisherigen Code behalten',
      errCodeEmpty: 'Bitte Code eingeben.', errCodeWrong: 'Der Code ist falsch.', setupOffline: 'Kein Netz — der Code wird beim ersten Senden geprüft.',
      updateText: 'Eine neue Version der App ist verfügbar.', updateCheck: 'Nach Update suchen', updateLoading: 'Neue Version wird geladen…', updateNone: 'Die App ist aktuell.',
      huntYear: 'Jagdjahr', homeTitle: 'Heute im Revier', sunLine: 'Sonnenaufgang {rise} · Untergang {set}',
      homeErrors: '{n} Eintrag/Einträge abgelehnt', homeErrorsHint: 'Grund ansehen, korrigieren oder verwerfen.',
      newOdstrjel: 'Neuer Abschuss', newOdstrjelSub: 'funktioniert auch ohne Netz', quickObjekt: 'Einrichtung eintragen', quickLovostaj: 'Jagdzeiten',
      tileStrecke: 'Strecke', tileStreckeSub: 'vom Plan (alle drei Reviere)', tileCold: 'Kühlzelle', tileColdSub: 'Stück in der Kühlzelle',
      openToday: 'Heute offen', allSeasons: 'Ganzes Jahr', nothingOpen: 'Heute ist für alles Schalenwild Schonzeit.',
      openTodayHint: 'Schwarzwild ohne Schonzeit, außer hochbeschlagene oder führende Bachen. Nur bis zur Zahl im Abschussplan der LGO.',
      planTitle: 'Abschussplan', planPrasad: 'Frischlinge', planKrmace: 'Bachen und Überläuferbachen', femaleShare: 'Anteil weiblich',
      planHint: 'Für die Reduktion zählt der Eingriff in weibliche Stücke und Jugend — nicht die Trophäe.',
      nextLov: 'Nächste Drückjagd', noNextLov: 'Keine Drückjagd geplant.', recent: 'Letzte Einträge', lovDefaultName: 'Drückjagd',
      aspPositiveShort: 'POSITIVER ASP-Befund', coldOld: '{n} Stück länger als 7 Tage', aspWaiting: '{n} warten auf ASP-Befund',
      streckeTitle: '{n} Stück', streckeSub: '{ist} von {soll} laut Plan', pendingN: '{n} warten auf Senden', tabList: 'Liste', tabPlan: 'Plan',
      allGrounds: 'Alle Reviere', allSpecies: 'Alle Arten', stError: 'Fehler', stPending: 'Wartet', inCold: 'In der Kühlzelle',
      emptyStreckeTitle: 'Noch keine Strecke', emptyStreckeText: 'In diesem Jagdjahr wurde noch nichts erfasst.',
      klasa: 'Altersklasse', istSoll: 'Ist / Soll', noClass: '{n} ohne Altersklasse', planSource: 'Plan laut LGO Gornja Motičina XIV-191, gleich für alle drei Reviere (gesamt ×3).',
      lblDatum: 'Datum', lblLoviste: 'Revier', lblZona: 'Ort / Distrikt', lblVrsta: 'Wildart', lblSpol: 'Geschlecht', spolM: 'Männlich', spolZ: 'Weiblich',
      lblTezina: 'Gewicht', lblTezinaShort: 'Gewicht', lblMarkica: 'Wildmarke', lblLovac: 'Erleger', lblNacinLova: 'Jagdart', lblLov: 'Drückjagd', lblStand: 'Stand',
      lblNapomena: 'Bemerkung', lblGps: 'Position (GPS)', lblFoto: 'Foto', lblKojaVrsta: 'Welche Art?', spOstalo: 'Andere Arten',
      phVrsta: 'z. B. Fuchs, Goldschakal, Dachs', phLovac: 'Vor- und Nachname', phZona: 'z. B. Čifutski put',
      phNapomena: 'z. B. krank, Verkehrsunfall, weitere Angaben', phNapomenaSvinja: 'z. B. Krankheit, Verletzungen, untypisches Aussehen (Hausschwein-Hybride) — oder „ohne Auffälligkeiten"',
      onMap: 'Auf der Karte', showPhoto: 'Foto anzeigen', photoOffline: 'Fotos lassen sich nur mit Netz laden.',
      confirmDiscard: 'Dieser Eintrag ist noch nicht gesendet. Vom Gerät löschen?',
      editOdstrjel: 'Abschuss bearbeiten', editSentHint: 'Der Eintrag ist schon übertragen. Die Korrektur wird vermerkt.',
      klasaHint: 'Wichtig für den Plan: Kalb/Frischling, Jugend-, Mittel-, reife Klasse.', tezinaHint: 'Aufgebrochen gewogen.',
      gpsNone: 'nicht erfasst', gpsTake: 'Übernehmen', gpsWaiting: 'Position wird gesucht…', gpsOutside: 'außerhalb der Reviere', gpsDenied: 'Standortzugriff nicht erlaubt.', gpsFailed: 'Position nicht verfügbar.', gpsAcc: 'Genauigkeit ± {m} m',
      coldCheck: 'Kommt in die Kühlzelle', lblAspUzorak: 'Nr. der ASP-Probe', phAspUzorak: 'Nummer auf Röhrchen / Formular',
      moreDetails: 'Weitere Angaben (Drückjagd, Jagdart, Foto)', noLov: 'keine Drückjagd',
      errSelectVrsta: 'Bitte Wildart wählen.', errOstalo: 'Bitte die Art eintragen.', errSvinjaNapomena: 'Bei Schwarzwild bitte Aussehen/Verhalten notieren (oder „ohne Auffälligkeiten").',
      errRequired: 'Bitte alle Pflichtfelder (*) ausfüllen.', errTezina: 'Ungültiges Gewicht.', errSaveFailed: 'Speichern auf dem Gerät fehlgeschlagen.',
      savedChanges: 'Änderungen gespeichert.', doneLocal: 'Auf dem Gerät gespeichert', doneLocalText: 'wird automatisch gesendet, sobald Netz da ist.', doneSent: 'Gesendet', doneSentText: 'übertragen.',
      layer_objekti: 'Einrichtungen', layer_odstrjel: 'Strecke', layer_odjeli: 'Abteilungen', myLocation: 'Mein Standort', addObjekt: 'Neue Einrichtung', placeHere: 'Hier setzen',
      placeHint: 'Karte verschieben, bis das Fadenkreuz auf der Einrichtung liegt.', moveHint: 'Verschieben: {name} — Karte bewegen und bestätigen.', moved: 'Position geändert.',
      mapNotSaved: 'Die Karte ist noch nicht offline gespeichert.', saveMap: 'Karte speichern (≈ 12 MB)', updateMap: 'Karte neu speichern', savingMap: 'Karte wird gespeichert… {p} %',
      mapSaved: 'Karte offline gespeichert.', saveMapPartial: '{n} Teile fehlen — mit besserem Netz erneut versuchen.', saveMapFailed: 'Speichern der Karte fehlgeschlagen.',
      mapSavedAt: 'Gespeichert {t} ({n} Kacheln).', mapDataMissing: 'Kartendaten nicht verfügbar.', mapDataMissingText: 'App einmal mit Netz öffnen.',
      odjeliLegend: 'Kupfer: Jungbestand (I. Altersklasse). Gelb: Schirmschlag (≥ VI. Klasse, aufgelichtetes Kronendach).',
      verjPomladak: 'Jungbestand — verbissgefährdet', verjOplodna: 'Schirmschlag — Verjüngung', verjHint: 'Aus der Forsteinrichtung abgeleitet (Altersklasse, Kronenschluss) — keine Feldaufnahme. Hier zählt die Bejagung am meisten.',
      odGj: 'Wirtschaftseinheit', odOdjel: 'Abteilung', odHa: 'Fläche', odRazred: 'Betriebsklasse', odStarost: 'Alter', odDobni: 'Altersklasse', odSklop: 'Kronenschluss', odBonitet: 'Bonität', odUzgoj: 'Betriebsform', odGodina: 'Stand der Einrichtung', odSource: 'Quelle: Forsteinrichtung Hrvatske šume (QField-Feldkarte).',
      objArt: 'Art', objBroj: 'Nummer', objNaziv: 'Name', objStanje: 'Zustand', phObjNapomena: 'z. B. Leiter beschädigt, Zugang von der Straße',
      newObjekt: 'Neue Einrichtung', editObjekt: 'Einrichtung bearbeiten', reportState: 'Zustand melden', move: 'Verschieben', lastChange: 'Letzte Änderung',
      uklonjenHint: 'Den Abbau (z. B. einer Kirrung) trägt die Verwaltung ein.', outsideGrounds: 'außerhalb der Reviere', confirmDeleteObj: '„{name}" löschen?',
      savedSending: 'Gespeichert — wird gesendet.', savedLocal: 'Auf dem Gerät gespeichert — wird mit Netz gesendet.',
      lovoviTitle: 'Drückjagden', lovoviNext: 'Nächste: {d} · {l}', newLov: 'Neue Drückjagd', editLov: 'Drückjagd bearbeiten', upcoming: 'Geplant', past: 'Durchgeführt',
      emptyLovTitle: 'Noch keine Drückjagden', emptyLovUprava: 'Erste Drückjagd planen — Stände werden aus der Karte gewählt.', emptyLovLovac: 'Die Verwaltung veröffentlicht Drückjagden hier.',
      addToLov: 'Stück erfassen', lovQuickTitle: 'Strecke der Jagd', lovQuickN: '{n} erfasst', saved: 'gespeichert', stands: 'Stände', participants: 'Teilnehmer', participantsN: '{n} Teilnehmer', lovStrecke: 'Strecke der Jagd',
      noStands: 'Keine Stände zugeordnet.', standsHint: 'Sitze und Stände im gewählten Revier (werden in der Karte eingetragen).', noStandsInGround: 'In diesem Revier noch keine Sitze — in der Karte eintragen.',
      lblVodja: 'Jagdleiter', lblLovNaziv: 'Name', phLovNaziv: 'z. B. Drückjagd Klanac Ost', phParticipants: 'ein Name pro Zeile', errLovDatum: 'Bitte Datum eintragen.', confirmDeleteLov: 'Diese Drückjagd löschen? Die Strecke bleibt erhalten.',
      wildbret: 'Wildbret', coldTitle: '{n} in der Kühlzelle', coldSub: 'Transport zum zugelassenen Betrieb spätestens 7 Tage nach der Untersuchung.',
      aspPositiveTitle: 'Positiver ASP-Befund',
      coldOldHint: 'Nach VO (EG) 853/2004 muss Großwild binnen 7 Tagen im zugelassenen Betrieb sein.', coldEmpty: 'Die Kühlzelle ist leer', coldEmptyText: 'Stücke erscheinen hier, wenn beim Erfassen „In die Kühlzelle" angehakt ist.',
      notInCold: 'Nicht als gekühlt erfasst', putInCold: 'In die Zelle', handedOver: 'Abgegeben', sinceDate: 'seit {d}', unknownPiece: 'Stück', trich: 'Trichinen',
      aspNalaz: 'ASP-Befund', aspShort: 'ASP', predano: 'Abgegeben', kupac: 'Abnehmer', onlyUprava: 'Befunde und Abgabe trägt die Verwaltung ein.', coldSource: '7-Tage-Frist: VO (EG) 853/2004, Anhang III, Abschnitt IV.',
      lovostajTitle: 'Heute offen: {n}', lovostajSub: 'Schalenwild-Kategorien, die heute keine Schonzeit haben.', yearBand: 'Übers Jahr', withLimits: 'mit Einschränkung',
      allYear: 'ganzjährig', opensOn: 'öffnet {d} (in {n} T.)', closesIn: 'bis {d} (noch {n} T.)',
      lovostajSource: 'Quelle: {izvor}; geprüft {stanje}.', lovostajNote: 'Zusätzlich gelten immer der Abschussplan der LGO und Anordnungen der Veterinärverwaltung (ASP). Die App ersetzt nicht die Verordnung.',
      grpJelen: 'Rotwild', grpLopatar: 'Damwild', grpSvinja: 'Schwarzwild', grpSrna: 'Rehwild', grpMuflon: 'Muffelwild', grpSitna: 'Niederwild / Raubwild',
      lsJelenM: 'Hirsch', lsKosuta: 'Alttier / Schmaltier', lsTele: 'Kalb', lsLopatarM: 'Damhirsch', lsLopatarZ: 'Damtier', lsLopatarTele: 'Damkalb',
      lsSvinja: 'Schwarzwild', lsSrnjak: 'Rehbock', lsSrnaLane: 'Ricke und Kitz', lsMuflonM: 'Widder', lsMuflonZ: 'Schaf und Lamm',
      lsLisica: 'Fuchs', lsCagalj: 'Goldschakal', lsJazavac: 'Dachs', lsKunaB: 'Steinmarder', lsKunaZ: 'Baummarder', lsZec: 'Feldhase',
      noteBredja: 'Außer hochbeschlagenen oder führenden weiblichen Stücken.', noteBredjaSitna: 'Außer hochbeschlagenen oder führenden weiblichen Stücken.',
      viseLovostajSub: 'Was heute offen ist', viseColdSub: 'Kühlzelle, ASP, Abgabe', visePlanSub: 'Nach Altersklasse und Geschlecht',
      syncTitle: 'Datenabgleich', allSent: 'Alles gesendet', lastPull: 'Letzte Aktualisierung: {t}', subKeep: 'Browserdaten nicht löschen, bis alles gesendet ist.', subOffline: 'Kein Netz — wird später gesendet.',
      syncNow: 'Jetzt senden und aktualisieren', syncDone: 'Aktualisiert.', qNewOdstrjel: 'Neuer Abschuss', qEditOdstrjel: 'Korrektur Abschuss', qObjekt: 'Einrichtung', qLov: 'Drückjagd', qWildbret: 'Kühlzelle / ASP',
      offlineMap: 'Offline-Karte', settings: 'Einstellungen', role: 'Rolle', changeCode: 'Code ändern', roleUpravaHint: 'Team: alle Funktionen — Abschüsse, Karte, Drückjagden, Kühlzelle/ASP, Gäste, Korrekturen.',
      about: 'Über die App',
      legal: 'Seona Eko — internes Werkzeug zur Revierbewirtschaftung. Ersetzt nicht die gesetzliche Markierungspflicht, den Herkunftsnachweis oder die Meldung an die Središnja lovna evidencija (SLE) — dafür bleibt die stručna osoba zuständig.',
      aboutData: 'Karte: QField-Revierkarte (DGU, OpenStreetMap, Hrvatske šume). Jagdzeiten: Pravilnik o lovostaju (NN 94/2019). Plan: LGO Gornja Motičina XIV-191.'
    }
  };

  // Installation, Karte automatisch, Team-QR, Stornieren, Gästecode (2026-09-29)
  var ADD = {
    hr: {
      instTitle: 'Instalirajte aplikaciju', instText: 'Samo instalirana aplikacija radi bez interneta i ne gubi unose.',
      instIos1: 'Dodirnite Dijeli (kvadrat sa strelicom) dolje u Safariju.', instIos2: 'Odaberite „Dodaj na početni zaslon".', instIos3: 'Otvorite Seona Eko s početnog zaslona.',
      instAndroid: 'Instaliraj aplikaciju', instAndroidManual: 'U Chromeu: izbornik ⋮ → „Instaliraj aplikaciju" (ili „Dodaj na početni zaslon").',
      instInApp: 'Otvorili ste poveznicu unutar WhatsAppa. Otvorite je u pregledniku: izbornik ⋮ ili ••• → „Otvori u pregledniku" (iPhone: Safari).',
      instLater: 'Nastavi u pregledniku',
      mapAutoSaving: 'Karta se sprema za rad bez interneta… {p} %', mapAutoDone: 'Karta je spremljena — radi i bez interneta.',
      errKlasa: 'Odaberite dobnu klasu.', btnNoAnomalies: 'Bez posebnosti',
      homeStale: '{n} unos(a) čeka slanje dulje od jednog dana', homeStaleHint: 'Otvorite aplikaciju gdje ima signala ili nazovite upravu.',
      teamQrTitle: 'Postavi mobitel člana tima', teamQrSub: 'QR kod s kodom tima', teamQrHint: 'Član tima skenira kod kamerom svog mobitela — aplikacija se otvara već postavljena.',
      teamQrWarn: 'Kod pokazujte samo osobno — ne šaljite ga kao sliku.', teamCodeLbl: 'Ili upišite kod ručno:',
      setupQrHint: 'Kod stoji i ispod QR koda.',
      storno: 'Storniraj', stornoTitle: 'Stornirati odstrjel?', stornoText: 'Unos ostaje zabilježen u tablici, ali se više ne broji u odstrjel, plan ni hladnjaču.',
      stornoReason: 'Razlog', stornoR1: 'Dvostruko upisano', stornoR2: 'Pogrešni podaci', stornoR3: 'Test', errStornoReason: 'Odaberite ili upišite razlog.', stornoDone: 'Odstrjel storniran.', qStorno: 'Storno',
      
      
      needOnline: 'Za ovo je potreban internet.',
      lblVrhovi: 'Rogovlje — ukupno vrhova', hintVrhovi: 'npr. 12 = dvanaesterac', lblLopata: 'Rogovlje (lopata)', lblRogovlje: 'Rogovlje',
      errVrhovi: 'Upišite broj vrhova rogovlja.', errLopata: 'Odaberite rogovlje (lopata).',
      trofejTitle: 'Ocjena trofeja (nakon ocjenjivanja)', lblTrofejMasa: 'Masa (kg)', lblCic: 'CIC točke', confirmDiscardEdit: 'Ova izmjena još nije poslana. Odbaciti izmjenu? Odstrjel ostaje kakav je bio.',
      tutSkip: 'Preskoči', tutNext: 'Dalje', tutStart: 'Počnimo', tutReplay: 'Vodič', tutReplaySub: 'Sve stranice, korak po korak',
      tour_start_t: 'O aplikaciji', tour_start_x: 'Aplikacija vam treba olakšati posao i pomoći u organizaciji: odstrjel, hladnjača, objekti i lovovi na jednom mjestu. Vodič vam ukratko pokazuje gdje je što.',
      tour_home_t: 'Početna', tour_home_x: 'Ovdje vidite sve važno za danas: vrijeme, lovostaj, odstrjel, hladnjaču, sljedeći skupni lov, sljedećeg gosta i zadnje unose.',
      tour_homeNew_t: '{neu}', tour_homeNew_x: 'Ovim gumbom upisujete odstrijeljeno grlo. Radi i bez signala.',
      tour_homeQuick_t: 'Brzi pristup', tour_homeQuick_x: 'Odavde odmah upisujete objekt ili otvarate lovostaj.',
      tour_sync_t: 'Slanje', tour_sync_x: 'Ovdje vidite je li sve preneseno. Za to se ne morate brinuti, aplikacija sama šalje podatke čim ima signala.',
      tour_formArt_t: 'Vrsta', tour_formArt_x: 'Obrazac se otvara nakon „{neu}". Počinjete s vrstom i spolom.',
      tour_formKlasa_t: 'Dobna klasa', tour_formKlasa_x: 'Mladunče, pomladak ili starije grlo. Kod starijeg grla još odaberite mladu, srednju ili zrelu klasu prema LGO.',
      tour_formOrt_t: 'Mjesto', tour_formOrt_x: 'Na mjestu odstrjela dovoljno je „{standort}". Upisujete li kasnije, npr. kod hladnjače, mjesto odaberite s „{karte}".',
      tour_formCold_t: 'Hladnjača', tour_formCold_x: 'Ide li grlo u hladnjaču, ostavite kvačicu. Tada je odmah na popisu hladnjače.',
      tour_formSave_t: 'Spremi', tour_formSave_x: 'Dodajte težinu, markicu i lovca pa spremite. Bez signala unos pričeka i kasnije se sam pošalje.',
      tour_karta_t: 'Karta', tour_karta_x: 'Terenska karta s putovima, izohipsama i odjelima. Radi i bez signala.',
      tour_kartaGps_t: 'Položaj', tour_kartaGps_x: 'Dodirnete li ovdje, karta prati vaš položaj; plavi stožac pokazuje kamo gledate. Čim pomaknete kartu, praćenje prestaje.',
      tour_kartaWind_t: 'Vjetar', tour_kartaWind_x: 'U sredini jačina vjetra, oznaka na rubu pokazuje odakle puše; narančasta točka je sjever. Nakon „Moja lokacija“ krug se okreće s mobitelom: oznaka gore = vjetar u lice. Dodirom otvarate prognozu.',
      tour_kartaAdd_t: 'Upis objekta', tour_kartaAdd_x: 'Plusom upisujete objekt: postavite križić na mjesto, odaberite vrstu i spremite.',
      tour_kartaLayer_t: 'Slojevi', tour_kartaLayer_x: 'Ovdje uključujete i isključujete objekte, mjesta odstrjela i odjele.',
      tour_kartaFull_t: 'Cijeli zaslon', tour_kartaFull_x: 'Ovim gumbom karta se prikazuje preko cijelog zaslona.',
      tour_strecke_t: 'Odstrjel', tour_strecke_x: 'Ovdje su svi odstrjeli lovne godine. Gore prelazite između popisa, plana i hladnjače.',
      tour_streckeFilter_t: 'Filtar', tour_streckeFilter_x: 'Ako želite vidjeti samo jedno lovište ili vrstu, filtrirajte ovdje.',
      tour_streckeRow_t: 'Unos', tour_streckeRow_x: 'Dodirnite unos da vidite pojedinosti i da ga ispravite ili stornirate.',
      tour_plan_t: 'Plan', tour_plan_x: 'Ovdje vidite koliko je plan odstrjela ispunjen, po vrsti i klasi.',
      tour_cold_t: 'Hladnjača', tour_cold_x: 'Ovdje vidite što je u hladnjači i od kada. ASK uzorci su u drugoj kartici.',
      tour_coldRow_t: 'Grlo', tour_coldRow_x: 'Dodirnite grlo da zabilježite sljedeći korak: uzorak, poslano, nalaz, izlaz.',
      tour_jagden_t: 'Lov', tour_jagden_x: 'Ovdje planirate skupne lovove i brinete se o gostima.',
      tour_lovNew_t: 'Novi skupni lov', tour_lovNew_x: 'Skupni lov upisujete s datumom, lovištem, stajalištima i sudionicima.',
      tour_lovOpen_t: 'Skupni lov', tour_lovOpen_x: 'Na dan lova ovdje preko „{stueck}" upisujete odstrjel. Mjesto je stajalište.',
      tour_gostNew_t: 'Novi gost', tour_gostNew_x: 'Prvo dodajte gosta s imenom i boravkom. Zatim kod gosta upišite termine i pokažite mu QR kod. Kad ga skenira, ima aplikaciju.',
      lblWeapon: 'Oružje', setupAbout: 'Interna aplikacija revira Seona Eko za tim i lovne goste.', pillServer: 'Poslužitelj nedostupan', subServer: 'Poslužitelj trenutno ne odgovara — unosi ostaju na mobitelu i šalju se kasnije.', setupServer: 'Poslužitelj trenutno ne odgovara — kod će se provjeriti pri prvom slanju.', btnCopyAddr: 'Kopiraj poveznicu', copiedAddr: 'Poveznica kopirana.', sleLeft: 'SLE · još {n} d', sleToday: 'SLE · danas', sleLate: 'SLE · kasni', sleChip: 'Za SLE ({n})', sleHint: 'Podaci kako ih traži SLE: markica, datum, vrsta, spol, dob. Rok: 7 dana od odstrjela. Dodirnite markicu da je kopirate.', sleEmpty: 'Sve je upisano u SLE.', sleDone: 'Upisano u SLE', sleUndo: 'Ipak nije upisano u SLE', sleDoneToast: 'Označeno: upisano u SLE.', sleUndoToast: 'Vraćeno: još nije u SLE.', sleCopied: 'Markica {m} kopirana.', sleLabel: 'SLE', sleDoneOn: 'upisano {d}', sleOpenTxt: 'još nije upisano', homeSle: '{n} grla za upis u SLE', homeSleHint: 'Najkraći rok: još {n} d', homeSleToday: 'Rok ističe danas', homeSleLate: 'Rok je prošao', klasaDob: 'Dob', setupWelcome: 'Dobro došli u revir.', btnScanQr: 'Skeniraj QR kod', setupOr: 'ili upišite kod', scanHint: 'Držite QR kod u okviru.', scanNoCamera: 'Kamera nije dostupna. Upišite kod ručno.', scanForeign: 'Ovo nije QR kod za Seona Eko.', weaponOwn: 'Vlastito', weaponLoan: 'Posudba', guestCodeHint: 'Na iPhoneu: instalirati aplikaciju, zatim u njoj „Skeniraj QR kod“ ili upisati kod.',
      tour_vise_t: 'Više', tour_vise_x: 'Ovdje su lovostaj, vrijeme, prijenos, karta i jezik.',
      tour_viseMap_t: 'Spremi kartu', tour_viseMap_x: 'Ovdje jednom preuzmite kartu, pa radi i bez signala.',
      tour_viseTeam_t: 'Mobitel za tim', tour_viseTeam_x: 'Ako netko u timu treba aplikaciju, pokažite mu ovaj QR kod.',
      tour_viseTour_t: 'Vodič', tour_viseTour_x: 'Ovdje možete ponovno pogledati ovaj vodič.',
      tour_ende_t: 'Gotovo', tour_ende_x: 'To je sve. Lovu čast!'
    },
    en: {
      instTitle: 'Install the app', instText: 'Only the installed app works without internet and never loses entries.',
      instIos1: 'Tap Share (square with arrow) at the bottom of Safari.', instIos2: 'Choose "Add to Home Screen".', instIos3: 'Open Seona Eko from your home screen.',
      instAndroid: 'Install app', instAndroidManual: 'In Chrome: menu ⋮ → "Install app" (or "Add to Home screen").',
      instInApp: 'You opened the link inside WhatsApp. Open it in your browser: menu ⋮ or ••• → "Open in browser" (iPhone: Safari).',
      instLater: 'Continue in browser',
      mapAutoSaving: 'Saving the map for offline use… {p} %', mapAutoDone: 'Map saved — works without internet.',
      errKlasa: 'Please choose the age class.', btnNoAnomalies: 'No anomalies',
      homeStale: '{n} entr(y/ies) waiting to be sent for more than a day', homeStaleHint: 'Open the app where there is signal, or call the management.',
      teamQrTitle: 'Set up a team member’s phone', teamQrSub: 'QR code with the team code', teamQrHint: 'The team member scans it with their phone camera — the app opens already set up.',
      teamQrWarn: 'Only show this code in person — do not send it as a picture.', teamCodeLbl: 'Or type the code:',
      setupQrHint: 'The code is also printed below the QR code.',
      storno: 'Cancel entry', stornoTitle: 'Cancel this entry?', stornoText: 'The entry stays on record but no longer counts in the harvest, plan or cold room.',
      stornoReason: 'Reason', stornoR1: 'Entered twice', stornoR2: 'Wrong details', stornoR3: 'Test', errStornoReason: 'Choose or type a reason.', stornoDone: 'Entry cancelled.', qStorno: 'Cancellation',
      
      
      needOnline: 'This needs internet.',
      lblVrhovi: 'Antlers — total points', hintVrhovi: 'e.g. 12 = twelve-pointer', lblLopata: 'Antlers (palm)', lblRogovlje: 'Antlers',
      errVrhovi: 'Please enter the number of antler points.', errLopata: 'Please choose the antler stage (palm).',
      trofejTitle: 'Trophy evaluation (after official scoring)', lblTrofejMasa: 'Weight (kg)', lblCic: 'CIC points', confirmDiscardEdit: 'This correction has not been sent yet. Discard it? The entry stays as it was.',
      tutSkip: 'Skip', tutNext: 'Next', tutStart: 'Let’s go', tutReplay: 'Tour', tutReplaySub: 'Every page, step by step',
      tour_start_t: 'About the app', tour_start_x: 'The app is meant to make your work easier and help you stay organised: harvest, cold room, facilities and hunts in one place. The tour shows you where to find what.',
      tour_home_t: 'Home', tour_home_x: 'Here you see the day at a glance: weather, seasons, harvest, cold room, next driven hunt, next guest and the latest entries.',
      tour_homeNew_t: '{neu}', tour_homeNew_x: 'This button lets you record an animal taken. It also works without signal.',
      tour_homeQuick_t: 'Shortcuts', tour_homeQuick_x: 'From here you go straight to adding a facility or to the hunting seasons.',
      tour_sync_t: 'Sending', tour_sync_x: 'Here you see whether everything is transferred. You don’t need to worry about it: the app transfers on its own once there is signal.',
      tour_formArt_t: 'Species', tour_formArt_x: 'This form opens after "{neu}". You start with species and sex.',
      tour_formKlasa_t: 'Age class', tour_formKlasa_x: 'Young of the year, yearling or older. For an older animal also pick young, middle-aged or mature, as in the management plan.',
      tour_formOrt_t: 'Place', tour_formOrt_x: 'On the spot, "{standort}" is enough. If you enter it later, e.g. at the cold room, choose the place with "{karte}".',
      tour_formCold_t: 'Cold room', tour_formCold_x: 'If the animal goes into the cold room, leave the tick set. It then appears in the cold room list straight away.',
      tour_formSave_t: 'Save', tour_formSave_x: 'Add weight, tag and hunter, then save. Without signal the entry waits and goes out later on its own.',
      tour_karta_t: 'Map', tour_karta_x: 'The field map with tracks, contours and compartments. It also works without signal.',
      tour_kartaGps_t: 'Location', tour_kartaGps_x: 'Tap here and the map follows your position; the blue cone shows where you are looking. As soon as you move the map, it stops following.',
      tour_kartaWind_t: 'Wind', tour_kartaWind_x: 'Wind speed in the middle; the mark on the rim shows where the wind comes from; the copper dot is north. After “My location” the dial turns with your phone: mark at the top = wind in your face. Tap to open the weather.',
      tour_kartaAdd_t: 'Add facility', tour_kartaAdd_x: 'The plus lets you add a facility: crosshair on the spot, choose the type, save.',
      tour_kartaLayer_t: 'Layers', tour_kartaLayer_x: 'Here you show or hide facilities, harvest spots and compartments.',
      tour_kartaFull_t: 'Full screen', tour_kartaFull_x: 'For a better overview this button shows the map on the whole screen.',
      tour_strecke_t: 'Harvest', tour_strecke_x: 'Here you find every entry of the hunting year. At the top you switch between list, plan and cold room.',
      tour_streckeFilter_t: 'Filter', tour_streckeFilter_x: 'If you only want to see one ground or species, filter here.',
      tour_streckeRow_t: 'Entry', tour_streckeRow_x: 'Tap an entry to see the details and to correct or cancel it.',
      tour_plan_t: 'Plan', tour_plan_x: 'Here you see how far the harvest plan is fulfilled, per species and class.',
      tour_cold_t: 'Cold room', tour_cold_x: 'What is in the cold room and since when. The second tab has the ASF samples.',
      tour_coldRow_t: 'Animal', tour_coldRow_x: 'Tap an animal to record the next step: sample, sent, result, removed.',
      tour_jagden_t: 'Hunts', tour_jagden_x: 'Here you plan driven hunts and look after guests.',
      tour_lovNew_t: 'New driven hunt', tour_lovNew_x: 'You set up a driven hunt with date, ground, stands and participants.',
      tour_lovOpen_t: 'Driven hunt', tour_lovOpen_x: 'On the day you can record the bag here with "{stueck}". The place is the stand.',
      tour_gostNew_t: 'New guest', tour_gostNew_x: 'First add the guest with name and stay. Then enter the dates under the guest and show them the QR code. They scan it and have the app.',
      lblWeapon: 'Rifle', setupAbout: 'Internal app of the Seona Eko hunting ground for the team and hunting guests.', pillServer: 'Server unreachable', subServer: 'The server is not responding — entries stay on the phone and are sent later.', setupServer: 'The server is not responding — the code will be checked on the first send.', btnCopyAddr: 'Copy link', copiedAddr: 'Link copied.', sleLeft: 'SLE · {n} d left', sleToday: 'SLE · today', sleLate: 'SLE · overdue', sleChip: 'For SLE ({n})', sleHint: 'Data as the SLE asks for it: tag, date, species, sex, age. Deadline: 7 days after the kill. Tap the tag number to copy it.', sleEmpty: 'Everything is entered in the SLE.', sleDone: 'Entered in SLE', sleUndo: 'Not entered in SLE after all', sleDoneToast: 'Marked as entered in the SLE.', sleUndoToast: 'Undone: not yet in the SLE.', sleCopied: 'Tag {m} copied.', sleLabel: 'SLE', sleDoneOn: 'entered {d}', sleOpenTxt: 'not entered yet', homeSle: '{n} animals to enter in the SLE', homeSleHint: 'Shortest deadline: {n} d left', homeSleToday: 'Deadline is today', homeSleLate: 'Deadline has passed', klasaDob: 'Age', setupWelcome: 'Welcome to the hunting ground.', btnScanQr: 'Scan QR code', setupOr: 'or enter the code', scanHint: 'Hold the QR code inside the frame.', scanNoCamera: 'No camera available. Please type the code.', scanForeign: 'This is not a Seona Eko QR code.', weaponOwn: 'Own', weaponLoan: 'Loan', guestCodeHint: 'On an iPhone: install the app, then tap “Scan QR code” in it or type the code.',
      tour_vise_t: 'More', tour_vise_x: 'Here you find seasons, weather, transfer, map and language.',
      tour_viseMap_t: 'Save map', tour_viseMap_x: 'Download the map here once and it works without signal.',
      tour_viseTeam_t: 'Team phone', tour_viseTeam_x: 'If someone in the team needs the app, show them this QR code.',
      tour_viseTour_t: 'Tour', tour_viseTour_x: 'You can watch this tour again here at any time.',
      tour_ende_t: 'Done', tour_ende_x: 'That’s it. Good hunting!'
    },
    de: {
      instTitle: 'App installieren', instText: 'Nur die installierte App funktioniert ohne Netz und verliert keine Einträge.',
      instIos1: 'Unten in Safari auf Teilen tippen (Quadrat mit Pfeil).', instIos2: '„Zum Home-Bildschirm" wählen.', instIos3: 'Seona Eko vom Home-Bildschirm aus öffnen.',
      instAndroid: 'App installieren', instAndroidManual: 'In Chrome: Menü ⋮ → „App installieren" (oder „Zum Startbildschirm hinzufügen").',
      instInApp: 'Sie haben den Link in WhatsApp geöffnet. Bitte im Browser öffnen: Menü ⋮ oder ••• → „Im Browser öffnen" (iPhone: Safari).',
      instLater: 'Im Browser weiter',
      mapAutoSaving: 'Karte wird für den Offline-Betrieb gespeichert… {p} %', mapAutoDone: 'Karte gespeichert — funktioniert auch ohne Netz.',
      errKlasa: 'Bitte die Altersklasse wählen.', btnNoAnomalies: 'Ohne Auffälligkeiten',
      homeStale: '{n} Eintrag/Einträge warten seit über einem Tag auf das Senden', homeStaleHint: 'App dort öffnen, wo Empfang ist, oder die Verwaltung anrufen.',
      teamQrTitle: 'Handy für Team-Mitglied einrichten', teamQrSub: 'QR-Code mit dem Team-Code', teamQrHint: 'Das Team-Mitglied scannt den Code mit der Handykamera — die App öffnet sich fertig eingerichtet.',
      teamQrWarn: 'Nur persönlich zeigen — nicht als Bild verschicken.', teamCodeLbl: 'Oder Code abtippen:',
      setupQrHint: 'Der Code steht auch unter dem QR-Code.',
      storno: 'Stornieren', stornoTitle: 'Abschuss stornieren?', stornoText: 'Der Eintrag bleibt als Beleg erhalten, zählt aber nicht mehr in Strecke, Plan und Kühlzelle.',
      stornoReason: 'Grund', stornoR1: 'Doppelt erfasst', stornoR2: 'Falsche Angaben', stornoR3: 'Test', errStornoReason: 'Bitte einen Grund wählen oder eintragen.', stornoDone: 'Abschuss storniert.', qStorno: 'Storno',
      
      
      needOnline: 'Dafür wird Internet benötigt.',
      lblVrhovi: 'Geweih — Enden gesamt', hintVrhovi: 'z. B. 12 = Zwölfender', lblLopata: 'Geweih (Schaufel)', lblRogovlje: 'Geweih',
      errVrhovi: 'Bitte die Zahl der Enden eintragen.', errLopata: 'Bitte die Geweihstufe (Schaufel) wählen.',
      trofejTitle: 'Trophäenbewertung (nach der Bewertung)', lblTrofejMasa: 'Gewicht (kg)', lblCic: 'CIC-Punkte', confirmDiscardEdit: 'Diese Korrektur ist noch nicht gesendet. Verwerfen? Der Abschuss bleibt wie vorher.',
      tutSkip: 'Überspringen', tutNext: 'Weiter', tutStart: 'Los geht’s', tutReplay: 'Tour', tutReplaySub: 'Alle Seiten, Schritt für Schritt',
      tour_start_t: 'Kurz zur App', tour_start_x: 'Die App soll Ihnen die Arbeit erleichtern und bei der Organisation helfen: Abschüsse, Kühlzelle, Einrichtungen und Jagden an einem Ort. Die Tour zeigt Ihnen kurz, wo Sie was finden.',
      tour_home_t: 'Start', tour_home_x: 'Hier sehen Sie den Tag auf einen Blick: Wetter, Jagdzeiten, Strecke, Kühlzelle, nächste Drückjagd, nächster Gast und die letzten Einträge.',
      tour_homeNew_t: '{neu}', tour_homeNew_x: 'Über diesen Knopf erfassen Sie ein erlegtes Stück. Das geht auch ohne Empfang.',
      tour_homeQuick_t: 'Schnellzugriff', tour_homeQuick_x: 'Von hier kommen Sie direkt zum Eintragen einer Einrichtung oder zu den Jagdzeiten.',
      tour_sync_t: 'Senden', tour_sync_x: 'Hier sehen Sie, ob alles übertragen ist. Darum müssen Sie sich nicht kümmern: Die App überträgt von selbst, sobald Empfang da ist.',
      tour_formArt_t: 'Wildart', tour_formArt_x: 'Dieses Formular öffnet sich nach „{neu}". Sie beginnen mit Wildart und Geschlecht.',
      tour_formKlasa_t: 'Klasse', tour_formKlasa_x: 'Jungtier, Jährling oder älter. Bei älteren Stücken zusätzlich jung, mittel oder reif wählen, wie im Abschussplan.',
      tour_formOrt_t: 'Ort', tour_formOrt_x: 'Am Anschuss genügt „{standort}". Tragen Sie später ein, etwa an der Kühlzelle, wählen Sie den Ort mit „{karte}".',
      tour_formCold_t: 'Kühlzelle', tour_formCold_x: 'Kommt das Stück in die Kühlzelle, Haken gesetzt lassen. Es steht dann gleich in der Kühlzellen-Liste.',
      tour_formSave_t: 'Speichern', tour_formSave_x: 'Gewicht, Wildmarke und Schütze dazu, dann speichern. Ohne Empfang wartet der Eintrag und geht später von selbst raus.',
      tour_karta_t: 'Karte', tour_karta_x: 'Die Feldkarte mit Wegen, Höhenlinien und Abteilungen. Sie funktioniert auch ohne Empfang.',
      tour_kartaGps_t: 'Standort', tour_kartaGps_x: 'Tippen Sie hier, folgt die Karte Ihrem Standort; der blaue Kegel zeigt Ihre Blickrichtung. Sobald Sie die Karte verschieben, hört das Folgen auf.',
      tour_kartaWind_t: 'Wind', tour_kartaWind_x: 'In der Mitte die Windstärke, die Marke am Rand zeigt, woher der Wind kommt; der Kupferpunkt ist Norden. Nach „Mein Standort“ dreht sich die Scheibe mit dem Handy: Marke oben = Wind von vorn. Antippen öffnet das Wetter.',
      tour_kartaAdd_t: 'Einrichtung eintragen', tour_kartaAdd_x: 'Mit dem Plus können Sie eine Einrichtung eintragen: Fadenkreuz auf die Stelle, Art wählen, speichern.',
      tour_kartaLayer_t: 'Ebenen', tour_kartaLayer_x: 'Hier blenden Sie Einrichtungen, Abschussorte und Abteilungen ein oder aus.',
      tour_kartaFull_t: 'Vollbild', tour_kartaFull_x: 'Für mehr Überblick zeigt dieser Knopf die Karte auf dem ganzen Bildschirm.',
      tour_strecke_t: 'Strecke', tour_strecke_x: 'Hier finden Sie alle Abschüsse des Jagdjahres. Oben wechseln Sie zwischen Liste, Plan und Kühlzelle.',
      tour_streckeFilter_t: 'Filter', tour_streckeFilter_x: 'Wenn Sie nur ein Revier oder eine Wildart sehen möchten, filtern Sie hier.',
      tour_streckeRow_t: 'Eintrag', tour_streckeRow_x: 'Ein Eintrag lässt sich antippen: Sie sehen die Details und können ihn korrigieren oder stornieren.',
      tour_plan_t: 'Plan', tour_plan_x: 'Hier sehen Sie, wie weit der Abschussplan erfüllt ist, je Wildart und Klasse.',
      tour_cold_t: 'Kühlzelle', tour_cold_x: 'Was in der Zelle liegt und seit wann. Im zweiten Reiter finden Sie die ASP-Proben.',
      tour_coldRow_t: 'Stück', tour_coldRow_x: 'Tippen Sie ein Stück an, um den nächsten Schritt festzuhalten: Probe, verschickt, Befund, entnommen.',
      tour_jagden_t: 'Jagden', tour_jagden_x: 'Hier planen Sie Drückjagden und betreuen Gäste.',
      tour_lovNew_t: 'Neue Drückjagd', tour_lovNew_x: 'Eine Drückjagd legen Sie mit Datum, Revier, Ständen und Teilnehmern an.',
      tour_lovOpen_t: 'Drückjagd', tour_lovOpen_x: 'Am Jagdtag können Sie hier mit „{stueck}" die Strecke aufnehmen. Als Ort gilt der Stand.',
      tour_gostNew_t: 'Neuer Gast', tour_gostNew_x: 'Legen Sie zuerst den Gast an, mit Name und Aufenthalt. Danach tragen Sie beim Gast die Termine ein und zeigen ihm den QR-Code. Er scannt ihn und hat die App.',
      lblWeapon: 'Waffe', setupAbout: 'Interne App des Reviers Seona Eko für Team und Jagdgäste.', pillServer: 'Server nicht erreichbar', subServer: 'Der Server antwortet gerade nicht — Einträge bleiben auf dem Handy und werden später gesendet.', setupServer: 'Der Server antwortet gerade nicht — der Code wird beim ersten Senden geprüft.', btnCopyAddr: 'Link kopieren', copiedAddr: 'Link kopiert.', sleLeft: 'SLE · noch {n} T.', sleToday: 'SLE · heute', sleLate: 'SLE · überfällig', sleChip: 'Für SLE ({n})', sleHint: 'Angaben so, wie die SLE sie abfragt: Marke, Datum, Wildart, Geschlecht, Alter. Frist: 7 Tage nach dem Abschuss. Markennummer antippen zum Kopieren.', sleEmpty: 'Alles ist in der SLE eingetragen.', sleDone: 'In SLE eingetragen', sleUndo: 'Doch nicht in der SLE', sleDoneToast: 'Als in der SLE eingetragen markiert.', sleUndoToast: 'Zurückgesetzt: noch nicht in der SLE.', sleCopied: 'Marke {m} kopiert.', sleLabel: 'SLE', sleDoneOn: 'eingetragen am {d}', sleOpenTxt: 'noch nicht eingetragen', homeSle: '{n} Stück noch in die SLE eintragen', homeSleHint: 'Kürzeste Frist: noch {n} T.', homeSleToday: 'Frist endet heute', homeSleLate: 'Frist ist abgelaufen', klasaDob: 'Alter', setupWelcome: 'Willkommen im Revier.', btnScanQr: 'QR-Code scannen', setupOr: 'oder Code eingeben', scanHint: 'QR-Code in den Rahmen halten.', scanNoCamera: 'Keine Kamera verfügbar. Bitte den Code eintippen.', scanForeign: 'Das ist kein QR-Code für Seona Eko.', weaponOwn: 'Eigene', weaponLoan: 'Leihwaffe', guestCodeHint: 'Auf dem iPhone: App installieren, dann darin „QR-Code scannen“ tippen oder den Code eingeben.',
      tour_vise_t: 'Mehr', tour_vise_x: 'Hier finden Sie Jagdzeiten, Wetter, Übertragung, Karte und Sprache.',
      tour_viseMap_t: 'Karte speichern', tour_viseMap_x: 'Laden Sie die Karte hier einmal herunter, dann funktioniert sie ohne Empfang.',
      tour_viseTeam_t: 'Team-Handy', tour_viseTeam_x: 'Braucht jemand im Team die App, zeigen Sie ihm diesen QR-Code.',
      tour_viseTour_t: 'Tour', tour_viseTour_x: 'Hier können Sie diese Tour jederzeit wieder ansehen.',
      tour_ende_t: 'Fertig', tour_ende_x: 'Das war’s. Waidmannsheil!'
    }
  };
  Object.keys(ADD).forEach(function (l) { Object.keys(ADD[l]).forEach(function (k) { S[l][k] = ADD[l][k]; }); });

  var SPECIES = {
    'Jelen obični': ['Jelen obični', 'Red deer', 'Rotwild'], 'Srna': ['Srna', 'Roe deer', 'Rehwild'],
    'Divlja svinja': ['Divlja svinja', 'Wild boar', 'Schwarzwild'], 'Jelen lopatar': ['Jelen lopatar', 'Fallow deer', 'Damwild'],
    'Muflon': ['Muflon', 'Mouflon', 'Muffelwild'], 'Ostalo': ['Ostale vrste', 'Other species', 'Andere Arten']
  };
  // Anzeige der Altersklassen (gespeichert wird immer der kroatische Sheet-Wert, siehe js/data/plan.js)
  var KLASE = {
    'Tele/prase': ['Mladunčad', 'Young of the year', 'Jungtier'], 'Pomladak': ['Pomladak', 'Yearling', 'Jährling'],
    'Mlađa klasa': ['Mlada klasa', 'Young class', 'Jugendklasse'], 'Srednja klasa': ['Srednja klasa', 'Middle class', 'Mittelklasse'],
    'Zrela klasa': ['Zrela klasa', 'Mature class', 'Reife Klasse']
  };
  /** Erste Zeile im Formular, solange noch kein Geschlecht gewählt ist: Jungtier und Jährling je Wildart. */
  var KLASA_TELE = {
    'Jelen obični': ['Tele', 'Calf', 'Kalb'], 'Jelen lopatar': ['Tele', 'Calf', 'Kalb'], 'Srna': ['Lane', 'Kid', 'Kitz'],
    'Divlja svinja': ['Prase', 'Piglet', 'Frischling'], 'Muflon': ['Janje', 'Lamb', 'Lamm'], '*': ['Mladunče', 'Young', 'Jungtier']
  };
  var KLASA_POMLADAK = {
    'Jelen obični': ['Šilaš / junica', 'Yearling', 'Schmalspießer / Schmaltier'], 'Jelen lopatar': ['Šilaš / junica', 'Pricket / yearling doe', 'Spießer / Schmaltier'],
    'Srna': ['Jednogodišnje grlo', 'Yearling', 'Jährling / Schmalreh'], 'Divlja svinja': ['Nazime', 'Yearling', 'Überläufer'],
    'Muflon': ['Jednogodišnje grlo', 'Yearling', 'Jährling'], '*': ['Jednogodišnje grlo', 'Yearling', 'Jährling']
  };
  var KLASA_STARIJE = ['Starije', 'Older', 'Älter'];
  /** Zweite Zeile (nur Arten mit LGO-Plan): mladi · srednji · zreli. */
  var KLASA_STUFE2 = {
    'Mlađa klasa': ['Mlada', 'Young', 'Jung'], 'Srednja klasa': ['Srednja', 'Middle-aged', 'Mittel'], 'Zrela klasa': ['Zrela', 'Mature', 'Reif']
  };
  var STUFE2 = ['Mlađa klasa', 'Srednja klasa', 'Zrela klasa'];
  /** Lebensjahre einer Klasse, z. B. „3.–4. Lj.“ · „3.–4. god.“ · „yr 3–4“; ab-Klasse „ab 8. Lj.“ · „od 8. god.“ · „yr 8+“. */
  function godine(vrsta, v) {
    var g = (typeof KLASE_GODINE !== 'undefined' ? KLASE_GODINE : {})[vrsta], i = STUFE2.indexOf(v);
    if (!g || i === -1) return '';
    var a = g[i][0], b = g[i][1];
    if (lang === 'en') return 'yr ' + a + (b == null ? '+' : b !== a ? '–' + b : '');
    var unit = lang === 'de' ? ' Lj.' : ' god.';
    if (b == null) return (lang === 'de' ? 'ab ' : 'od ') + a + '.' + unit;
    return a + '.' + (b !== a ? '–' + b + '.' : '') + unit;
  }
  function imaStufe2(vrsta) { return !!(typeof KLASE_GODINE !== 'undefined' ? KLASE_GODINE : {})[vrsta]; }
  /** Bezeichnung einer Klasse für Anzeige und Plan: „Kalb“, „Schmalspießer / Schmaltier“, „Jung (3.–4. Lj.)“ … */
  function klasaFor(vrsta, v) {
    if (!v) return '—';
    if (v === 'Tele/prase') return (KLASA_TELE[vrsta] || KLASA_TELE['*'])[idx()];
    if (v === 'Pomladak') return (KLASA_POMLADAK[vrsta] || KLASA_POMLADAK['*'])[idx()];
    if (STUFE2.indexOf(v) !== -1) {
      if (!imaStufe2(vrsta)) return KLASA_STARIJE[idx()];
      return KLASA_STUFE2[v][idx()] + ' (' + godine(vrsta, v) + ')';
    }
    return pick(KLASE, v);
  }

  var NACINI = {
    'Dočeka (usjedanje)': ['Dočeka (čeka)', 'High seat / stand', 'Ansitz'], 'Prigon/pogon': ['Prigon / pogon', 'Driven hunt', 'Drückjagd'],
    'Šuljanje': ['Šuljanje', 'Stalking', 'Pirsch'], 'Uginula divljač': ['Uginula divljač', 'Found dead / roadkill', 'Fallwild']
  };
  var OBJEKTI = {
    kanzel: ['Zatvorena čeka', 'Closed high seat', 'Kanzel'], leiter: ['Otvorena čeka', 'Ladder stand', 'Leiter'],
    drueckjagdbock: ['Stajalište za pogon', 'Drive-hunt stand', 'Drückjagdbock'], bodensitz: ['Prizemna čeka', 'Ground blind', 'Bodensitz'],
    kirrung: ['Hranilište (mamac)', 'Baiting site', 'Kirrung'], salzlecke: ['Solište', 'Salt lick', 'Salzlecke'],
    suhle: ['Kaljužište', 'Wallow', 'Suhle'], fuetterung: ['Hranilište (prihrana)', 'Feeder', 'Fütterung'],
    schranke: ['Rampa', 'Barrier', 'Schranke'], kamera: ['Foto-zamka', 'Trail camera', 'Wildkamera'],
    zentrale: ['Uprava', 'Headquarters', 'Zentrale'], jagdhuette: ['Lovačka kuća', 'Hunting lodge', 'Jagdhütte']
  };
  var STANJA = {
    dobro: ['Dobro', 'Good', 'Gut'], popravak: ['Za popravak', 'Needs repair', 'Reparaturbedürftig'],
    neupotrebljivo: ['Neupotrebljivo', 'Unusable', 'Nicht benutzbar'], uklonjen: ['Uklonjeno', 'Removed', 'Abgebaut']
  };
  // Damhirsch: beschreibende Stufen (die deutschen Schaufelstufen haben keine festen kroatischen Namen); Sheet-Wert = HR
  var LOPATA = {
    'Šilaš': ['Šilaš', 'Pricket (spikes)', 'Spießer'], 'Bez lopate': ['Bez lopate', 'No palm yet', 'Knieper'],
    'Početna lopata': ['Početna lopata', 'Beginning palm', 'Löffler / Halbschaufler'], 'Puna lopata': ['Puna lopata', 'Full palm', 'Schaufler']
  };
  var NALAZ = { ceka: ['čeka', 'pending', 'ausstehend'], negativan: ['negativan', 'negative', 'negativ'], pozitivan: ['POZITIVAN', 'POSITIVE', 'POSITIV'] };

  var lang = 'hr';
  try {
    var saved = localStorage.getItem('seona_lang');
    if (saved && S[saved]) lang = saved;
    else if (/^de/i.test(navigator.language)) lang = 'de';
    else if (/^en/i.test(navigator.language)) lang = 'en';
  } catch (e) {}
  document.documentElement.lang = lang;

  function idx() { return { hr: 0, en: 1, de: 2 }[lang]; }
  function pick(table, key) { var r = table[key]; return r ? r[idx()] : (key || ''); }

  function t(key, vars) {
    var s = (S[lang] && S[lang][key]);
    if (s == null) s = S.hr[key];
    if (s == null) s = key;
    if (vars) Object.keys(vars).forEach(function (k) { s = s.split('{' + k + '}').join(vars[k]); });
    return s;
  }

  function apply(root) {
    (root || document).querySelectorAll('[data-i18n]').forEach(function (el) { el.textContent = t(el.getAttribute('data-i18n')); });
    (root || document).querySelectorAll('[data-i18n-ph]').forEach(function (el) { el.placeholder = t(el.getAttribute('data-i18n-ph')); });
  }

  return {
    t: t, apply: apply,
    lang: function () { return lang; },
    setLang: function (l) { if (!S[l]) return; lang = l; document.documentElement.lang = l; try { localStorage.setItem('seona_lang', l); } catch (e) {} },
    locale: function () { return { hr: 'hr-HR', en: 'en-GB', de: 'de-DE' }[lang]; },
    species: function (v) { return pick(SPECIES, v); },
    klasa: function (v) { return v ? pick(KLASE, v) : '—'; },
    klasaFor: klasaFor, godine: godine, imaStufe2: imaStufe2,
    klasaTele: function (vrsta) { return (KLASA_TELE[vrsta] || KLASA_TELE['*'])[idx()]; },
    klasaPomladak: function (vrsta) { return (KLASA_POMLADAK[vrsta] || KLASA_POMLADAK['*'])[idx()]; },
    klasaStarije: function () { return KLASA_STARIJE[idx()]; },
    klasaStufe2: function (v) { return KLASA_STUFE2[v] ? KLASA_STUFE2[v][idx()] : ''; },
    nacin: function (v) { return v ? pick(NACINI, v) : ''; },
    objekt: function (v) { return pick(OBJEKTI, v); },
    stanje: function (v) { return pick(STANJA, v || 'dobro'); },
    nalaz: function (v) { return pick(NALAZ, v); },
    lopata: function (v) { return v ? pick(LOPATA, v) : ''; },
    LOPATA_STUFEN: Object.keys(LOPATA),
    _dict: S
  };
})();
