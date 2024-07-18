<template>
  <div class="entity-label q-my-sm">
    <div v-if="label || $slots.label" class="text-weight-bold q-mb-xs">
      <slot name="label">{{ label }}</slot>
    </div>
    <slot></slot>
  </div>
</template>

<script setup lang="ts">
// quasar currently has no option to display the label above the input,
// nor to not define the label tag :( therefore this ugly and semantically
// incorrect workaround.

export interface BaseInputLabelProps {
  label?: string;
}
defineProps<BaseInputLabelProps>();
</script>

<style>
.entity-label .q-field__bottom {
  padding-left: 0;
}
</style>
