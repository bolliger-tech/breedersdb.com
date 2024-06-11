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
import { formatResultColumnValue } from './formatResultColumnValue';
import { ColumnType } from 'src/components/Query/ColumnDefinitions/columnTypes';
import QueryResultTableCellAttributionOverlay from './QueryResultTableCellAttributionOverlay.vue';
import QueryResultTableCellAttribution from './QueryResultTableCellAttribution.vue';
import { useQuasar } from 'quasar';
import { dataTypeToColumnType } from './dataTypeToColumnType';

export interface QueryResultTableCellAttributionValueProps {
  attribution: QueryAttributionsViewFields;
}

const props = defineProps<QueryResultTableCellAttributionValueProps>();

const { t } = useI18n();

const label = computed(() => {
  const type = dataTypeToColumnType(props.attribution.data_type);
  switch (type) {
    case ColumnType.String:
      return props.attribution.text_value || undefined;
    case ColumnType.Photo:
      return t('result.photo');
    case ColumnType.Boolean:
      return props.attribution.boolean_value ? t('result.yes') : t('result.no');
    case ColumnType.Date:
      return formatResultColumnValue({
        value: props.attribution.date_value,
        type,
        t,
      });
    case ColumnType.Integer:
      return formatResultColumnValue({
        value: props.attribution.integer_value,
        type,
        t,
      });
    case ColumnType.Float:
      return formatResultColumnValue({
        value: props.attribution.float_value,
        type: ColumnType.Float,
        t,
      });
    default:
      throw new Error(`Column type not implemented: ${type}`);
  }
});

const $q = useQuasar();
const color = computed(() => {
  let baseColor = '';
  if (props.attribution.tree_id) {
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
