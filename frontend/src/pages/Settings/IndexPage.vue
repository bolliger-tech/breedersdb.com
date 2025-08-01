<template>
  <PageLayout>
    <h1 class="q-mr-lg">{{ t('settings.title') }}</h1>
    <p>{{ t('settings.subtitle') }}</p>
    <div style="font-size: 0.8rem; font-family: monospace; line-height: 1">
      <h3>{{ t('settings.version') }}</h3>
      <p style="word-break: break-word">{{ version }}</p>
      <h3>{{ t('settings.userAgent') }}</h3>
      <p style="word-break: break-word">{{ userAgent }}</p>
      <h3>{{ t('settings.standalone') }}</h3>
      <p style="word-break: break-word">{{ isInStandaloneMode }}</p>
      <h3>{{ t('settings.serviceWorker') }}</h3>
      <p style="word-break: break-word">{{ serviceWorker }}</p>
      <h3>{{ t('settings.origin') }}</h3>
      <p style="word-break: break-word">{{ origin }}</p>
      <h3>{{ t('settings.timestamp') }}</h3>
      <p style="word-break: break-word">{{ now }}</p>
      <h3>{{ t('settings.user') }}</h3>
      <p style="word-break: break-word">{{ user }}</p>
    </div>
  </PageLayout>
</template>

<script setup lang="ts">
import PageLayout from 'src/layouts/PageLayout.vue';
import { useI18n } from 'src/composables/useI18n';
import { useMe } from 'src/composables/useMe';
import { onMounted, ref } from 'vue';
import { useInterval } from 'quasar';

const { t } = useI18n();
const userAgent = navigator.userAgent;
const version = import.meta.env.VITE_BDB_VERSION;
const user = useMe().value?.email;
const origin = window.location.origin;
const now = ref(new Date().toLocaleString());
const isInStandaloneMode =
  window.matchMedia('(display-mode: standalone)').matches ||
  ('standalone' in navigator && navigator.standalone) ||
  document.referrer.includes('android-app://');
const serviceWorker =
  'serviceWorker' in navigator && navigator.serviceWorker.controller
    ? navigator.serviceWorker.controller.state
    : 'undefined';

const { registerInterval } = useInterval();

onMounted(() => {
  registerInterval(() => {
    now.value = new Date().toLocaleString();
  }, 1000);
});
</script>
