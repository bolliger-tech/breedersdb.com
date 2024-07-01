<template>
  <div class="entity-label q-my-sm">
    <div v-if="label" class="text-weight-bold q-mb-xs">
      {{ label }}
    </div>
    <slot></slot>
  </div>
</template>

<script setup lang="ts">
// quasar currently has no option to pull the label out the proper way :(

export interface EntityLabelProps {
  label?: string;
}
defineProps<EntityLabelProps>();
</script>

<style>
.entity-label .q-field__bottom {
  padding-left: 0;
}
</style>
