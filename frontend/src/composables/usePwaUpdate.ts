import { useQuasar } from 'quasar';
import { useI18n } from 'src/composables/useI18n';
import { onMounted, onUnmounted } from 'vue';

export function usePwaUpdate() {
  const $q = useQuasar();
  const { t } = useI18n();

  function notify(event: MessageEvent) {
    if (event.data === 'bdb-swUpdated') {
      $q.notify({
        type: 'negative',
        message: t('pwa.updateAvailable'),
        timeout: 0,
        actions: [
          {
            label: t('pwa.update'),
            color: 'white',
            handler: () => location.reload(),
          },
        ],
      });
    }
  }

  onMounted(() => {
    window.addEventListener('message', notify);
  });

  onUnmounted(() => {
    window.removeEventListener('message', notify);
  });
}
