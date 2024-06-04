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
import { FilterRuleType } from './Filter/filterRule';
import { useI18n } from 'src/composables/useI18n';
import { formatResultColumnValue } from './Result/formatResultColumnValue';
import { useLocalizedSort } from 'src/composables/useLocalizedSort';

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
  if (
    baseTableColumns.value.length > 0 &&
    attributesAsColumns.value.length > 0
  ) {
    const sortedAttributesAsColumns = [...attributesAsColumns.value].sort(
      (a, b) => localizedSortPredicate(a.label, b.label),
    );
    return [...baseTableColumns.value, ...sortedAttributesAsColumns];
  }

  return [];
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
  return baseTableColumnsWithAttributes.value.map((column) => {
    const isNum =
      column.type === FilterRuleType.Integer ||
      column.type === FilterRuleType.Float;

    const isAttribute = column.isAttribute;

    return {
      name: column.name,
      label: column.label,
      field: isAttribute ? column.name : column.tableColumnName,
      align: isAttribute ? 'center' : isNum ? 'right' : 'left',
      sortable: true,
      // only format base table columns because attributions must be treated
      // differently (see QueryResultTableCellAttribution.vue)
      ...(!isAttribute && {
        format: (value: string | number | Date | null | undefined) =>
          formatResultColumnValue({
            value,
            type: column.type ?? FilterRuleType.String,
            t,
          }),
      }),
    };
  });
});
</script>
