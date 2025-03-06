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
      class="result-table-cell-attribution__overlay q-pa-md"
      :class="{ 'bg-grey-9': $q.dark.isActive }"
      no-parent-event
      self="top middle"
      max-width="450px"
      @hide="autocloseOverlay = true"
    >
      <q-btn
        v-if="autocloseOverlay == false"
        icon="close"
        dense
        flat
        round
        class="absolute-top-right q-ma-xs"
        @click="toggleOverlay"
      />
      <div style="max-width: calc(100% - 25px); min-height: 22px">
        <slot name="overlay-title"></slot>
      </div>
      <slot name="overlay-body"></slot>
    </q-menu>
  </AttributionValueChip>
</template>

<script lang="ts" setup>
import { ref, type Slot } from 'vue';
import AttributionValueChip from 'src/components/Attribution/AttributionValueChip.vue';

export interface AnalyzeResultTableCellAttributionProps {
  plant?: boolean | undefined;
  plantGroup?: boolean | undefined;
  cultivar?: boolean | undefined;
  lot?: boolean | undefined;
}

defineProps<AnalyzeResultTableCellAttributionProps>();

defineSlots<{
  label: Slot;
  'overlay-title': Slot;
  'overlay-body': Slot;
}>();

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
  width: 90dvw;
}

:global(.body--dark .result-table-cell-attribution__overlay) {
  box-shadow: none;
  border: 1px solid $grey-7;
}
</style>
