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
      {{ cellValue }}
    </template>
  </q-td>
</template>

<script lang="ts" setup>
import { computed } from 'vue';
import { QTableSlots } from 'quasar';
import AnalyzeResultTableCellAttributionValue from './AnalyzeResultTableCellAttributionValue.vue';
import AnalyzeResultTableCellAttributionValueAggregated from './AnalyzeResultTableCellAttributionValueAggregated.vue';
import { QueryAttributionsViewFields } from './filterToQuery';
import { AttributionAggregation } from './attributionAggregationTypes';

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
          value: QueryAttributionsViewFields[];
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
    return (props.cellProps.value ?? []) as QueryAttributionsViewFields[];
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
