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
      if (worker.state === 'activated') {
        location.reload();
      }
    });
    // the generated service worker calls skipWaiting() on this message
    worker.postMessage({ type: 'SKIP_WAITING' });
  }

  function notifyUser() {
    $q.notify({
      type: 'negative',
      message: t('pwa.updateAvailable'),
      timeout: 0,
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

  onMounted(() => window.addEventListener('message', handleMessage));
  onUnmounted(() => window.removeEventListener('message', handleMessage));
}
