<template>
  <BaseGraphqlError v-if="error" :error="error" />
  <template v-else>
    <QueryFilter
      :base-table="baseTable"
      :base-filter-columns="baseTableColumnsWithAttributes"
      :attribution-filter-columns="attributionFilterColumns"
      :fetching="fetching"
    />
    <QueryResult
      :base-table="baseTable"
      :available-columns="resultColumns"
      :fetching-columns="fetching"
    />
  </template>
</template>

<script setup lang="ts">
import BaseGraphqlError from 'src/components/Base/BaseGraphqlError.vue';
import QueryFilter from 'src/components/Query/Filter/QueryFilter.vue';
import QueryResult from 'src/components/Query/Result/QueryResult.vue';
import { BaseTable } from './Filter/filterNode';
import { useAttributesAsColumns } from './ColumnDefinitions/useAttributesAsColumns';
import { computed, onMounted } from 'vue';
import { useFilterColumns } from './ColumnDefinitions/useFilterColumns';
import { QTableColumn } from 'quasar';
import { ColumnTypes } from 'src/utils/columnTypes';
import { useI18n } from 'src/composables/useI18n';
import { formatResultColumnValue } from 'src/utils/attributeUtils';
import { useLocalizedSort } from 'src/composables/useLocalizedSort';
import { AttributionAggregation } from './Result/attributionAggregationTypes';

export interface QueryContainerProps {
  baseTable: BaseTable;
}

const props = defineProps<QueryContainerProps>();
const { t } = useI18n();
const { localizedSortPredicate } = useLocalizedSort();

const {
  activate: fetchAttributesAsColumns,
  data: attributesAsColumns,
  error: attributesAsColumnsError,
  fetching: fetchingAsColumnsAttributes,
} = useAttributesAsColumns();
onMounted(() => fetchAttributesAsColumns());

const baseTableColumnLoader = useFilterColumns({
  table: props.baseTable,
});
if (!baseTableColumnLoader) {
  throw new Error('Base table not found');
}
const {
  loadData: fetchBaseTableColumns,
  data: baseTableColumns,
  error: baseTableColumnsError,
  fetching: fetchingBaseTableColumns,
} = baseTableColumnLoader;
onMounted(() => fetchBaseTableColumns());

const baseTableColumnsWithAttributes = computed(() => {
  const sortedAttributesAsColumns = [...attributesAsColumns.value].sort(
    (a, b) => localizedSortPredicate(a.label, b.label),
  );
  return [...baseTableColumns.value, ...sortedAttributesAsColumns];
});

const attributionColumnLoader = useFilterColumns({
  table: BaseTable.Attributions,
});
if (!attributionColumnLoader) {
  throw new Error('Attributions table not found');
}
const {
  loadData: fetchAttributionViewColumns,
  data: attributionFilterColumns,
  error: attributionViewColumnsError,
  fetching: attributionFilterColumnsFetching,
} = attributionColumnLoader;
onMounted(() => fetchAttributionViewColumns());

const fetching = computed(
  () =>
    fetchingBaseTableColumns.value ||
    fetchingAsColumnsAttributes.value ||
    attributionFilterColumnsFetching.value,
);
const error = computed(
  () =>
    baseTableColumnsError.value ||
    attributesAsColumnsError.value ||
    attributionViewColumnsError.value,
);

const resultColumns = computed<QTableColumn[]>(() => {
  return baseTableColumnsWithAttributes.value.flatMap((column) => {
    const isNum =
      column.type === ColumnTypes.Integer ||
      column.type === ColumnTypes.Rating ||
      column.type === ColumnTypes.Float;

    if (column.isAttribute) {
      const attributions: QTableColumn[] = [
        // individual attribution values (non aggregated)
        {
          name: column.name,
          label: column.label,
          field: column.name,
          align: 'center',
          sortable: false,
          // only format base table columns because attributions must be treated
          // differently (see QueryResultTableCellAttribution.vue)
        },
      ];

      if (isNum || column.type === ColumnTypes.Date) {
        // add aggregations for numeric and date columns
        const aggs = [
          {
            type: AttributionAggregation.Count,
            label: t('result.aggregations.count'),
          },
          {
            type: AttributionAggregation.Max,
            label: t('result.aggregations.max'),
          },
          {
            type: AttributionAggregation.Min,
            label: t('result.aggregations.min'),
          },
          {
            type: AttributionAggregation.Mean,
            label: t('result.aggregations.mean'),
          },
          {
            type: AttributionAggregation.Median,
            label: t('result.aggregations.median'),
          },
          {
            type: AttributionAggregation.StdDev,
            label: t('result.aggregations.stdDev'),
          },
        ];
        aggs.forEach((agg) => {
          attributions.push({
            name: `${column.name}.${agg.type}`,
            label: `${column.label} > ${agg.label}`,
            field: column.name,
            align: 'center',
            sortable: false,
          });
        });
      }
      return attributions;
    }

    return {
      name: column.name,
      label: column.label,
      field: column.tableColumnName,
      align: isNum ? 'right' : 'left',
      sortable: true,
      format: (value: string | number | Date | null | undefined) =>
        formatResultColumnValue({
          value,
          type: column.type ?? ColumnTypes.String,
        }),
    };
  });
});
</script>
