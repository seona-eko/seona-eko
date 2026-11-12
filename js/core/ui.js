/** Kleine Oberflächen-Helfer: Escaping, Datumsformat, Toast, Bottom-Sheet, Bestätigung, Foto. */
var UI = (function () {
  function esc(s) {
    return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
    });
  }
  function $(sel, root) { return (root || document).querySelector(sel); }
  function $$(sel, root) { return Array.prototype.slice.call((root || document).querySelectorAll(sel)); }

  function locale() { return { hr: 'hr-HR', en: 'en-GB', de: 'de-DE' }[I18n.lang()] || 'hr-HR'; }

  // input.valueAsDate = new Date() setzt das Datum nach UTC, nicht nach der lokalen Zeitzone —
  // nachts kann dadurch der falsche Tag erscheinen. Deshalb lokal zusammensetzen.
  function todayISO(d) {
    d = d || new Date();
    return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0');
  }
  function nowLocalISO() {
    var d = new Date();
    return todayISO(d) + 'T' + String(d.getHours()).padStart(2, '0') + ':' + String(d.getMinutes()).padStart(2, '0');
  }
  function parseISO(iso) { return iso ? new Date(String(iso).length <= 10 ? iso + 'T12:00:00' : iso) : null; }
  function fmtDate(iso, opts) {
    var d = parseISO(iso);
    if (!d || isNaN(d)) return '';
    return d.toLocaleDateString(locale(), opts || { day: 'numeric', month: 'numeric', year: 'numeric' });
  }
  function fmtDay(iso) { return fmtDate(iso, { weekday: 'short', day: 'numeric', month: 'numeric' }); }
  function fmtLong(d) { return (d || new Date()).toLocaleDateString(locale(), { weekday: 'long', day: 'numeric', month: 'long' }); }
  function fmtTime(d) { return d ? String(d.getHours()).padStart(2, '0') + ':' + String(d.getMinutes()).padStart(2, '0') : '—'; }
  function fmtStamp(ms) { if (!ms) return '—'; var d = new Date(ms); return fmtDate(todayISO(d)) + ' ' + fmtTime(d); }
  /** Ganze Kalendertage zwischen dem Datum (YYYY-MM-DD…) und heute (lokal); heute = 0. */
  function daysSince(iso) {
    if (!iso) return null;
    var p = String(iso).slice(0, 10).split('-');
    if (p.length < 3) return null;
    var d0 = new Date(+p[0], +p[1] - 1, +p[2]), n = new Date();
    var t0 = new Date(n.getFullYear(), n.getMonth(), n.getDate());
    return Math.round((t0 - d0) / 864e5);
  }

  /* ---------- Toast ---------- */
  var toastEl = null, toastTimer = null;
  function toast(msg, opts) {
    opts = opts || {};
    if (toastEl) toastEl.remove();
    toastEl = document.createElement('div');
    toastEl.className = 'toast' + (opts.kind ? ' ' + opts.kind : '');
    toastEl.setAttribute('role', 'status');
    toastEl.innerHTML = '<span style="flex:1">' + esc(msg) + '</span>' + (opts.action ? '<button type="button" class="btn small">' + esc(opts.action) + '</button>' : '');
    document.body.appendChild(toastEl);
    if (opts.action) toastEl.querySelector('button').onclick = function () { opts.onAction && opts.onAction(); hideToast(); };
    clearTimeout(toastTimer);
    if (!opts.sticky) toastTimer = setTimeout(hideToast, opts.timeout || 3500);
  }
  function hideToast() { if (toastEl) { toastEl.remove(); toastEl = null; } }

  /* ---------- Bottom-Sheet ---------- */
  var current = null;
  function openSheet(html, onMount, opts) {
    closeSheet(true);
    var scrim = document.createElement('div');
    scrim.className = 'sheet-scrim';
    var sheet = document.createElement('div');
    sheet.className = 'sheet';
    sheet.setAttribute('role', 'dialog');
    sheet.setAttribute('aria-modal', 'true');
    sheet.innerHTML = '<div class="grip-zone"><div class="grip"></div>' +
      '<button type="button" class="sheet-x" aria-label="' + esc(I18n.t('close')) + '">' + ICONS.close + '</button></div>' + html;
    document.body.appendChild(scrim);
    document.body.appendChild(sheet);
    requestAnimationFrame(function () { scrim.classList.add('show'); sheet.classList.add('show'); });
    var api = { el: sheet, close: function () { closeSheet(); } };
    current = { scrim: scrim, sheet: sheet, onClose: opts && opts.onClose };
    scrim.addEventListener('click', function () { closeSheet(); });
    sheet.querySelector('.sheet-x').addEventListener('click', function () { closeSheet(); });
    swipeToClose(sheet);
    if (onMount) onMount(sheet, api);
    var focusable = sheet.querySelector('input,select,textarea,button');
    if (focusable && !(opts && opts.noFocus)) setTimeout(function () { try { focusable.focus({ preventScroll: true }); } catch (e) {} }, 60);
    return api;
  }
  var closedListeners = [];
  function closeSheet(immediate) {
    if (!current) return;
    var c = current; current = null;
    if (c.onClose) try { c.onClose(); } catch (e) {}
    closedListeners.forEach(function (fn) { try { fn(); } catch (e) {} });
    if (immediate) { c.scrim.remove(); c.sheet.remove(); return; }
    c.sheet.style.transform = '';
    c.scrim.classList.remove('show'); c.sheet.classList.remove('show');
    setTimeout(function () { c.scrim.remove(); c.sheet.remove(); }, 230);
  }

  /**
   * Nach unten wegwischen: am Griff/Kopf immer; im Inhalt nur, wenn er ganz oben steht (sonst wird gescrollt).
   * Das Sheet folgt dem Finger; ab 80 px oder schnellem Wisch zu, sonst federt es zurück.
   */
  function swipeToClose(sheet) {
    var startY = 0, startT = 0, dy = 0, active = false, fromTop = false;
    sheet.addEventListener('touchstart', function (e) {
      if (e.touches.length !== 1) return;
      var t = e.target;
      if (t.closest && t.closest('input,textarea,select,.chips,.leaflet-container')) { active = false; return; }
      fromTop = !!(t.closest && t.closest('.grip-zone'));
      startY = e.touches[0].clientY; startT = Date.now(); dy = 0;
      active = fromTop || sheet.scrollTop <= 0;
    }, { passive: true });
    sheet.addEventListener('touchmove', function (e) {
      if (!active) return;
      dy = e.touches[0].clientY - startY;
      if (dy <= 0) { if (!fromTop) active = false; sheet.style.transform = ''; return; }
      if (!fromTop && sheet.scrollTop > 0) { active = false; return; }
      e.preventDefault();
      sheet.style.transition = 'none';
      sheet.style.transform = 'translateY(' + dy + 'px)';
    }, { passive: false });
    function end() {
      if (!active) return;
      active = false;
      sheet.style.transition = '';
      var fast = dy > 30 && dy / Math.max(1, Date.now() - startT) > 0.5;
      if (dy > 80 || fast) closeSheet();
      else sheet.style.transform = '';
    }
    sheet.addEventListener('touchend', end);
    sheet.addEventListener('touchcancel', end);
  }

  document.addEventListener('keydown', function (e) { if (e.key === 'Escape') closeSheet(); });

  /** Bestätigung im Sheet — confirm() gibt es in manchen Ansichten nicht. */
  function confirmSheet(title, text, okLabel, danger) {
    return new Promise(function (resolve) {
      var done = false;
      openSheet('<h2>' + esc(title) + '</h2><p class="sheet-sub">' + esc(text) + '</p>' +
        '<div class="btn-row"><button type="button" class="btn" data-no>' + esc(I18n.t('cancel')) + '</button>' +
        '<button type="button" class="btn ' + (danger ? 'danger' : 'primary') + '" data-yes>' + esc(okLabel) + '</button></div>',
        function (el, api) {
          el.querySelector('[data-no]').onclick = function () { done = true; resolve(false); api.close(); };
          el.querySelector('[data-yes]').onclick = function () { done = true; resolve(true); api.close(); };
        }, { onClose: function () { if (!done) resolve(false); } });
    });
  }

  /** Foto verkleinern/komprimieren: spart Speicher in der Outbox und Upload bei schwachem Netz. */
  function readPhoto(file, maxDim) {
    return new Promise(function (resolve, reject) {
      if (!file) return resolve('');
      var reader = new FileReader();
      reader.onerror = reject;
      reader.onload = function (e) {
        var img = new Image();
        img.onerror = reject;
        img.onload = function () {
          var m = maxDim || 1280;
          var scale = Math.min(1, m / Math.max(img.width, img.height));
          var c = document.createElement('canvas');
          c.width = Math.round(img.width * scale);
          c.height = Math.round(img.height * scale);
          c.getContext('2d').drawImage(img, 0, 0, c.width, c.height);
          resolve(c.toDataURL('image/jpeg', 0.72));
        };
        img.src = e.target.result;
      };
      reader.readAsDataURL(file);
    });
  }

  /** Foto eines gespeicherten Eintrags über die Schnittstelle holen (Fotos sind nicht öffentlich). */
  var photoCache = {};
  async function loadPhoto(url) {
    if (!url) return '';
    if (photoCache[url]) return photoCache[url];
    var code = await DB.get('code');
    var res = await API.call('photo', code, { url: url }, 45000);
    photoCache[url] = res.dataUrl;
    return res.dataUrl;
  }

  /** Reiter oben in einem Menübereich (z. B. Strecke: Liste · Plan · Kühlzelle). items = [[href, label, aktiv]] */
  function sectionTabs(items) {
    return '<nav class="section-tabs">' + items.map(function (it) {
      return '<a href="' + esc(it[0]) + '"' + (it[2] ? ' aria-current="page"' : '') + '>' + esc(it[1]) + '</a>';
    }).join('') + '</nav>';
  }

  function emptyState(icon, title, text, actionHtml) {
    return '<div class="empty">' + (ICONS[icon] || '') + '<b>' + esc(title) + '</b><p>' + esc(text) + '</p>' + (actionHtml || '') + '</div>';
  }

  return {
    esc: esc, $: $, $$: $$, todayISO: todayISO, nowLocalISO: nowLocalISO, parseISO: parseISO,
    fmtDate: fmtDate, fmtDay: fmtDay, fmtLong: fmtLong, fmtTime: fmtTime, fmtStamp: fmtStamp, daysSince: daysSince,
    toast: toast, hideToast: hideToast, openSheet: openSheet, closeSheet: closeSheet,
    isSheetOpen: function () { return !!current; }, onSheetClosed: function (fn) { closedListeners.push(fn); }, confirm: confirmSheet,
    readPhoto: readPhoto, loadPhoto: loadPhoto, emptyState: emptyState, sectionTabs: sectionTabs,
    // Kurzer Impuls als Bestätigung (nur Android; iPhones erlauben Web-Apps keine Vibration)
    haptic: function () { try { if (navigator.vibrate) navigator.vibrate(25); } catch (e) {} }
  };
})();
