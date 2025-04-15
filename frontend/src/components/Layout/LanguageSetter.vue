<template>
  <q-item
    clickable
    class="column justify-center"
    @click="i18n.setAndPersistLocale(locale)"
  >
    <span class="label nowrap-ellipsis text-white">{{ label }}</span>
  </q-item>
</template>

<script setup lang="ts">
import { useI18n } from 'src/composables/useI18n';
import type { Locale } from 'src/composables/useI18n';

export interface LanguageSetterProps {
  locale: Locale;
  label: string;
}

const { locale, label } = defineProps<LanguageSetterProps>();

const i18n = useI18n({ useScope: 'global' });
</script>

<style scoped lang="scss">
.label::before {
  content: '○';
  display: inline-block;
  padding-left: 40px;
  padding-right: map-get($space-sm, 'x');
}
</style>
