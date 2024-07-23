<template>
  <BaseGraphqlError v-if="error" :error="error" />
  <template v-else>
    <AnalyzeHeader
      :analyze-id="initialData.id"
      :name="initialData.name"
      :note="initialData.note"
      :base-filter="baseFilter"
      :attribution-filter="attributionFilter"
      :base-table="baseTable"
      :visible-columns="visibleColumns"
      :initial-data="initialData"
    />
    <AnalyzeFilter
      :base-table="baseTable"
      :initial-base-filter="initialData.baseFilter"
      :base-filter-columns="baseTableColumnsWithAttributes"
      :base-filter-columns-fetching="
        fetchingBaseTableColumns || fetchingAttributesAsColumns
      "
      :initial-attribution-filter="initialData.attributionFilter"
      :attribution-filter-columns="attributionFilterColumns"
      :attribution-filter-columns-fetching="attributionFilterColumnsFetching"
      @base-filter-changed="updateBaseFilter"
      @attribution-filter-changed="updateAttributionFilter"
    />
    <AnalyzeResult
      :base-table="baseTable"
      :base-filter="baseFilter"
      :attribution-filter="attributionFilter"
      :available-columns="resultColumns"
      :fetching-columns="
        fetchingBaseTableColumns ||
        fetchingAttributesAsColumns ||
        attributionFilterColumnsFetching
      "
      :initial-visible-columns="initialData.visibleColumns"
      @visible-columns-changed="updateVisibleColumns"
    />
  </template>
</template>

<script setup lang="ts">
import BaseGraphqlError from 'src/components/Base/BaseGraphqlError.vue';
import AnalyzeHeader from 'components/Analyze/Header/AnalyzeHeader.vue';
import AnalyzeFilter from 'src/components/Analyze/Filter/AnalyzeFilter.vue';
import AnalyzeResult from 'components/Analyze/Result/AnalyzeResult.vue';
import { BaseTable, FilterNode } from './Filter/filterNode';
import { useAttributesAsColumns } from './ColumnDefinitions/useAttributesAsColumns';
import { computed, onMounted, Ref, ref } from 'vue';
import { useFilterColumns } from './ColumnDefinitions/useFilterColumns';
import { QTableColumn } from 'quasar';
import { ColumnTypes } from 'src/utils/columnTypes';
import { useI18n } from 'src/composables/useI18n';
import {
  PrimitiveColumnValue,
  formatResultColumnValue,
} from 'src/utils/attributeUtils';
import { useLocalizedSort } from 'src/composables/useLocalizedSort';
import { AttributionAggregation } from './Result/attributionAggregationTypes';
import { useExplainFilters } from './useExplainFilters';
import type { InitialAnalyzeData } from './AnalyzeView.vue';

type ColumnValue = PrimitiveColumnValue | { [key: string]: ColumnValue };

export type AnalyzeContainerProps = {
  initialData: InitialAnalyzeData;
  baseTable: Exclude<BaseTable, BaseTable.Attributions>;
};

const props = defineProps<AnalyzeContainerProps>();

const emit = defineEmits<{
  baseFilterChanged: [filter: FilterNode | undefined];
  attributionFilterChanged: [filter: FilterNode | undefined];
  visibleColumnsChanged: [columns: string[] | undefined];
}>();

const { t } = useI18n();
const { localizedSortPredicate } = useLocalizedSort();

const {
  activate: fetchAttributesAsColumns,
  data: attributesAsColumns,
  error: attributesAsColumnsError,
  fetching: fetchingAttributesAsColumns,
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
          // differently (see AnalyzeResultTableCellAttribution.vue)
        },
      ];

      if (isNum || column.type === ColumnTypes.Date) {
        // add aggregations for numeric and date columns
        const aggs = [
          {
            type: AttributionAggregation.Count,
            label: t('analyze.result.aggregations.count'),
          },
          {
            type: AttributionAggregation.Max,
            label: t('analyze.result.aggregations.max'),
          },
          {
            type: AttributionAggregation.Min,
            label: t('analyze.result.aggregations.min'),
          },
          {
            type: AttributionAggregation.Mean,
            label: t('analyze.result.aggregations.mean'),
          },
          {
            type: AttributionAggregation.Median,
            label: t('analyze.result.aggregations.median'),
          },
          {
            type: AttributionAggregation.StdDev,
            label: t('analyze.result.aggregations.stdDev'),
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
      field: column.tableName.includes('.')
        ? `${column.tableName}.${column.tableColumnName}`
        : column.tableColumnName,
      align: isNum ? 'right' : 'left',
      sortable: true,
      format: (value: ColumnValue) => {
        if (column.type === ColumnTypes.Photo) {
          // this should never happen
          throw new Error('Photo columns are not supported');
        }

        const unnestedValue =
          value instanceof Object && !(value instanceof Date)
            ? (value[column.tableColumnName] as PrimitiveColumnValue)
            : value;

        return formatResultColumnValue({
          value: unnestedValue,
          type: column.type ?? ColumnTypes.String,
        });
      },
    };
  });
});

const baseFilter: Ref<FilterNode | undefined> = ref(undefined);
const attributionFilter: Ref<FilterNode | undefined> = ref(undefined);
const visibleColumns: Ref<string[] | undefined> = ref(undefined);
function updateBaseFilter(filter: FilterNode | undefined) {
  baseFilter.value = filter;
  emit('baseFilterChanged', filter);
}
function updateAttributionFilter(filter: FilterNode | undefined) {
  attributionFilter.value = filter;
  emit('attributionFilterChanged', filter);
}
function updateVisibleColumns(columns: string[] | undefined) {
  visibleColumns.value = columns;
  emit('visibleColumnsChanged', columns);
}

const { provide: provideExplainFilters } = useExplainFilters();
provideExplainFilters();
</script>
