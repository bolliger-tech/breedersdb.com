<template>
  <q-card v-if="error">
    <BaseGraphqlError :error="error" />
  </q-card>

  <template v-else-if="$slots.default">
    <slot></slot>
  </template>

  <q-card v-else-if="fetching">
    <BaseSpinner size="xl" />
  </q-card>

  <q-card v-else>
    <BaseNotFound />
  </q-card>
</template>

<script setup lang="ts">
import BaseGraphqlError from 'src/components/Base/BaseGraphqlError.vue';
import BaseSpinner from 'src/components/Base/BaseSpinner.vue';
import BaseNotFound from 'src/components/Base/BaseNotFound.vue';
import type { CombinedError } from '@urql/vue';

defineProps<{ error?: CombinedError; fetching?: boolean }>();
</script>
