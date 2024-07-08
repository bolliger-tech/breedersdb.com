<template>
  <article class="q-my-md q-pa-sm bg-black text-negative rounded-borders">
    <h3 class="q-mt-sm">GraphQL Error</h3>
    <p>{{ error.message }}</p>
    <pre class="q-ma-none base-graphql-error__msg">{{
      JSON.stringify(error, null, 2)
    }}</pre>
  </article>
</template>

<script lang="ts" setup>
import { CombinedError } from '@urql/core';
import { onMounted } from 'vue';
import { captureException } from '@sentry/browser';

export interface BaseGraphqlErrorProps {
  error: CombinedError;
  throw?: boolean;
}

const props = withDefaults(defineProps<BaseGraphqlErrorProps>(), {
  throw: false,
});

onMounted(() => {
  if (props.error && props.throw) {
    throw props.error; // reports automatically to Sentry
  } else if (props.error) {
    captureException(props.error);
    console.error(props.error);
  }
});
</script>

<style lang="scss" scoped>
.base-graphql-error__msg {
  font-size: 12px;
  white-space: pre-wrap;
}
</style>
