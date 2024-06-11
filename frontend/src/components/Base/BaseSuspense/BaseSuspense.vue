<template>
  <BaseSuspenseError v-if="error" :error="error" />
  <Suspense v-else>
    <template #default>
      <slot name="default"></slot>
    </template>
    <template #fallback>
      <slot name="fallback"></slot>
    </template>
  </Suspense>
</template>

<script setup lang="ts">
import { CombinedError } from '@urql/vue';
import { ref, onErrorCaptured } from 'vue';
import BaseSuspenseError from './BaseSuspenseError.vue';

const error = ref<Error | CombinedError | null>(null);

onErrorCaptured((e) => {
  error.value = e instanceof Error ? e : new Error(e);
});
</script>
