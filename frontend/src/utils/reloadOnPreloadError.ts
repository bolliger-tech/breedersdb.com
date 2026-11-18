const RELOADED_FOR_KEY = 'bdb-preloadErrorReloadedFor';

/**
 * After a deploy, lazy chunks of the old version may be gone from the server
 * (e.g. in tabs not controlled by the service worker). Reload to load the new
 * version. See https://vite.dev/guide/build#load-error-handling
 *
 * If the same chunk still fails after the reload (offline, server down,
 * broken deploy), don't reload again: the error then reaches the router's
 * error handling instead of reloading the page forever.
 */
export function reloadOnPreloadError(event: Event & { payload: Error }) {
  // the message names the chunk that failed to load
  const failedChunk = event.payload.message;
  if (sessionStorage.getItem(RELOADED_FOR_KEY) === failedChunk) return;

  sessionStorage.setItem(RELOADED_FOR_KEY, failedChunk);
  location.reload();
}
