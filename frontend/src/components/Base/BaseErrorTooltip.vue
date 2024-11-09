<template>
  <q-menu
    :model-value="show || !!_graphqlError || !!_message"
    max-width="min(500px, 90dvw)"
    anchor="top middle"
    self="bottom middle"
    :offset="[0, 8]"
    no-parent-event
    class="bg-black shadow-3 q-pa-sm q-ma-md text-body2 entity-modal-content__error-tooltip"
    dark
    @hide="
      _graphqlError = null;
      _message = null;
      !show && $emit('close');
    "
    @mouseleave="
      _graphqlError = null;
      _message = null;
      !show && $emit('close');
    "
  >
    <div class="row no-wrap">
      <div style="max-width: calc(100% - 16px)">
        <slot>
          <BaseGraphqlError
            v-if="_graphqlError"
            :error="_graphqlError"
            style="margin: 0 !important"
          />
          <BaseMessage
            v-else-if="_message"
            :message="_message"
            type="error"
            icon-size="2em"
          />
        </slot>
      </div>
      <q-btn
        class="self-start"
        icon="close"
        flat
        round
        color="white"
        size="xs"
        @click="
          _graphqlError = null;
          _message = null;
        "
      />
    </div>
  </q-menu>
</template>

<script lang="ts" setup>
import { CombinedError } from '@urql/vue';
import BaseGraphqlError from 'src/components/Base/BaseGraphqlError.vue';
import BaseMessage from 'src/components/Base/BaseMessage.vue';
import { type Slot, ref, watch } from 'vue';

export interface BaseErrorTooltipProps {
  show?: boolean;
  graphqlError?: CombinedError | null;
  message?: string | null;
}

const props = defineProps<BaseErrorTooltipProps>();
defineSlots<{
  default: Slot;
}>();

defineEmits<{
  close: [];
}>();

const _graphqlError = ref(props.graphqlError);
const _message = ref(props.message);

watch(
  [() => props.graphqlError, () => props.message],
  ([graphqlError, message]) => {
    if (!graphqlError && !message) {
      // keep the data so the tooltip is not automatically hidden
      return;
    }

    _graphqlError.value = graphqlError;
    _message.value = message;
  },
);
</script>
