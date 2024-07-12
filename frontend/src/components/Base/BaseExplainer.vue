<template>
  <q-icon name="help" class="base-explainer">
    <q-tooltip style="width: min(90svw, 500px)"><slot></slot></q-tooltip>
  </q-icon>
</template>

<style scoped>
.base-explainer {
  cursor: help;
  color: color-mix(in srgb, currentColor 50%, transparent);
}
</style>
