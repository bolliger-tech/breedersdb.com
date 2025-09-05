<template>
  <q-td :props="cellProps">
    <AnalyzeResultTableCellAttributionValueAggregated
      v-if="aggregation"
      :attributions="attributions ?? []"
      :aggregation="aggregation"
    />

    <template v-else-if="attributions">
      <AnalyzeResultTableCellAttributionValue
        v-for="attribution of attributions"
        :key="attribution.id"
        :attribution="attribution"
      />
    </template>

    <template v-else>
      {{ n2semicolon(cellValue) }}
    </template>
  </q-td>
</template>

<script lang="ts" setup>
import { computed } from 'vue';
import type { QTableSlots } from 'quasar';
import AnalyzeResultTableCellAttributionValue from './AnalyzeResultTableCellAttributionValue.vue';
import AnalyzeResultTableCellAttributionValueAggregated from './AnalyzeResultTableCellAttributionValueAggregated.vue';
import type { AnalyzeCachedAttributionsFields } from './filterToQuery';
import { AttributionAggregation } from './attributionAggregationTypes';
import { n2semicolon } from 'src/utils/stringUtils';

type BodyCellParameters = Parameters<QTableSlots['body-cell']>[0];

export interface AnalyzeResultTableCellProps {
  cellProps: Omit<BodyCellParameters, 'key' | 'value'> &
    (
      | {
          key: string;
          value: null | number | string;
        }
      | {
          key: `attributes.${number}`;
          value: AnalyzeCachedAttributionsFields[];
        }
    );
}

const props = defineProps<AnalyzeResultTableCellProps>();

const cellValue = computed(() => {
  const value = props.cellProps.value;
  return null === value || undefined === value ? '' : value;
});

const attributions = computed(() => {
  if (props.cellProps.col.name.startsWith('attributes.')) {
    return (props.cellProps.value ?? []) as AnalyzeCachedAttributionsFields[];
  }
  return null;
});

const aggregation = computed(() => {
  const parts = props.cellProps.col.name.split('.');
  const last = parts[parts.length - 1];
  return (Object.values(AttributionAggregation) as string[]).includes(last)
    ? last
    : null;
});
</script>
