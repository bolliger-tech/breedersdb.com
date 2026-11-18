import { register } from 'register-service-worker';
import { scheduleUpdateChecks } from 'src/utils/scheduleUpdateChecks';

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
    scheduleUpdateChecks(registration);
  },

  cached(/* registration */) {
    // console.log('Content has been cached for offline use.')
  },

  updatefound(/* registration */) {
    // console.log('New content is downloading.')
  },

  updated(/* registration */) {
    // handled by src/composables/usePwaUpdate.ts
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
