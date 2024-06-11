<template>
  <q-item clickable class="column justify-center" @click="setLocale">
    <span class="label text-white">{{ label }}</span>
  </q-item>
</template>

<script setup lang="ts">
import { useI18n } from 'src/composables/useI18n';

export interface LanguageSetterProps {
  locale: ReturnType<typeof useI18n>['locale'] extends { value: infer T }
    ? T
    : never;
  label: string;
}

const { locale, label } = defineProps<LanguageSetterProps>();

const i18n = useI18n({ useScope: 'global' });
function setLocale() {
  i18n.locale.value = locale;
}
</script>

<style scoped lang="scss">
.label {
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
.label::before {
  content: '○';
  display: inline-block;
  padding-left: 40px;
  padding-right: map-get($space-sm, 'x');
}
</style>
