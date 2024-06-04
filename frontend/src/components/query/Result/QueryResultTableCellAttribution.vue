<template>
  <q-chip
    :color="bgColor"
    :label="label"
    :outline="showOverlay && !autocloseOverlay"
    class="result-table-cell-attribution__chip"
    clickable
    size="sm"
    style="box-shadow: none"
    @click="toggleOverlay"
    @mouseenter="displayOverlay"
    @mouseleave="maybeCloseOverlay"
  >
    <q-menu
      v-model="showOverlay"
      :offset="[0, 8]"
      anchor="bottom middle"
      class="bg-grey-9 q-pa-sm"
      dark
      max-height="80vh"
      max-width="80vw"
      no-parent-event
      self="top middle"
      @hide="autocloseOverlay = true"
    >
      <QueryResultTableCellAttributionOverlay :id="attribution.id" />
    </q-menu>
  </q-chip>
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

const bgColor = computed(() => {
  if (showOverlay.value && !autocloseOverlay.value) {
    return 'accent';
  }

  if (props.attribution.tree_id) {
    return 'green-2';
  } else if (props.attribution.cultivar_id) {
    return 'amber-2';
  } else if (props.attribution.lot_id) {
    return 'grey-2';
  }

  throw new Error('Unknown attribution type');
});

function maybeCloseOverlay() {
  if (autocloseOverlay.value) {
    showOverlay.value = false;
  }
}

function displayOverlay() {
  showOverlay.value = true;
}

function toggleOverlay() {
  showOverlay.value = autocloseOverlay.value;
  autocloseOverlay.value = !autocloseOverlay.value;
}
</script>

<style scoped>
.result-table-cell-attribution__chip {
  max-width: 80px;
  cursor: pointer;
}
</style>
