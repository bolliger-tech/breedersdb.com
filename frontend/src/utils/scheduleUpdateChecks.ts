const UPDATE_INTERVAL_MS = 1000 * 60 * 60;
const MIN_VISIBILITY_CHECK_INTERVAL_MS = 1000 * 60 * 10;

export function scheduleUpdateChecks(registration: ServiceWorkerRegistration) {
  // registering the service worker just checked for an update
  let lastUpdateCheck = Date.now();

  const checkForUpdate = () => {
    lastUpdateCheck = Date.now();
    // fails on bad connections, even when navigator.onLine is true (captive
    // portals, weak mobile signal). This is expected in the field.
    registration
      .update()
      .catch((error) =>
        console.warn('Service worker update check failed:', error),
      );
  };

  setInterval(checkForUpdate, UPDATE_INTERVAL_MS);

  // installed web apps are often resumed from the background instead of
  // reloaded, and timers don't run while suspended. Each check fetches
  // sw.js, so don't repeat it on every switch between apps.
  document.addEventListener('visibilitychange', () => {
    if (
      document.visibilityState === 'visible' &&
      Date.now() - lastUpdateCheck > MIN_VISIBILITY_CHECK_INTERVAL_MS
    ) {
      checkForUpdate();
    }
  });
}
