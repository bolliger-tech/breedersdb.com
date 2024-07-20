<template>
  <h3>{{ t('analyze.result.title') }}</h3>

  <BaseGraphqlError v-if="error" :error="error" />

  <template v-else>
    <AnalyzeResultTable
      v-model:visible-columns="visibleColumns"
      v-model:pagination="pagination"
      :loading="fetching || fetchingColumns || debouncedFetching"
      :rows="rows"
      :all-columns="availableColumns"
      :data-is-fresh="isValid"
    />
    <!-- TODO: <ResultDownload :enabled="!fetching && !!result" /> -->
    <div v-if="lastRefreshDate" class="text-caption">
      {{
        t('analyze.result.lastRefresh', {
          date: lastRefreshDate?.toLocaleString(),
        })
      }}
    </div>

    <div style="display: none">
      <!-- leave for testing and debugging -->
      <pre data-test="query">{{ query }}</pre>
      <pre data-test="variables">{{ variables }}</pre>
    </div>
  </template>
</template>

<script lang="ts" setup>
import { computed, ref, watch } from 'vue';
import AnalyzeResultTable, {
  AnalyzeResultTableProps,
} from 'components/Analyze/Result/AnalyzeResultTable.vue';
import { BaseTable, FilterConjunction, FilterNode } from '../Filter/filterNode';
import { AnalyzeResult, filterToQuery } from './filterToQuery';
import { useQuery } from '@urql/vue';
import BaseGraphqlError from 'src/components/Base/BaseGraphqlError.vue';
import { QTableColumn } from 'quasar';
import { useI18n } from 'src/composables/useI18n';
import { debounce } from 'quasar';
import { AttributionAggregation } from './attributionAggregationTypes';
import { useRefreshAttributionsView } from 'src/composables/useRefreshAttributionsView';

export interface AnalyzeResultProps {
  baseTable: BaseTable;
  availableColumns: QTableColumn[];
  fetchingColumns: boolean;
  baseFilter: FilterNode | undefined;
  attributionFilter: FilterNode | undefined;
  initialVisibleColumns: string[] | undefined;
}

const props = defineProps<AnalyzeResultProps>();

const emit = defineEmits<{
  'visible-columns-changed': [columns: string[] | undefined];
}>();

const { t } = useI18n();

const isValid = computed(
  () =>
    (props.baseFilter?.isValid() ?? true) &&
    (props.attributionFilter?.isValid() ?? true),
);

const selectedColumns = ref<string[]>([]);
const defaultColumns = computed(() => {
  return props.availableColumns.slice(0, 5).map((c) => c.name);
});
const validInitialVisibleColumns = computed(() =>
  props.initialVisibleColumns?.filter((vc) =>
    props.availableColumns.find((ac) => ac.name === vc),
  ),
);
const visibleColumns = computed({
  get: () =>
    selectedColumns.value.length > 0
      ? selectedColumns.value
      : validInitialVisibleColumns.value ?? defaultColumns.value,
  set: (cols: string[]) => {
    selectedColumns.value = cols;
  },
});

const columnsToFetch = ref<string[]>([]);
// use watch() instead of setting it in the visible columns setter
// to avoid starting empty
watch(
  visibleColumns,
  (newCols, oldCols) => {
    // fetch raw values for aggregation columns
    // e.g. `attributes.123.count` -> `attributes.123`
    const colsWithoutAggregates = newCols.map((c) => {
      const parts = c.split('.');
      const last = parts[parts.length - 1];
      return (Object.values(AttributionAggregation) as string[]).includes(last)
        ? parts.slice(0, -1).join('.')
        : c;
    });
    const uniqueNewCols = [...new Set(colsWithoutAggregates)];

    if (
      !oldCols ||
      uniqueNewCols.length > oldCols.length ||
      !uniqueNewCols.every((c) => oldCols.includes(c))
    ) {
      // only update columnsToFetch if columns were added but not if the order
      // changed or columns were removed. so a refetch is only triggered
      // when really needed.
      columnsToFetch.value = uniqueNewCols;
    }

    emit('visible-columns-changed', newCols);
  },
  { immediate: true },
);

const pagination = ref<AnalyzeResultTableProps['pagination']>({
  sortBy: null,
  descending: false,
  page: 1,
  rowsPerPage: 100,
  rowsNumber: 0,
});

const { executeMutation: refreshDbView } = useRefreshAttributionsView();
const { data: lastRefresh, error: refreshError } = await refreshDbView({});

const lastRefreshDate = computed(() => {
  return lastRefresh?.refresh_attributions_view[0]?.last_check
    ? new Date(lastRefresh.refresh_attributions_view[0].last_check as string)
    : null;
});

const emptyBaseFilter = FilterNode.FilterRoot({
  childrensConjunction: FilterConjunction.And,
  baseTable: props.baseTable,
});

const emptyAttributionFilter = FilterNode.FilterRoot({
  childrensConjunction: FilterConjunction.And,
  baseTable: BaseTable.Attributions,
});

// debounce fetch queries
const debouncedFetching = ref(false);
const queryData = ref(
  filterToQuery({
    baseFilter: props.baseFilter || emptyBaseFilter,
    attributionFilter: props.attributionFilter || emptyAttributionFilter,
    columns: columnsToFetch.value,
    pagination: pagination.value,
  }),
);
watch(
  [
    () => props.baseFilter,
    () => props.attributionFilter,
    columnsToFetch,
    pagination,
    () => lastRefresh,
  ],
  () => {
    debouncedFetching.value = true;
    debounce(() => {
      queryData.value = filterToQuery({
        baseFilter: props.baseFilter || emptyBaseFilter,
        attributionFilter: props.attributionFilter || emptyAttributionFilter,
        columns: columnsToFetch.value,
        pagination: pagination.value,
      });
      debouncedFetching.value = false;
    }, 500)();
  },
  { deep: true },
);

const query = computed(() => queryData.value.query);
const variables = computed(() => queryData.value.variables);

const {
  data,
  fetching,
  error: queryError,
} = await useQuery<AnalyzeResult>({
  query,
  variables,
});

const rows = computed(() => {
  if (!data?.value) {
    return [];
  }

  return data.value[props.baseTable].map((row) => {
    // replace double underscores (which were added for graphql
    // compatibility) with dots so the columns have the same name as in
    // `prop.availableColumns`
    // e.g. `plants__plant_rows__name` -> `plants.plant_rows.name`
    const entries = Object.entries(row);
    const renamed = entries.map(([key, value]) => [
      key.replaceAll('__', '.'),
      value,
    ]);
    return Object.fromEntries(renamed) as AnalyzeResultTableProps['rows'][0];
  });
});

const error = computed(() => refreshError || queryError.value);

const totalResults = computed(() => {
  if (!data?.value) return 0;
  return data.value[`${props.baseTable}_aggregate`].aggregate.count;
});
watch(
  totalResults,
  (newCount) => {
    pagination.value.rowsNumber = newCount;
  },
  { immediate: true },
);
</script>
