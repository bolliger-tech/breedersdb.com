import { useQuasar } from 'quasar';
import { useI18n } from 'src/composables/useI18n';
import { onMounted, onUnmounted } from 'vue';

export function usePwaUpdate() {
  const $q = useQuasar();
  const { t } = useI18n();

  async function activateUpdate() {
    const registration = await navigator.serviceWorker.getRegistration();
    const worker = registration?.waiting;
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

  let dismissNotification: (() => void) | undefined;

  function notifyUser() {
    // the waiting worker may be reported both on mount and by message
    if (dismissNotification) return;

    dismissNotification = $q.notify({
      type: 'negative',
      message: t('pwa.updateAvailable'),
      timeout: 0,
      onDismiss: () => (dismissNotification = undefined),
      actions: [
        {
          label: t('pwa.update'),
          color: 'white',
          handler: () => void activateUpdate(),
        },
      ],
    });
  }

  function handleMessage(event: MessageEvent) {
    if (event.data === 'bdb-swUpdated') {
      notifyUser();
    }
  }

  onMounted(async () => {
    window.addEventListener('message', handleMessage);

    // register-service-worker reports a worker that was already waiting on
    // page load only once, possibly before this listener existed
    if (!('serviceWorker' in navigator)) return;
    const registration = await navigator.serviceWorker.getRegistration();
    if (registration?.waiting && navigator.serviceWorker.controller) {
      notifyUser();
    }
  });
  onUnmounted(() => window.removeEventListener('message', handleMessage));
}
