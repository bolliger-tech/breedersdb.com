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

  function notifyUser() {
    $q.notify({
      type: 'negative',
      message: t('pwa.updateAvailable'),
      timeout: 0,
      actions: [
        {
          label: t('pwa.update'),
          color: 'white',
          handler: reload,
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
      navigator.serviceWorker.addEventListener('controllerchange', notifyUser);
    }
  });

  onUnmounted(() => {
    window.removeEventListener('message', handleMessage);
  });

  if ('serviceWorker' in navigator && navigator.serviceWorker.controller) {
    navigator.serviceWorker.removeEventListener('controllerchange', notifyUser);
  }
}
