<template>
  <q-item clickable class="column justify-center" @click.stop="reload">
    <figure class="row items-center q-mx-none child-item no-wrap text-white">
      <q-icon v-if="!loading" name="refresh" size="sm" />
      <q-spinner v-if="loading" size="sm" color="white" />
      <figcaption class="q-ml-md">{{ label }}</figcaption>
    </figure>
  </q-item>
</template>

<script setup lang="ts">
import { ref } from 'vue';

export interface ReloadButtonProps {
  label: string;
}

defineProps<ReloadButtonProps>();

const loading = ref(false);

async function reload() {
  loading.value = true;

  if ('serviceWorker' in navigator) {
    try {
      // 1. Unregister all service workers to ensure a clean slate
      const registrations = await navigator.serviceWorker.getRegistrations();
      await Promise.all(
        registrations.map((registration) => registration.unregister()),
      );

      // 2. Clear all caches to ensure fresh content
      if ('caches' in window) {
        const cacheNames = await caches.keys();
        await Promise.all(cacheNames.map((name) => caches.delete(name)));
      }

      // 3. Force reload with cache bypass by adding a timestamp
      const url = new URL(window.location.href);
      url.searchParams.set('_t', Date.now().toString());
      window.location.href = url.toString();
    } catch (error) {
      console.warn('Error during service worker cleanup:', error);
      // Fallback to standard reload
      location.reload();
    }
  } else {
    // Standard reload
    location.reload();
  }
}
</script>
