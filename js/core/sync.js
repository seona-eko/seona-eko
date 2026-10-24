/**
 * Sendet die Outbox. Alle Einträge ohne Foto gehen in EINEM Aufruf ('batch', mit frischem Stand als Antwort) —
 * jeder Apps-Script-Aufruf kostet 1–3 s Anlaufzeit. Einträge mit Foto danach einzeln, damit ein großes Foto
 * bei schwachem Netz nichts anderes aufhält.
 *
 * Outbox-Eintrag: { key, kind: 'submit'|'upsert', entity, data, createdAt, status, error, rev }
 *  - submit: neuer Abschuss (append-only, Server erkennt Dubletten an data.id)
 *  - upsert: Einrichtung, Drückjagd, Wildbret, Korrektur — key = entity + ':' + data.id, damit
 *            mehrere Änderungen am selben Datensatz zu einer zusammenfallen
 *
 * Ein Eintrag wird nur gelöscht, wenn der Server ok:true meldet — und nur, wenn er während des Sendens nicht
 * weiter geändert wurde (rev). Die bestätigte Fassung kommt vorher per Store.confirm in den Datenstand.
 *  - Netzfehler / Server nicht erreichbar / beschäftigt: Abbruch, alles bleibt liegen (App versucht es von selbst wieder)
 *  - Auth-Fehler: Abbruch, App fordert neuen Code an
 *  - abgelehnt / keine Berechtigung: Eintrag bekommt Fehlertext, die übrigen gehen weiter
 *  - "stale": Server hatte einen neueren Stand — der gewinnt, Eintrag gilt als erledigt
 */
var Sync = (function () {
  var running = null;
  var listeners = [];

  function notify(state) {
    listeners.forEach(function (fn) { try { fn(state); } catch (e) {} });
  }

  function hasPhoto(entry) { return !!(entry.data && (entry.data.foto || entry.data.fotoNew)); }

  /** opts.pull: frischen Stand mitbringen (nur im Sammelaufruf; sonst ruft die App Store.refresh). */
  function run(opts) {
    if (running) return running;
    opts = opts || {};
    running = (async function () {
      var result = { sent: [], warnings: [], stale: [], networkError: false, unavailable: false, authError: false, configError: false, busy: false, pull: null, pullStartedAt: 0 };
      var code = await DB.get('code');
      if (!code) { result.authError = true; return result; }
      var device = (await DB.get('device')) || '';

      var list = await DB.outboxAll();
      if (!list.length) return result;
      notify({ syncing: true });

      async function done(entry, res) {
        Store.confirm(entry, res);
        var cur = await DB.outboxGet(entry.key);
        if (cur && cur.rev !== entry.rev) {
          // während des Sendens weiter geändert → bleibt liegen; ein Abschuss ist jetzt angekommen, also als Korrektur
          if (cur.kind === 'submit') { cur.kind = 'upsert'; await DB.outboxPut(cur); }
        } else {
          await DB.outboxDelete(entry.key);
        }
        result.sent.push(entry.key);
        if (res.warning) result.warnings.push(res.warning);
        if (res.stale) result.stale.push(entry.key);
      }
      async function rejected(entry, message) {
        entry.status = 'error';
        entry.error = message || 'Greška';
        var cur = await DB.outboxGet(entry.key);
        if (cur && cur.rev === entry.rev) await DB.outboxPut(entry);
      }
      /** false = abbrechen (Netz, Code, Server beschäftigt) */
      function stop(err) {
        if (err.kind === 'network') { result.networkError = true; return true; }
        if (err.kind === 'unavailable') { result.unavailable = true; return true; }
        if (err.kind === 'busy') { result.busy = true; return true; }
        if (err.kind === 'auth') { result.authError = true; return true; }
        if (err.kind === 'config') { result.configError = true; return true; }
        return false;
      }
      async function sendOne(entry) {
        try {
          var res = entry.kind === 'submit'
            ? await API.call('submit', code, Object.assign({}, entry.data, { uredjaj: device }), hasPhoto(entry) ? 90000 : 30000)
            : await API.call('upsert', code, { entity: entry.entity, data: entry.data, uredjaj: device }, hasPhoto(entry) ? 90000 : 30000);
          await done(entry, res);
          return true;
        } catch (err) {
          if (stop(err)) return false;
          await rejected(entry, err.message);
          return true;
        }
      }

      var plain = list.filter(function (e) { return !hasPhoto(e); });
      var photos = list.filter(hasPhoto);
      var single = [];
      if (plain.length) {
        try {
          result.pullStartedAt = Date.now();
          var b = await API.call('batch', code, {
            uredjaj: device, pull: !!opts.pull,
            items: plain.map(function (e) { return { key: e.key, kind: e.kind, entity: e.entity, data: e.data }; })
          }, 60000);
          var byKey = {};
          (b.results || []).forEach(function (r) { byKey[r.key] = r; });
          for (var i = 0; i < plain.length; i++) {
            var r = byKey[plain[i].key];
            if (!r || r.busy) { result.busy = true; continue; }
            if (r.ok) await done(plain[i], r);
            else await rejected(plain[i], r.error);
          }
          if (b.pull) result.pull = b.pull;
        } catch (err) {
          // Ältere Server-Bereitstellung ohne 'batch' → wie bisher einzeln
          if (err.kind === 'server' && /Nepoznata radnja/.test(err.message || '')) single = plain;
          else if (stop(err)) return result;
          else single = plain;
        }
      }
      var queue = single.concat(photos);
      for (var j = 0; j < queue.length; j++) {
        if (!(await sendOne(queue[j]))) break;
      }
      if (result.sent.length) {
        await Store.persist();
        await DB.set('lastSync', Date.now());
      }
      return result;
    })().finally(function () {
      running = null;
      notify({ syncing: false });
    });
    return running;
  }

  return {
    run: run,
    isRunning: function () { return !!running; },
    onChange: function (fn) { listeners.push(fn); }
  };
})();
