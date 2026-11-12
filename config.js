/**
 * Einzige Stelle, die beim Einrichten angepasst wird: die Adresse des Servers
 * (Cloudflare-Worker, siehe ../server/README.md; früher Apps-Script-URL auf /exec).
 *
 * Die Codes (Jäger / Verwaltung) gehören NICHT hierher — dieses Repo ist öffentlich (GitHub Pages).
 * Sie werden auf jedem Handy einmal in der App eingegeben und nur dort gespeichert.
 */
var APP_CONFIG = {
  API_URL: 'https://seona-eko.seona.workers.dev/',
  VERSION: '2.13.1'
};
