const LAST_RELOAD_KEY = 'bdb-preloadErrorReload';
const MIN_RELOAD_INTERVAL_MS = 10_000;

/**
 * After a deploy, lazy chunks of the old version may be gone from the server
 * (e.g. in tabs not controlled by the service worker). Reload to load the new
 * version. See https://vite.dev/guide/build#load-error-handling
 *
 * If a chunk is still missing after the reload (offline, server down, broken
 * deploy), don't reload again: the error then reaches the router's error
 * handling instead of reloading the page forever.
 */
export function reloadOnPreloadError() {
  const lastReload = Number(sessionStorage.getItem(LAST_RELOAD_KEY));
  if (Date.now() - lastReload < MIN_RELOAD_INTERVAL_MS) return;

  sessionStorage.setItem(LAST_RELOAD_KEY, String(Date.now()));
  location.reload();
}
