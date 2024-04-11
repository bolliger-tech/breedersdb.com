<template>
  <q-toggle
    v-model="darkMode"
    label="Dark Mode"
    color="accent"
    @update:model-value="$q.dark.set"
  />
</template>

<script setup lang="ts">
import { useQuasar } from 'quasar';
import { ref } from 'vue';

const $q = useQuasar();
const darkMode = ref($q.dark.isActive);
</script>
