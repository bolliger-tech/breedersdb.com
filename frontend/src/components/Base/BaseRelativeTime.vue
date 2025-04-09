<template>
  <span v-if="timestamp && !date">{{ t('base.timespan.error') }}</span>
  <span v-else
    >{{ timeAgo
    }}<q-tooltip v-if="date">{{ d(date, 'YmdHis') }}</q-tooltip></span
  >
</template>

<script setup lang="ts">
import {
  getRelativeTimeInterval,
  toLocaleRelativeTimeString,
} from 'src/utils/dateUtils';
import { computed, onBeforeUnmount, ref, watch } from 'vue';
import { captureException } from '@sentry/browser';
import { useI18n } from 'src/composables/useI18n';
import { useInterval } from 'quasar';

const props = defineProps<{
  timestamp: string | Date | null | undefined;
}>();

const { locale, t, d } = useI18n();

const date = computed(() => {
  if (typeof props.timestamp === 'string') {
    try {
      return new Date(props.timestamp);
    } catch (e) {
      captureException(e);
      console.error(e);
      return null;
    }
  }
  return props.timestamp ?? null;
});

const { registerInterval, removeInterval } = useInterval();
const refreshKey = ref(0);

function startRefreshTimer() {
  if (!date.value) {
    return;
  }
  const refreshInterval = getRelativeTimeInterval(date.value);
  registerInterval(() => {
    refreshKey.value++;
  }, refreshInterval);
}
function stopRefreshTimer() {
  removeInterval();
}

watch(
  date,
  (newDate) => {
    if (newDate) {
      startRefreshTimer();
    } else {
      stopRefreshTimer();
    }
  },
  { immediate: true },
);

onBeforeUnmount(() => stopRefreshTimer());

const timeAgo = computed(() => {
  // eslint-disable-next-line @typescript-eslint/no-unused-expressions
  refreshKey.value; // trigger reactivity
  return date.value
    ? toLocaleRelativeTimeString(date.value, locale.value).replace(/\.$/, '')
    : t('base.timespan.never');
});
</script>
