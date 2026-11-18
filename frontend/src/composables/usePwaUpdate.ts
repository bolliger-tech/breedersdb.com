import { useQuasar } from 'quasar';
import { useI18n } from 'src/composables/useI18n';
import { onMounted } from 'vue';

export function usePwaUpdate() {
  const $q = useQuasar();
  const { t } = useI18n();

  function activateUpdate(registration: ServiceWorkerRegistration) {
    const worker = registration.waiting;
    if (!worker) {
      // another tab already activated the update
      location.reload();
      return;
    }
    // Wait for activation instead of listening for controllerchange: the
    // latter also fires in other tabs (which would reload them without asking)
    // and never fires in pages the service worker doesn't control.
    worker.addEventListener('statechange', () => {
      // redundant: activation failed or a newer worker replaced this one.
      // After the reload, the page shows whatever state the update is in.
      if (worker.state === 'activated' || worker.state === 'redundant') {
        location.reload();
      }
    });
    // the generated service worker calls skipWaiting() on this message
    worker.postMessage({ type: 'SKIP_WAITING' });
  }

  let notificationOpen = false;

  function notifyUser(registration: ServiceWorkerRegistration) {
    // a newer worker may install while the notification is still open
    if (notificationOpen) return;

    notificationOpen = true;
    $q.notify({
      type: 'negative',
      message: t('pwa.updateAvailable'),
      timeout: 0,
      onDismiss: () => (notificationOpen = false),
      actions: [
        {
          label: t('pwa.update'),
          color: 'white',
          handler: () => activateUpdate(registration),
        },
      ],
    });
  }

  function notifyWhenInstalled(
    registration: ServiceWorkerRegistration,
    worker: ServiceWorker,
  ) {
    worker.addEventListener('statechange', () => {
      // without a controller, this is the first install, not an update
      if (worker.state === 'installed' && navigator.serviceWorker.controller) {
        notifyUser(registration);
      }
    });
  }

  onMounted(async () => {
    if (!('serviceWorker' in navigator)) return;
    // resolves once a worker is active, i.e. also after the first install
    const registration = await navigator.serviceWorker.ready;

    if (registration.waiting && navigator.serviceWorker.controller) {
      notifyUser(registration);
    }
    if (registration.installing) {
      notifyWhenInstalled(registration, registration.installing);
    }
    registration.addEventListener('updatefound', () => {
      if (registration.installing) {
        notifyWhenInstalled(registration, registration.installing);
      }
    });
  });
}
