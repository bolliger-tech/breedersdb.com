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
    const registrations = await navigator.serviceWorker.getRegistrations();
    const updated = registrations.map((r) => r.update());
    await Promise.allSettled(updated).then(() => location.reload());
  } else {
    location.reload();
  }
}
</script>
