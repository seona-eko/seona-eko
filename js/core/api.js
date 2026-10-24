/**
 * Aufruf der Apps-Script-JSON-Schnittstelle (webapp/Code.gs::doPost).
 *
 * Content-Type text/plain ist Absicht: damit ist der Request ein "simple request" ohne
 * CORS-Preflight — Apps Script beantwortet keine OPTIONS-Anfragen. Apps Script leitet
 * per 302 auf script.googleusercontent.com um; fetch folgt dem automatisch.
 *
 * Fehlerarten (err.kind):
 *  - 'network':   kein Netz / Zeitüberschreitung → Änderung bleibt in der Outbox, später erneut
 *  - 'unavailable': Netz da, aber der Server antwortet nicht mit App-Daten (HTTP-Fehler, Google-Fehlerseite,
 *                 z. B. gesperrte oder falsch bereitgestellte Web-App) → wie 'network', aber eigene Anzeige
 *  - 'busy':      Server gerade beschäftigt → wie Netzfehler, später erneut
 *  - 'auth':      falscher Code → Nutzer muss den Code ändern
 *  - 'forbidden': Rolle reicht nicht (Jäger-Code für Verwaltungsaktion)
 *  - 'config':    API_URL nicht eingetragen
 *  - 'server':    Server hat die Änderung abgelehnt (z. B. Pflichtfeld fehlt)
 */
var API = (function () {
  function ApiError(kind, message) {
    var e = new Error(message || kind);
    e.kind = kind;
    return e;
  }

  function call(action, code, payload, timeoutMs) {
    var url = (window.APP_CONFIG && APP_CONFIG.API_URL) || '';
    // http://localhost nur für lokale Tests gegen einen Mock-Server.
    if (!/^(https:\/\/|http:\/\/(localhost|127\.0\.0\.1)[:/])/.test(url)) {
      return Promise.reject(ApiError('config', 'API_URL nije postavljen (config.js).'));
    }

    var controller = ('AbortController' in window) ? new AbortController() : null;
    var timer = controller ? setTimeout(function () { controller.abort(); }, timeoutMs || 30000) : null;

    return fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'text/plain;charset=utf-8' },
      body: JSON.stringify({ action: action, code: code, payload: payload || null }),
      redirect: 'follow',
      signal: controller ? controller.signal : undefined
    }).then(function (res) {
      if (!res.ok) throw ApiError('unavailable', 'HTTP ' + res.status);
      return res.text();
    }, function (err) {
      throw ApiError('network', err && err.message);
    }).then(function (text) {
      var data;
      try { data = JSON.parse(text); } catch (e) {
        // Apps Script liefert bei Ausnahmen oder falscher Bereitstellung eine HTML-Seite.
        throw ApiError('unavailable', 'Neočekivan odgovor poslužitelja.');
      }
      if (data && data.ok === false) {
        if (data.busy) throw ApiError('busy', data.error); // Sperre belegt (mehrere Handys gleichzeitig) → später erneut
        var kind = data.errorKind === 'auth' ? 'auth' : data.errorKind === 'forbidden' ? 'forbidden' : 'server';
        throw ApiError(kind, data.error);
      }
      return data;
    }).finally(function () {
      if (timer) clearTimeout(timer);
    });
  }

  return { call: call };
})();
