<template>
  <article class="q-my-md q-pa-sm bg-black text-negative rounded-borders">
    <h3 class="q-mt-sm">GraphQL Error</h3>
    <pre class="q-ma-none base-graphql-error__msg">{{
      JSON.stringify(error, null, 2)
    }}</pre>
  </article>
</template>

<script lang="ts" setup>
import { CombinedError } from '@urql/core';
import { onMounted } from 'vue';

export interface BaseGraphqlErrorProps {
  error: CombinedError;
}

const props = defineProps<BaseGraphqlErrorProps>();

onMounted(() => {
  if (props.error) {
    throw props.error; // report error to Sentry
  }
});
</script>

<style lang="scss" scoped>
.base-graphql-error__msg {
  font-size: 12px;
  white-space: pre-wrap;
}
</style>
