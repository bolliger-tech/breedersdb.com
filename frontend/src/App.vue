<template>
  <DarkModeColorProvider>
    <router-view />
  </DarkModeColorProvider>
</template>

<script setup lang="ts">
import DarkModeColorProvider from 'components/DarkModeColorProvider.vue';
defineOptions({
  name: 'App',
});
</script>
