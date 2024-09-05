<template>
  <AttributionValueChip
    class="result-table-cell-attribution__chip"
    :class="{ open: showOverlay }"
    :plant="plant"
    :plant-group="plantGroup"
    :cultivar="cultivar"
    :lot="lot"
    max-width="80px"
    @click.stop="toggleOverlay"
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
      max-width="450px"
      @hide="autocloseOverlay = true"
    >
      <slot name="overlay"></slot>
    </q-menu>
  </AttributionValueChip>
</template>

<script lang="ts" setup>
import { ref } from 'vue';
import AttributionValueChip from 'src/components/Attribution/AttributionValueChip.vue';

export interface AnalyzeResultTableCellAttributionProps {
  plant?: boolean;
  plantGroup?: boolean;
  cultivar?: boolean;
  lot?: boolean;
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
  cursor: pointer;
}

.result-table-cell-attribution__chip.open {
  background-color: $grey-9 !important;
  color: white;
}

:global(.result-table-cell-attribution__overlay) {
  width: 90svw;
}

:global(.body--dark .result-table-cell-attribution__overlay) {
  box-shadow: none;
  border: 1px solid $grey-7;
}
</style>
