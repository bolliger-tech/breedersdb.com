<template>
  <q-td :props="cellProps">
    <template v-if="Array.isArray(cellValue)">
      <QueryResultTableCellAttribution
        v-for="attribution of cellValue"
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
import QueryResultTableCellAttribution from './QueryResultTableCellAttribution.vue';
import { QueryAttributionsViewFields } from './filterToQuery';

type BodyCellParameters = Parameters<QTableSlots['body-cell']>[0];

export interface QueryResultTableCellProps {
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

const props = defineProps<QueryResultTableCellProps>();

const cellValue = computed(() => {
  const value = props.cellProps.value;
  return null === value || undefined === value ? '' : value;
});
</script>

<style scoped></style>
