<template>
  <h3>{{ t('analyze.result.title') }}</h3>

  <BaseGraphqlError v-if="error" :error="error" />

  <template v-else>
    <QueryResultTable
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
import QueryResultTable, {
  QueryResultTableProps,
} from 'components/Query/Result/QueryResultTable.vue';
import { useQueryStore } from '../useQueryStore';
import { BaseTable, FilterConjunction, FilterNode } from '../Filter/filterNode';
import { QueryResult, filterToQuery } from './filterToQuery';
import { useQuery } from '@urql/vue';
import BaseGraphqlError from 'src/components/Base/BaseGraphqlError.vue';
import { QTableColumn, useQuasar } from 'quasar';
import { useI18n } from 'src/composables/useI18n';
import { debounce } from 'quasar';
import { AttributionAggregation } from './attributionAggregationTypes';
import { useRefreshAttributionsView } from 'src/composables/useRefreshAttributionsView';

export interface QueryResultProps {
  baseTable: BaseTable;
  availableColumns: QTableColumn[];
  fetchingColumns: boolean;
}

const props = defineProps<QueryResultProps>();

const { t } = useI18n();
const store = useQueryStore();

const isValid = computed(
  () =>
    (store.baseFilter?.isValid() ?? true) &&
    (store.attributionFilter?.isValid() ?? true),
);

const baseFilter = computed(
  () =>
    (store.baseFilter as FilterNode) ||
    FilterNode.FilterRoot({
      childrensConjunction: FilterConjunction.And,
      baseTable: BaseTable.Cultivars,
    }),
);
const attributionFilter = computed(
  () =>
    (store.attributionFilter as FilterNode) ||
    FilterNode.FilterRoot({
      childrensConjunction: FilterConjunction.And,
      baseTable: BaseTable.Attributions,
    }),
);

const $q = useQuasar();
function getLastSelectedColumns() {
  const cols: string[] | null = $q.localStorage.getItem(
    `breedersdb-query-visible-columns--${props.baseTable}`,
  );
  return cols?.filter((c) =>
    props.availableColumns.find((ac) => ac.name === c),
  );
}
const selectedColumns = ref<string[]>([]);
const defaultColumns = computed(() => {
  return props.availableColumns.slice(0, 5).map((c) => c.name);
});
const visibleColumns = computed({
  get: () =>
    selectedColumns.value.length > 0
      ? selectedColumns.value
      : getLastSelectedColumns() ?? defaultColumns.value,
  set: (cols: string[]) => {
    selectedColumns.value = cols;
    $q.localStorage.set(
      `breedersdb-query-visible-columns--${props.baseTable}`,
      cols,
    );
  },
});

const columnsToFetch = ref<string[]>([]);
// use watch() instead of setting it in the visible columns setter
// to avoid starting empty
watch(visibleColumns, (newCols, oldCols) => {
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
    uniqueNewCols.length > oldCols.length ||
    !uniqueNewCols.every((c) => oldCols.includes(c))
  ) {
    // only update columnsToFetch if columns were added but not if the order
    // changed or columns were removed. so a refetch is only triggered
    // when really needed.
    columnsToFetch.value = uniqueNewCols;
  }
});

const pagination = ref<QueryResultTableProps['pagination']>({
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

// debounce fetch queries
const debouncedFetching = ref(false);
const queryData = ref(
  filterToQuery({
    baseFilter: baseFilter.value,
    attributionFilter: attributionFilter.value,
    columns: columnsToFetch.value,
    pagination: pagination.value,
  }),
);
watch(
  [
    baseFilter,
    attributionFilter,
    columnsToFetch,
    pagination,
    () => lastRefresh,
  ],
  () => {
    debouncedFetching.value = true;
    debounce(() => {
      queryData.value = filterToQuery({
        baseFilter: baseFilter.value,
        attributionFilter: attributionFilter.value,
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
} = await useQuery<QueryResult>({
  query,
  variables,
  pause: !isValid.value,
});

const rows = computed(() => {
  if (!data?.value) {
    return [];
  }

  return data.value[props.baseTable].map((row) => {
    // replace double underscores (which were added for graphql
    // compatibility) with dots so the columns have the same name as in
    // `prop.availableColumns`
    // e.g. `plants__rows__name` -> `plants.rows.name`
    const entries = Object.entries(row);
    const renamed = entries.map(([key, value]) => [
      key.replaceAll('__', '.'),
      value,
    ]);
    return Object.fromEntries(renamed) as QueryResultTableProps['rows'][0];
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
