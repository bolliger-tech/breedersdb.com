<template>
  <TheDarkModeColorProvider>
    <router-view />
  </TheDarkModeColorProvider>
</template>

<script setup lang="ts">
import TheDarkModeColorProvider from 'components/Layout/DarkMode/TheDarkModeColorProvider.vue';
defineOptions({
  name: 'App',
});
</script>
