<template>
  <div
    class="result-table-cell-attribution__chip"
    :class="{
      tree: props.attribution.tree_id,
      cultivar: props.attribution.cultivar_id,
      lot: props.attribution.lot_id,
      open: showOverlay,
    }"
    @click="toggleOverlay"
    @mouseenter="displayOverlay"
    @mouseleave="maybeCloseOverlay"
  >
    {{ label }}
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
      <QueryResultTableCellAttributionOverlay :id="attribution.id" />
    </q-menu>
  </div>
</template>

<script lang="ts" setup>
import { computed, ref } from 'vue';
import { QueryAttributionsViewFields } from './filterToQuery';
import { useI18n } from 'src/composables/useI18n';
import { formatResultColumnValue } from './formatResultColumnValue';
import { ColumnType } from 'src/components/Query/ColumnDefinitions/columnTypes';
import QueryResultTableCellAttributionOverlay from './QueryResultTableCellAttributionOverlay.vue';

export interface QueryResultTableCellAttributionProps {
  attribution: QueryAttributionsViewFields;
}

const props = defineProps<QueryResultTableCellAttributionProps>();

const { t } = useI18n();

const showOverlay = ref(false);
const autocloseOverlay = ref(true);

const label = computed(() => {
  switch (props.attribution.data_type) {
    case 'TEXT':
      return props.attribution.text_value || undefined;
    case 'PHOTO':
      return t('result.photo');
    case 'BOOLEAN':
      return props.attribution.boolean_value ? t('result.yes') : t('result.no');
    case 'DATE':
      return formatResultColumnValue({
        value: props.attribution.date_value,
        type: ColumnType.Date,
        t,
      });
    case 'INTEGER':
      return formatResultColumnValue({
        value: props.attribution.integer_value,
        type: ColumnType.Integer,
        t,
      });
    case 'FLOAT':
      return formatResultColumnValue({
        value: props.attribution.float_value,
        type: ColumnType.Float,
        t,
      });
    default:
      throw new Error(`Unknown data type: ${props.attribution.data_type}`);
  }
});

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

<style lang="scss">
@use 'sass:color';

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
}

.result-table-cell-attribution__chip.open {
  background-color: $grey-9 !important;
  color: white;
}

.result-table-cell-attribution__chip.tree {
  background-color: $green-2;
}
.result-table-cell-attribution__chip.cultivar {
  background-color: $amber-2;
}
.result-table-cell-attribution__chip.lot {
  background-color: $blue-2;
}

.body--dark {
  .result-table-cell-attribution__chip.tree {
    background-color: color.scale($green-10, $alpha: -66%);
  }
  .result-table-cell-attribution__chip.cultivar {
    background-color: color.scale($amber-10, $alpha: -66%);
  }
  .result-table-cell-attribution__chip.lot {
    background-color: color.scale($blue-10, $alpha: -66%);
  }
}

.body--dark {
  .result-table-cell-attribution__overlay {
    box-shadow: none;
    width: 300px;
    border: 1px solid $grey-7;
  }
}
</style>
