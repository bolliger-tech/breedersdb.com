<template>
  <QueryResultTableCellAttribution :color="color">
    <template #label>
      {{ label }}
    </template>
    <template #overlay>
      <QueryResultTableCellAttributionOverlay :id="attribution.id" />
    </template>
  </QueryResultTableCellAttribution>
</template>

<script lang="ts" setup>
import { computed } from 'vue';
import { QueryAttributionsViewFields } from './filterToQuery';
import { useI18n } from 'src/composables/useI18n';
import {
  formatResultColumnValue,
  getAttributeValue,
} from 'src/utils/attributeUtils';
import { ColumnTypes } from 'src/utils/columnTypes';
import QueryResultTableCellAttributionOverlay from './QueryResultTableCellAttributionOverlay.vue';
import QueryResultTableCellAttribution from './QueryResultTableCellAttribution.vue';
import { useQuasar } from 'quasar';
import { dataTypeToColumnTypes } from 'src/utils/attributeUtils';

export interface QueryResultTableCellAttributionValueProps {
  attribution: QueryAttributionsViewFields;
}

const props = defineProps<QueryResultTableCellAttributionValueProps>();

const { t } = useI18n();

const label = computed(() => {
  const type = dataTypeToColumnTypes(props.attribution.data_type);

  if (type === ColumnTypes.Photo) return t('analyze.result.photo');

  const value = getAttributeValue(props.attribution);
  return formatResultColumnValue({ value, type });
});

const $q = useQuasar();
const color = computed(() => {
  let baseColor = '';
  if (props.attribution.plant_id) {
    baseColor = '#c8e6c9'; // green-2
  } else if (props.attribution.cultivar_id) {
    baseColor = '#ffecb3'; // amber-2
  } else if (props.attribution.lot_id) {
    baseColor = '#bbdefb'; // blue-2
  }

  return $q.dark.isActive
    ? `color-mix(in srgb, ${baseColor} 33%, transparent)`
    : baseColor;
});
</script>
