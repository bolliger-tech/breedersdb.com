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
import { formatResultColumnValue } from 'src/utils/attributeUtils';
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
  switch (type) {
    case ColumnTypes.String:
      return props.attribution.text_value || undefined;
    case ColumnTypes.Photo:
      return t('result.photo');
    case ColumnTypes.Boolean:
      return props.attribution.boolean_value ? '✓' : '✕';
    case ColumnTypes.Date:
      return formatResultColumnValue({
        value: props.attribution.date_value,
        type,
      });
    case ColumnTypes.Integer:
    case ColumnTypes.Rating:
      return formatResultColumnValue({
        value: props.attribution.integer_value,
        type,
      });
    case ColumnTypes.Float:
      return formatResultColumnValue({
        value: props.attribution.float_value,
        type: ColumnTypes.Float,
      });
    default:
      throw new Error(`Column type not implemented: ${type}`);
  }
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
