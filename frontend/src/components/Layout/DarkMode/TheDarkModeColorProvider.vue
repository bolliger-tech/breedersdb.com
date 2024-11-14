<template>
  <slot></slot>
</template>

<script setup lang="ts">
import { useQuasar } from 'quasar';
import { watch } from 'vue';
import { setCssVar } from 'quasar';
import { onMounted } from 'vue';

const DARK_MODE_KEY = 'breedersdb-dark-mode';

const $q = useQuasar();

function setColors(isDark: boolean) {
  setCssVar(
    'primary',
    isDark ? 'var(--bdb-primary-500)' : 'var(--bdb-primary-700)',
  );
  setCssVar(
    'secondary',
    isDark ? 'var(--bdb-secondary-500)' : 'var(--bdb-secondary-700)',
  );
  setCssVar(
    'accent',
    isDark ? 'var(--bdb-accent-500)' : 'var(--bdb-accent-700)',
  );
  setCssVar(
    'link-color',
    isDark ? 'var(--bdb-primary-100)' : 'var(--bdb-primary-500)',
  );
  setCssVar(
    'link-color-hover',
    isDark ? 'var(--bdb-secondary-100)' : 'var(--bdb-secondary-500)',
  );
  setCssVar('shade', isDark ? '#424242' : '#eeeeee');
}

watch(
  () => $q.dark.mode,
  (mode) => $q.localStorage.set(DARK_MODE_KEY, mode),
);

watch(
  () => $q.dark.isActive,
  (isActive) => setColors(isActive),
);

onMounted(() => {
  $q.dark.set($q.localStorage.getItem(DARK_MODE_KEY) || 'auto');
  setColors($q.dark.isActive);
});
</script>
