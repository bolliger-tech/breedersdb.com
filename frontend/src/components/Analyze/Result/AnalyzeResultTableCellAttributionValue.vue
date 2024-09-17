<template>
  <AnalyzeResultTableCellAttribution
    :plant="!!attribution.plant_id"
    :plant-group="!!attribution.plant_group_id"
    :cultivar="!!attribution.cultivar_id"
    :lot="!!attribution.lot_id"
    :dark="dark"
  >
    <template #label>
      {{ label }}
    </template>
    <template #overlay>
      <AnalyzeResultTableCellAttributionOverlay :id="attribution.id" />
    </template>
  </AnalyzeResultTableCellAttribution>
</template>

<script lang="ts" setup>
import { computed } from 'vue';
import { AnalyzeAttributionsViewFields } from './filterToQuery';
import { useI18n } from 'src/composables/useI18n';
import {
  formatResultColumnValue,
  getAttributionValue,
} from 'src/utils/attributeUtils';
import { ColumnTypes } from 'src/utils/columnTypes';
import AnalyzeResultTableCellAttributionOverlay from './AnalyzeResultTableCellAttributionOverlay.vue';
import AnalyzeResultTableCellAttribution from './AnalyzeResultTableCellAttribution.vue';
import { dataTypeToColumnTypes } from 'src/utils/attributeUtils';

export interface AnalyzeResultTableCellAttributionValueProps {
  attribution: AnalyzeAttributionsViewFields;
  dark?: boolean;
}

const props = defineProps<AnalyzeResultTableCellAttributionValueProps>();

const { t, d, n } = useI18n();

const label = computed(() => {
  const type = dataTypeToColumnTypes(props.attribution.data_type);

  if (type === ColumnTypes.Photo) return t('analyze.result.photo');

  const value = getAttributionValue(props.attribution);
  return formatResultColumnValue({ value, type, d, n });
});
</script>
