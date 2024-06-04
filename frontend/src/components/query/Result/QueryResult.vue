<template>
  <h3>{{ t('result.title') }}</h3>

  <BaseGraphqlError v-if="error" :error="error" />

  <template v-else>
    <QueryResultTable
      v-model:visible-columns="visibleColumns"
      :loading="fetching || fetchingColumns"
      :rows="rows"
      :all-columns="availableColumns"
      :data-is-fresh="isValid"
    />
    <!-- <ResultDownload :enabled="!fetching && !!result" /> -->
  </template>

  <details>
    <summary><h3>Base Filter</h3></summary>
    <pre style="font-size: 12px">{{
      JSON.stringify(store.baseFilter, undefined, 2)
    }}</pre>
  </details>
  <details open>
    <summary><h3>Query</h3></summary>
    <pre style="font-size: 12px" data-test="query">{{ query }}</pre>
    <pre style="font-size: 12px" data-test="variables">{{ variables }}</pre>
  </details>

  <details open>
    <summary><h3>Results</h3></summary>
    <p>Count: {{ data?.cultivars.length || 0 }}</p>
    <pre style="font-size: 12px">{{ fetching || error || data }}</pre>
  </details>
</template>

<script lang="ts" setup>
import { computed, ref } from 'vue';
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

const $q = useQuasar();
function getLastSelectedColumns() {
  const cols: string[] | null = $q.localStorage.getItem(
    `query_visible_columns--${props.baseTable}`,
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
    $q.localStorage.set(`query_visible_columns--${props.baseTable}`, cols);
  },
});

const queryData = computed(() =>
  filterToQuery({
    filter: baseFilter.value,
    columns: visibleColumns.value,
  }),
);

const query = computed(() => queryData.value.query);
const variables = computed(() => queryData.value.variables);

// TODO: update materialized view
// TODO: debounce
const { data, fetching, error } = await useQuery<QueryResult>({
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
    // e.g. `trees__rows__name` -> `trees.rows.name`
    const entries = Object.entries(row);
    const renamed = entries.map(([key, value]) => [
      key.replaceAll('__', '.'),
      value,
    ]);
    return Object.fromEntries(renamed) as QueryResultTableProps['rows'][0];
  });
});
</script>
