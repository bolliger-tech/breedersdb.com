<template>
  <TheDarkModeColorProvider>
    <router-view />
  </TheDarkModeColorProvider>
</template>

<script setup lang="ts">
import TheDarkModeColorProvider from 'components/Layout/DarkMode/TheDarkModeColorProvider.vue';
import { usePwaUpdate } from './composables/usePwaUpdate';
import { useRouteLoadState } from './layouts/useRouteLoadState';

const { provide: provideRouteLoadState } = useRouteLoadState();
provideRouteLoadState();

usePwaUpdate();
</script>
