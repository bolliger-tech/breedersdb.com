<template>
  <article class="q-pa-sm bg-black text-negative rounded-borders">
    <h3 class="q-mt-sm">GraphQL Error</h3>

    <p class="text-body">
      {{
        error.message.startsWith('[GraphQL]')
          ? error.message.slice(9)
          : error.message
      }}
    </p>
    <details class="text-caption">
      <summary>Details</summary>

      <pre class="q-ma-none base-graphql-error__msg">{{
        JSON.stringify(error, null, 2)
      }}</pre>
    </details>
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
  white-space: pre-wrap;
}

details {
  summary {
    cursor: pointer;
    list-style-type: none;

    &:before {
      content: '▶';
      display: inline-block;
      margin-right: 0.5em;
    }

    &:webkit-details-marker {
      display: none;
    }
  }

  &[open] {
    summary:before {
      content: '▼';
    }
  }
}
</style>
