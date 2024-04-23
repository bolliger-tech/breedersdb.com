<template>
  <slot></slot>
</template>

<script setup lang="ts">
import { useQuasar } from 'quasar';
import { watch } from 'vue';
import { setCssVar } from 'quasar';
import { onMounted } from 'vue';

const DARK_MODE_KEY = 'darkMode';

const $q = useQuasar();

function setColors(isDark: boolean) {
  setCssVar('primary', isDark ? '#0f636b' : '#093a3e');
  setCssVar('secondary', isDark ? '#0074bd' : '#00558a');
  setCssVar('accent', isDark ? '#ff85d8' : '#b8007d');
}

watch(
  () => $q.dark.isActive,
  (isDark) => {
    setColors(isDark);
    $q.localStorage.set(DARK_MODE_KEY, isDark);
  },
);

onMounted(() => {
  if ($q.localStorage.has(DARK_MODE_KEY)) {
    $q.dark.set($q.localStorage.getItem(DARK_MODE_KEY) === true);
  }
  setColors($q.dark.isActive);
});
</script>
