<template>
  <q-item clickable class="column justify-center" @click="setMode">
    <span class="label nowrap-ellipsis text-white">{{ label }}</span>
  </q-item>
</template>

<script setup lang="ts">
import type { Dark } from 'quasar';
import { useQuasar } from 'quasar';

export interface DarkModeSetter {
  isDark: Parameters<Dark['set']>[0];
  label: string;
}

const { isDark, label } = defineProps<DarkModeSetter>();

const $q = useQuasar();
function setMode() {
  $q.dark.set(isDark);
}
</script>

<style scoped lang="scss">
.label::before {
  content: '○';
  display: inline-block;
  padding-left: 40px;
  padding-right: map-get($space-sm, 'x');
}
</style>
