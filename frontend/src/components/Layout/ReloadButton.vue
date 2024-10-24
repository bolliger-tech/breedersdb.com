<template>
  <q-item clickable class="column justify-center" @click="reload">
    <figure class="row items-center q-mx-none child-item no-wrap text-white">
      <q-icon name="refresh" size="sm" />
      <figcaption class="q-ml-md">{{ label }}</figcaption>
    </figure>
  </q-item>
</template>

<script setup lang="ts">
export interface ReloadButtonProps {
  label: string;
}

defineProps<ReloadButtonProps>();

function reload() {
  location.reload();
}
</script>
