<template>
  <q-icon name="help" class="base-explainer">
    <q-tooltip
      max-width="min(90svw, 500px)"
      anchor="top middle"
      self="bottom middle"
      class="text-body2 shadow-1"
    >
      <slot></slot>
    </q-tooltip>
  </q-icon>
</template>

<style scoped>
.base-explainer {
  cursor: help;
  color: color-mix(in srgb, currentColor 50%, transparent);
  transform: translateY(-0.0625em);
}
</style>
