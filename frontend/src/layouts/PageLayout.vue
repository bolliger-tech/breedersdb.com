<template>
  <q-page class="q-ma-sm q-ma-md-md">
    <h1>{{ title }}</h1>
    <slot></slot>
  </q-page>
</template>

<script setup lang="ts">
export interface PageLayoutProps {
  title: string;
}

const { title } = defineProps<PageLayoutProps>();
</script>
