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
    setInterval(() => void registration.update(), 1000 * 60 * 60); // hourly update check
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
    // quasar.conf.js -> configure() -> pwa -> extendGenerateSWOptions
    // as we set skipWaiting and clientsClaim there, which might lead to
    // different versions of the app running at the same time and thus cause
    // offline storage inconsistencies.
    // See also: https://web.dev/articles/service-worker-lifecycle#updates
    //
    // console.log('No internet connection found. App is running in offline mode.')
  },

  error(/* err */) {
    // console.error('Error during service worker registration:', err)
  },
});
