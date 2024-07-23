<template>
  <div
    class="result-table-cell-attribution__chip"
    :class="{ open: showOverlay }"
    @click="toggleOverlay"
    @mouseenter="displayOverlay"
    @mouseleave="maybeCloseOverlay"
  >
    <slot name="label"></slot>
    <q-menu
      v-model="showOverlay"
      :offset="[0, 8]"
      anchor="bottom middle"
      class="result-table-cell-attribution__overlay bg-grey-9 q-pa-sm"
      dark
      no-parent-event
      self="top middle"
      @hide="autocloseOverlay = true"
    >
      <slot name="overlay"></slot>
    </q-menu>
  </div>
</template>

<script lang="ts" setup>
import { ref } from 'vue';

export interface AnalyzeResultTableCellAttributionProps {
  color?: string;
}

defineProps<AnalyzeResultTableCellAttributionProps>();

const showOverlay = ref(false);
const autocloseOverlay = ref(true);

function maybeCloseOverlay() {
  if (autocloseOverlay.value) {
    showOverlay.value = false;
  }
}

function displayOverlay() {
  blurAnyFocusedElement(); // prevent scroll jumps if a filter input is focused
  showOverlay.value = true;
}

function toggleOverlay() {
  showOverlay.value = autocloseOverlay.value;
  autocloseOverlay.value = !autocloseOverlay.value;
}

function blurAnyFocusedElement() {
  if (document.activeElement instanceof HTMLElement) {
    document.activeElement.blur();
  }
}
</script>

<style scoped lang="scss">
.result-table-cell-attribution__chip {
  max-width: 80px;
  cursor: pointer;
  text-overflow: ellipsis;
  white-space: nowrap;
  overflow: hidden;
  font-size: 0.625rem;
  padding: 0.5em 0.9em;
  border-radius: 2em;
  line-height: 1;
  margin: 4px;
  display: inline-block;
  background-color: v-bind(color);
}

.result-table-cell-attribution__chip.open {
  background-color: $grey-9 !important;
  color: white;
}

:global(.result-table-cell-attribution__overlay) {
  width: 300px;
}

:global(.body--dark .result-table-cell-attribution__overlay) {
  box-shadow: none;
  border: 1px solid $grey-7;
}
</style>
