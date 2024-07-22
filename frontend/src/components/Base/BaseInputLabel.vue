<template>
  <div class="entity-label q-my-sm">
    <div v-if="label" class="text-weight-bold q-mb-xs row align-center">
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
  label?: string;
  explainer?: string;
}

defineProps<BaseInputLabelProps>();

defineSlots<{
  default: Slot;
  label: Slot;
  explainer: Slot;
}>();
</script>

<style>
.entity-label .q-field__bottom {
  padding-left: 0;
}
</style>
