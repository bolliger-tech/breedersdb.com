<template>
  <article class="q-my-md q-pa-sm bg-black text-negative rounded-borders">
    <template v-if="error.networkError?.message === 'Failed to fetch'">
      <div class="row align-center">
        <q-icon name="warning" color="error" size="50px" class="col-auto" />
        <h3 class="q-ml-md q-my-none col text-white">
          {{ t('base.networkError.title') }}
        </h3>
      </div>
      <p class="text-white q-mt-md q-mb-sm body-text1">
        {{ t('base.networkError.message') }}
      </p>
    </template>

    <template v-else>
      <h3 class="q-mt-sm">GraphQL Error</h3>
      <p class="base-graphql-error__msg">
        {{
          error.message.startsWith('[GraphQL]')
            ? error.message.slice(9)
            : error.message
        }}
      </p>
      <pre class="q-ma-none base-graphql-error__msg">{{
        JSON.stringify(error, null, 2)
      }}</pre>
    </template>
  </article>
</template>

<script lang="ts" setup>
import { CombinedError } from '@urql/core';
import { onMounted } from 'vue';
import { captureException } from '@sentry/browser';
import { useI18n } from 'src/composables/useI18n';

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

const { t } = useI18n();
</script>

<style lang="scss" scoped>
.base-graphql-error__msg {
  pre {
    white-space: pre-wrap;
  }
}
</style>
