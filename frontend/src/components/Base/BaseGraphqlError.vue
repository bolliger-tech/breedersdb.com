<template>
  <article class="q-my-md q-pa-sm bg-black text-negative rounded-borders">
    <template v-if="isOfflineError">
      <BaseMessage type="error" icon-size="xl">
        <h3 class="q-my-none col text-white">
          {{ t('base.networkError.title') }}
        </h3>
      </BaseMessage>
      <p class="text-white q-mt-md q-mb-sm body-text1">
        {{ t('base.networkError.message') }}
      </p>
    </template>

    <template v-else>
      <h3 class="q-mt-sm">GraphQL Error</h3>
      <p class="base-graphql-error__msg">
        {{
          error.message.startsWith('[GraphQL]')
            ? error.message.slice(10)
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
import { computed, onMounted } from 'vue';
import { captureException } from '@sentry/browser';
import { useI18n } from 'src/composables/useI18n';
import BaseMessage from 'src/components/Base/BaseMessage.vue';

export interface BaseGraphqlErrorProps {
  error: CombinedError;
  throw?: boolean;
}

const props = withDefaults(defineProps<BaseGraphqlErrorProps>(), {
  throw: false,
});

// adapted from https://github.com/urql-graphql/urql/blob/65e15c568c9a0755894dfb02995f0262e1fe75f9/exchanges/graphcache/src/offlineExchange.ts#L59
const isOfflineError = computed(
  () =>
    props.error.networkError &&
    !props.error.response &&
    ((typeof navigator !== 'undefined' && navigator.onLine === false) ||
      /request failed|failed to fetch|network\s?error/i.test(
        props.error.networkError.message,
      )),
);

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
  white-space: pre-wrap;
}
</style>
