import { register } from 'register-service-worker';

// The ready(), registered(), cached(), updatefound() and updated()
// events passes a ServiceWorkerRegistration instance in their arguments.
// ServiceWorkerRegistration: https://developer.mozilla.org/en-US/docs/Web/API/ServiceWorkerRegistration

register(process.env.SERVICE_WORKER_FILE, {
  // The registrationOptions object will be passed as the second argument
  // to ServiceWorkerContainer.register()
  // https://developer.mozilla.org/en-US/docs/Web/API/ServiceWorkerContainer/register#Parameter

  // registrationOptions: { scope: './' },

  ready(/* registration */) {
    // console.log('Service worker is active.')
  },

  registered(registration) {
    // update() rejects while offline, which is expected in the field
    const checkForUpdate = () => registration.update().catch(() => undefined);

    setInterval(() => void checkForUpdate(), 1000 * 60 * 60); // hourly update check

    // installed web apps are often resumed from the background instead of
    // reloaded, and timers don't run while suspended
    document.addEventListener('visibilitychange', () => {
      if (document.visibilityState === 'visible') {
        void checkForUpdate();
      }
    });
  },

  cached(/* registration */) {
    // console.log('Content has been cached for offline use.')
  },

  updatefound(/* registration */) {
    // console.log('New content is downloading.')
  },

  updated(/* registration */) {
    // message is caught by src/composables/usePwaUpdate.ts
    postMessage('bdb-swUpdated');
  },

  offline() {
    // !!! IMPORTANT !!!
    // When implementing offline capabilities, check (and probably change):
    // quasar.config.ts -> configure() -> pwa -> extendGenerateSWOptions
    // A new service worker only activates once the user accepts the update,
    // but then takes control of all open tabs, which keep running the old
    // version of the app. This might cause offline storage inconsistencies.
    // See also: https://web.dev/articles/service-worker-lifecycle#updates
    //
    // console.log('No internet connection found. App is running in offline mode.')
  },

  error(/* err */) {
    // console.error('Error during service worker registration:', err)
  },
});
