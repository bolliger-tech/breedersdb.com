<template>
  <div class="entity-label q-my-sm">
    <!-- the action moves below the label if both don't fit on one line -->
    <div v-if="label || $slots.label" class="q-mb-xs row items-center">
      <div class="text-weight-bold row align-center">
        <slot name="label">
          {{ label }}
        </slot>
        <template v-if="explainer || $slots.explainer">
          &nbsp;
          <BaseExplainer>
            <slot name="explainer">{{ explainer }}</slot>
          </BaseExplainer>
        </template>
      </div>
      <div v-if="$slots['label-action']" class="q-ml-auto q-pl-sm">
        <slot name="label-action"></slot>
      </div>
    </div>
    <slot></slot>
  </div>
</template>

<script setup lang="ts">
import BaseExplainer from 'src/components/Base/BaseExplainer.vue';
import { type Slot } from 'vue';

// quasar currently has no option to display the label above the input,
// nor to not define the label tag :( therefore this ugly and semantically
// incorrect workaround.

export interface BaseInputLabelProps {
  label?: string | undefined;
  explainer?: string | undefined;
}

defineProps<BaseInputLabelProps>();

defineSlots<{
  default: Slot;
  label: Slot;
  explainer: Slot;
  'label-action': Slot;
}>();
</script>

<style>
.entity-label .q-field__bottom {
  padding-left: 0;
}
</style>
