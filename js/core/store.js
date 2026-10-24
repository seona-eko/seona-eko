/**
 * Datenstand der App = letzter Abruf vom Server ("pull", in kv gespeichert) + noch wartende
 * Änderungen aus der Outbox darübergelegt. So ist alles, was offline erfasst wurde, sofort in
 * Listen, Statistik und Karte sichtbar — als "čeka slanje" markiert.
 */
var Store = (function () {
  var snap = null;        // { strecke, objekti, lovovi, wildbret, lovci, lovista, jagdjahr…, at }
  var outbox = [];
  var listeners = [];
  var pulling = null;

  function emit() { listeners.forEach(function (fn) { try { fn(); } catch (e) { console.error(e); } }); }

  function uuid() {
    if (window.crypto && crypto.randomUUID) return crypto.randomUUID();
    var b = crypto.getRandomValues(new Uint8Array(16));
    b[6] = (b[6] & 0x0f) | 0x40; b[8] = (b[8] & 0x3f) | 0x80;
    var h = Array.prototype.map.call(b, function (x) { return x.toString(16).padStart(2, '0'); }).join('');
    return h.slice(0, 8) + '-' + h.slice(8, 12) + '-' + h.slice(12, 16) + '-' + h.slice(16, 20) + '-' + h.slice(20);
  }

  async function load() {
    snap = (await DB.get('pull')) || null;
    outbox = await DB.outboxAll();
    emit();
  }

  async function reloadOutbox() {
    outbox = await DB.outboxAll();
    emit();
  }

  /** Holt alles vom Server. Gibt 'ok' | 'offline' | 'auth' | 'config' | 'error' zurück. */
  function refresh() {
    if (pulling) return pulling;
    pulling = (async function () {
      var code = await DB.get('code');
      if (!code) return 'auth';
      var startedAt = Date.now();
      try {
        var res = await API.call('pull', code, { gostId: (await DB.get('gostId')) || '', lang: I18n.lang() }, 45000);
        await applyPull(res, startedAt);
        return 'ok';
      } catch (err) {
        return err.kind === 'network' ? 'offline' : err.kind || 'error';   // 'unavailable' = Server antwortet nicht richtig
      }
    })().finally(function () { pulling = null; });
    return pulling;
  }

  /* ---------- Bestätigte Änderungen ----------
   * Hat der Server eine Änderung angenommen, kommt sie sofort in den Datenstand — nicht erst mit dem nächsten Abruf.
   * Sonst wäre sie kurz weder in der Outbox noch im alten Stand (Eintrag verschwindet und kommt wieder).
   * Ein Abruf, der schon vor der Bestätigung lief, überschreibt sie nicht: solche Änderungen bleiben darübergelegt. */
  var SNAP_KEY = { objekt: 'objekti', lov: 'lovovi', wildbret: 'wildbret', gost: 'gosti', ansitz: 'ansitzi', odstrjel: 'strecke' };
  var confirmed = {}; // outbox-key → { entity, id, rec (null = entfernt), at }

  function putInSnap(entity, id, rec) {
    var k = SNAP_KEY[entity];
    if (!k) return;
    if (!snap) snap = {};
    var list = (snap[k] || []).filter(function (r) { return String(r.id) !== String(id); });
    if (rec) list.push(rec);
    snap[k] = list;
  }
  function inSnap(entity, id) {
    return ((snap && snap[SNAP_KEY[entity]]) || []).filter(function (r) { return String(r.id) === String(id); })[0] || null;
  }

  /** entry = Outbox-Eintrag, res = Antwort des Servers ({ ok, record?, stale?, current?, storno? }). Ohne emit. */
  function confirm(entry, res) {
    var d = entry.data || {}, id = d.id, entity = entry.entity, rec;
    res = res || {};
    if (entry.kind === 'submit') {
      rec = Object.assign({}, d, { imaFoto: !!d.foto, lfdNr: res.lfdNr || '' });
      delete rec.foto; delete rec.uredjaj;
    } else if (res.stale && res.current) rec = res.current;
    else if (res.record) rec = res.record;
    else rec = Object.assign({}, inSnap(entity, id) || {}, d);
    delete rec.fotoNew; delete rec.updatedBy;
    if (rec.deleted === true || rec.deleted === 'TRUE' || (entity === 'odstrjel' && (res.storno || rec.storno))) rec = null;
    putInSnap(entity, id, rec);
    confirmed[entry.key] = { entity: entity, id: id, rec: rec, at: Date.now() };
    // Storniert: auch der Kühlzellen-Eintrag ist weg
    if (entity === 'odstrjel' && !rec) {
      putInSnap('wildbret', id, null);
      confirmed['wildbret:' + id] = { entity: 'wildbret', id: id, rec: null, at: Date.now() };
    }
  }

  /** Neuer Stand vom Server; startedAt = Zeitpunkt, zu dem der Abruf begann. */
  async function applyPull(res, startedAt) {
    res = Object.assign({}, res);
    delete res.ok;
    res.at = Date.now();
    snap = res;
    Object.keys(confirmed).forEach(function (k) {
      var c = confirmed[k];
      if (c.at < startedAt) { delete confirmed[k]; return; } // Abruf begann danach → Server hat es schon
      putInSnap(c.entity, c.id, c.rec);
    });
    await DB.set('pull', snap);
    if (res.role) await DB.set('role', res.role);
    emit();
  }

  async function persist() { if (snap) await DB.set('pull', snap); }

  function pendingOf(entity) {
    return outbox.filter(function (e) { return e.entity === entity && e.kind === 'upsert'; });
  }

  function mergeById(base, entity) {
    var map = {};
    (base || []).forEach(function (r) { map[r.id] = Object.assign({}, r); });
    pendingOf(entity).forEach(function (e) {
      var d = e.data;
      map[d.id] = Object.assign({}, map[d.id] || {}, d, { _pending: true, _error: e.status === 'error' ? e.error : '' });
      if (d.fotoNew) map[d.id]._fotoLocal = d.fotoNew;
    });
    return Object.keys(map).map(function (k) { return map[k]; }).filter(function (r) { return !r.deleted; });
  }

  function strecke() {
    var list = mergeById(snap && snap.strecke, 'odstrjel');
    // noch nicht gesendete neue Abschüsse
    outbox.filter(function (e) { return e.kind === 'submit'; }).forEach(function (e) {
      if (list.some(function (r) { return r.id === e.data.id; })) return;
      list.push(Object.assign({}, e.data, { _pending: true, _new: true, _error: e.status === 'error' ? e.error : '', imaFoto: !!e.data.foto, _fotoLocal: e.data.foto || '' }));
    });
    // Stornierte Abschüsse zählen nirgends mehr (der Server liefert sie gar nicht erst aus)
    return list.filter(function (r) { return !r.storno; })
      .sort(function (a, b) { return (b.datum || '').localeCompare(a.datum || '') || String(b.vrijeme || '').localeCompare(String(a.vrijeme || '')); });
  }

  /** IDs von Abschüssen mit wartender Stornierung — deren Kühlzellen-Eintrag wird ausgeblendet. */
  function stornoPending() {
    var ids = {};
    pendingOf('odstrjel').forEach(function (e) { if (e.data.storno) ids[e.data.id] = true; });
    return ids;
  }

  function jagdjahr() {
    if (snap && snap.jagdjahrStart) return { start: snap.jagdjahrStart, end: snap.jagdjahrEnd, label: snap.jagdjahr };
    var d = new Date(), y = d.getFullYear(), s = d.getMonth() >= 3 ? y : y - 1;
    return { start: s + '-04-01', end: (s + 1) + '-03-31', label: s + '/' + String(s + 1).slice(2) };
  }

  // Änderungszähler je Outbox-Eintrag: wird während des Sendens weiter geändert, darf der Eintrag nicht gelöscht werden.
  var revN = 0;
  function rev() { return Date.now() + '.' + (++revN); }

  /** Neuer Abschuss → Outbox (kind 'submit'). */
  async function queueSubmit(data) {
    var entry = { key: 'odstrjel:' + data.id, kind: 'submit', entity: 'odstrjel', data: data, createdAt: Date.now(), status: 'pending', rev: rev() };
    await DB.outboxPut(entry);
    await reloadOutbox();
    return entry;
  }

  /** Anlegen/Ändern → Outbox (kind 'upsert'); mehrere Änderungen am selben Datensatz fallen zusammen. */
  async function queueUpsert(entity, data) {
    data = Object.assign({}, data, { updatedAt: Date.now() });
    var key = entity + ':' + data.id;
    var prev = outbox.filter(function (e) { return e.key === key; })[0];
    if (prev && prev.kind === 'submit') {
      // Abschuss noch gar nicht gesendet → direkt im wartenden Eintrag ändern
      prev.data = Object.assign({}, prev.data, data);
      delete prev.data.updatedAt;
      prev.status = 'pending'; prev.error = ''; prev.rev = rev();
      await DB.outboxPut(prev);
    } else {
      var merged = prev ? Object.assign({}, prev.data, data) : data;
      await DB.outboxPut({ key: key, kind: 'upsert', entity: entity, data: merged, createdAt: prev ? prev.createdAt : Date.now(), status: 'pending', rev: rev() });
    }
    await reloadOutbox();
  }

  async function discard(key) {
    var e = outbox.filter(function (x) { return x.key === key; })[0];
    await DB.outboxDelete(key);
    // Neuer Abschuss verworfen → sein wartender Kühlzellen-Eintrag geht mit
    if (e && e.kind === 'submit') await DB.outboxDelete('wildbret:' + e.data.id);
    await reloadOutbox();
  }

  return {
    load: load,
    refresh: refresh,
    applyPull: applyPull,
    confirm: confirm,
    persist: persist,
    reloadOutbox: reloadOutbox,
    onChange: function (fn) { listeners.push(fn); },
    uuid: uuid,
    snapshot: function () { return snap; },
    outbox: function () { return outbox.slice(); },
    strecke: strecke,
    objekti: function () { return mergeById(snap && snap.objekti, 'objekt'); },
    lovovi: function () {
      return mergeById(snap && snap.lovovi, 'lov').sort(function (a, b) { return String(a.datum).localeCompare(String(b.datum)); });
    },
    /** IDs der Stücke, die gerade in der Kühlzelle liegen (ohne Abgleich mit der Strecke). */
    coldIds: function () {
      var ids = {};
      mergeById(snap && snap.wildbret, 'wildbret').forEach(function (w) { if (w.hladnjacaOd && !w.predanoDatum) ids[w.id] = true; });
      return ids;
    },
    /** Kühlzelle: nur Stücke, deren Abschuss in der Strecke steht (gesendet oder wartend). */
    wildbret: function () {
      var map = {}, storno = stornoPending(), ids = {};
      strecke().forEach(function (r) { ids[r.id] = true; });
      mergeById(snap && snap.wildbret, 'wildbret').forEach(function (w) { if (!storno[w.id] && ids[w.id]) map[w.id] = w; });
      return map;
    },
    lovci: function () { return (snap && snap.lovci) || []; },
    kontakti: function () { return (snap && snap.kontakti) || []; },
    gosti: function () { return mergeById(snap && snap.gosti, 'gost').sort(function (a, b) { return String(a.od).localeCompare(String(b.od)); }); },
    ansitzi: function () { return mergeById(snap && snap.ansitzi, 'ansitz'); },
    gostCode: function () { return (snap && snap.gostCode) || ''; },
    /** Gäste: Summen je Lovište/Art/Klasse/Geschlecht (keine Einzelabschüsse). */
    gostCounts: function () { return (snap && snap.counts) || []; },
    lovista: function () { return (snap && snap.lovista && snap.lovista.length) ? snap.lovista : ['XIV/189 Gazije', 'XIV/191 Gornja Motičina', 'XIV/192 Klanac']; },
    quota: function () { return (snap && snap.quotaPerLoviste) || { 'Jelen obični': 8, 'Srna': 4, 'Divlja svinja': 30, 'Jelen lopatar': 9 }; },
    jagdjahr: jagdjahr,
    pulledAt: function () { return snap ? snap.at : 0; },
    queueSubmit: queueSubmit,
    queueUpsert: queueUpsert,
    discard: discard
  };
})();
