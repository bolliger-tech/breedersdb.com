<template>
  <slot></slot>
</template>

<script setup lang="ts">
import { useQuasar } from 'quasar';
import { watch } from 'vue';
import { setCssVar } from 'quasar';
import { onMounted } from 'vue';

const $q = useQuasar();

function setColors(isDark: boolean) {
  setCssVar('primary', isDark ? '#0f636b' : '#093a3e');
  setCssVar('secondary', isDark ? '#0074bd' : '#00558a');
  setCssVar('accent', isDark ? '#ff85d8' : '#b8007d');
}

watch(
  () => $q.dark.isActive,
  (isDark) => setColors(isDark),
);

onMounted(() => {
  setColors($q.dark.isActive);
});
</script>
