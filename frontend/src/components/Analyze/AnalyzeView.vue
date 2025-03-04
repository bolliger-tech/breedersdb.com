<template>
  <BaseNotFound v-if="show404" />
  <PageLayout v-else>
    <BaseGraphqlError v-if="error" :error="error" />
    <AnalyzeContainer
      v-else
      :initial-data="initialData"
      :base-table="baseTable"
      @base-filter-changed="(filter) => (baseFilter = filter)"
      @attribution-filter-changed="(filter) => (attributionFilter = filter)"
      @visible-columns-changed="(cols) => (visibleColumns = cols)"
    />
  </PageLayout>
</template>

<script setup lang="ts">
import PageLayout from 'src/layouts/PageLayout.vue';
import AnalyzeContainer from 'src/components/Analyze/AnalyzeContainer.vue';
import { graphql } from 'src/graphql';
import { computed, type Ref, ref, watch, type UnwrapRef } from 'vue';
import { useQuery } from '@urql/vue';
import BaseGraphqlError from 'src/components/Base/BaseGraphqlError.vue';
import { analyzeFiltersFragment } from 'src/components/Analyze/analyzeFiltersFragment';
import { useQuasar } from 'quasar';
import {
  BaseTable,
  FilterConjunction,
  FilterNode,
} from 'src/components/Analyze/Filter/filterNode';
import BaseNotFound from 'src/components/Base/BaseNotFound.vue';

export interface AnalyzeViewPageProps {
  analyzeId: 'new' | number;
  baseTable: Exclude<BaseTable, BaseTable.Attributions>;
}

export type InitialAnalyzeData = UnwrapRef<typeof initialData>;

const props = defineProps<AnalyzeViewPageProps>();

const BASE_FILTER_KEY = `breedersdb-analyze__base-filter--${props.baseTable}`;
const ATTRIBUTION_FILTER_KEY = `breedersdb-analyze__attribution-filter--${props.baseTable}`;
const VISIBLE_COLUMNS_KEY = `breedersdb-analyze__visible-columns--${props.baseTable}`;

const $q = useQuasar();

const query = graphql(
  `
    query AnalyzeFilters($id: Int!) {
      analyze_filters_by_pk(id: $id) {
        ...analyzeFiltersFragment
      }
    }
  `,
  [analyzeFiltersFragment],
);

const variables = computed(() => ({
  id: parseInt(props.analyzeId.toString()),
}));

const { data, error } = await useQuery({
  query,
  variables,
  pause: props.analyzeId === 'new',
  context: { additionalTypenames: ['analyze_filters'] },
});

const show404 =
  props.analyzeId !== 'new' &&
  !error.value &&
  !data.value?.analyze_filters_by_pk;

const initialData = computed(() => {
  return {
    id: props.analyzeId,
    name: data.value?.analyze_filters_by_pk?.name || '',
    note: data.value?.analyze_filters_by_pk?.note || null,
    baseFilter: getBaseFilter(),
    attributionFilter: getAttributionFilter(),
    visibleColumns: getVisibleColumns(),
  };
});

function getBaseFilter() {
  const filter =
    (props.analyzeId === 'new'
      ? $q.localStorage.getItem(BASE_FILTER_KEY)
      : data.value?.analyze_filters_by_pk?.base_filter) ||
    FilterNode.FilterRoot({
      childrensConjunction: FilterConjunction.And,
      baseTable: props.baseTable,
    });

  if (!filter) {
    return undefined;
  }

  return typeof filter !== 'string' ? JSON.stringify(filter) : filter;
}
function getAttributionFilter() {
  const filter =
    (props.analyzeId === 'new'
      ? $q.localStorage.getItem(ATTRIBUTION_FILTER_KEY)
      : data.value?.analyze_filters_by_pk?.attribution_filter) ||
    FilterNode.FilterRoot({
      childrensConjunction: FilterConjunction.And,
      baseTable: BaseTable.Attributions,
    });

  if (!filter) {
    return undefined;
  }

  return typeof filter !== 'string' ? JSON.stringify(filter) : filter;
}
function getVisibleColumns() {
  const columns =
    props.analyzeId === 'new'
      ? $q.localStorage.getItem<string[]>(VISIBLE_COLUMNS_KEY)
      : data.value?.analyze_filters_by_pk?.visible_columns;

  return columns || undefined;
}

const baseFilter: Ref<FilterNode | undefined> = ref(undefined);
const attributionFilter: Ref<FilterNode | undefined> = ref(undefined);
const visibleColumns: Ref<string[] | undefined> = ref(undefined);
watch(
  baseFilter,
  (filter) => {
    if (filter && filter.hasChildren()) {
      $q.localStorage.set(BASE_FILTER_KEY, filter);
    } else {
      $q.localStorage.remove(BASE_FILTER_KEY);
    }
  },
  { deep: true },
);
watch(
  attributionFilter,
  (filter) => {
    if (filter && filter.hasChildren()) {
      $q.localStorage.set(ATTRIBUTION_FILTER_KEY, filter);
    } else {
      $q.localStorage.remove(ATTRIBUTION_FILTER_KEY);
    }
  },
  { deep: true },
);
watch(
  visibleColumns,
  (cols) => {
    if (cols && cols.length > 0) {
      $q.localStorage.set(VISIBLE_COLUMNS_KEY, cols);
    } else {
      $q.localStorage.remove(VISIBLE_COLUMNS_KEY);
    }
  },
  { deep: true },
);
</script>
