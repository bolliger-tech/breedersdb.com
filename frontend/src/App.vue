<template>
  <TheDarkModeColorProvider>
    <router-view />
  </TheDarkModeColorProvider>
</template>

<script setup lang="ts">
import TheDarkModeColorProvider from 'components/Layout/DarkMode/TheDarkModeColorProvider.vue';
import { usePwaUpdate } from './composables/usePwaUpdate';

// rewrite `/any-old-url?maybe-query/#/router-path` to `/#/router-path`
// -> removes any path and query before the fragment
// this is needed because people still use old URLs
if (window.location.pathname !== '/' || window.location.search) {
  window.location.replace(`/${window.location.hash}`);
}

usePwaUpdate();
</script>
