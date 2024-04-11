<template>
  <q-btn-toggle
    v-model="locale"
    toggle-color="primary"
    :options="localeOptions"
    flat
  />
</template>

<script setup lang="ts">
import { useI18n } from 'src/composables/useI18n';

const { locale } = useI18n({ useScope: 'global' });

const localeOptions = [
  { value: 'en-US', label: 'English' },
  { value: 'de-CH', label: 'Deutsch' },
];
</script>
