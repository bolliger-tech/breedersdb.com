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
