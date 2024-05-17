<template>
  <q-item clickable class="column justify-center" @click="setMode">
    <span class="label text-white">{{ label }}</span>
  </q-item>
</template>

<script setup lang="ts">
import { useQuasar } from 'quasar';

export interface DarkModeSetter {
  isDark: ReturnType<typeof useQuasar>['dark']['isActive'];
  label: string;
}

const { isDark, label } = defineProps<DarkModeSetter>();

const $q = useQuasar();
function setMode() {
  $q.dark.set(isDark);
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
