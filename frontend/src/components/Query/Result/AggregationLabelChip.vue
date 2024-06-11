<template>
  <span class="aggregation-label-chip"><slot></slot></span>
</template>

<style scoped>
.aggregation-label-chip {
  font-weight: normal;
  border: 1px solid var(--q-text-muted);
  color: var(--q-text-muted);
  border-radius: 2em;
  font-size: 0.625rem;
  padding: 0.25em 0.6em;
  line-height: 1em;
}
</style>
