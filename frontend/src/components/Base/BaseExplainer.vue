<template>
  <q-icon name="help" class="base-explainer">
    <q-tooltip><slot></slot></q-tooltip>
  </q-icon>
</template>

<style scoped>
.base-explainer {
  cursor: help;
  color: color-mix(in srgb, currentColor 50%, transparent);
}
</style>
