import { useQuasar } from 'quasar';
import { useI18n } from 'src/composables/useI18n';
import { onMounted, onUnmounted } from 'vue';

export function usePwaUpdate() {
  const $q = useQuasar();
  const { t } = useI18n();

  let refreshing = false;

  function reload() {
    // this can cause an infinite loop with specific settings in the devtools
    // therefore, we need to check if we are already refreshing
    if (refreshing) return;
    refreshing = true;
    location.reload();
  }

  async function activateUpdate() {
    const registration = await navigator.serviceWorker.getRegistration();
    if (!registration?.waiting) {
      reload();
      return;
    }
    // the generated service worker calls skipWaiting() on this message,
    // which triggers controllerchange -> reload
    registration.waiting.postMessage({ type: 'SKIP_WAITING' });
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

  onMounted(() => {
    window.addEventListener('message', handleMessage);

    // see also quasar.config.ts -> configure() -> pwa -> workboxOptions
    if ('serviceWorker' in navigator && navigator.serviceWorker.controller) {
      // the new service worker only takes control after the user accepted
      // the update (or all tabs were closed), so reload to load its assets
      navigator.serviceWorker.addEventListener('controllerchange', reload);
    }
  });

  onUnmounted(() => {
    window.removeEventListener('message', handleMessage);
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.removeEventListener('controllerchange', reload);
    }
  });
}
