<template>
  <q-tooltip
    :model-value="show || !!graphqlError || !!message"
    max-width="min(500px, 90svw)"
    anchor="top middle"
    self="bottom middle"
    :hide-delay="2000"
    no-parent-event
    class="bg-dark shadow-3 entity-modal-content__error-tooltip"
  >
    <slot>
      <BaseGraphqlError v-if="graphqlError" :error="graphqlError" />
      <BaseMessage
        v-else-if="message"
        :message="message"
        type="error"
        icon-size="2em"
      />
    </slot>
  </q-tooltip>
</template>

<script lang="ts" setup>
import { CombinedError } from '@urql/vue';
import BaseGraphqlError from 'src/components/Base/BaseGraphqlError.vue';
import BaseMessage from 'src/components/Base/BaseMessage.vue';
import type { Slot } from 'vue';

export interface BaseErrorTooltipProps {
  show?: boolean;
  graphqlError?: CombinedError | null;
  message?: string | null;
}

defineProps<BaseErrorTooltipProps>();
defineSlots<{
  default: Slot;
}>();
</script>
