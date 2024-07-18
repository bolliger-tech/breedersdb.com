<template>
  <ErrorNotFound v-if="show404" />
  <PageLayout v-else>
    <BaseGraphqlError v-if="error" :error="error" />
    <QueryContainer
      v-else
      :initial-data="initialData"
      :base-table="BaseTable.Cultivars"
      @base-filter-changed="(filter) => (baseFilter = filter)"
      @attribution-filter-changed="(filter) => (attributionFilter = filter)"
    />
  </PageLayout>
</template>

<script setup lang="ts">
import PageLayout from 'src/layouts/PageLayout.vue';
import QueryContainer from 'src/components/Query/QueryContainer.vue';
import { graphql } from 'src/graphql';
import { computed, Ref, ref, watch } from 'vue';
import { useQuery } from '@urql/vue';
import BaseGraphqlError from 'src/components/Base/BaseGraphqlError.vue';
import { analyzeFiltersFragment } from 'src/components/Query/analyzeFiltersFragment';
import { useQuasar } from 'quasar';
import { BaseTable, FilterNode } from 'src/components/Query/Filter/filterNode';
import ErrorNotFound from 'src/pages/ErrorNotFound.vue';

const BASE_FILTER_LOCAL_STORAGE_KEY = 'breedersdb-base-filter--cultivars';
const ATTRIBUTION_FILTER_LOCAL_STORAGE_KEY =
  'breedersdb-attribution-filter--cultivars';

export interface AnalyzeViewPageProps {
  analyzeId: 'new' | number;
}

const props = defineProps<AnalyzeViewPageProps>();

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
  };
});

function getBaseFilter() {
  const filter =
    props.analyzeId === 'new'
      ? $q.localStorage.getItem(BASE_FILTER_LOCAL_STORAGE_KEY)
      : data.value?.analyze_filters_by_pk?.base_filter;

  if (!filter) {
    return undefined;
  }

  return typeof filter !== 'string' ? JSON.stringify(filter) : filter;
}
function getAttributionFilter() {
  const filter =
    props.analyzeId === 'new'
      ? $q.localStorage.getItem(ATTRIBUTION_FILTER_LOCAL_STORAGE_KEY)
      : data.value?.analyze_filters_by_pk?.attribution_filter;

  if (!filter) {
    return undefined;
  }

  return typeof filter !== 'string' ? JSON.stringify(filter) : filter;
}

const baseFilter: Ref<FilterNode | undefined> = ref(undefined);
const attributionFilter: Ref<FilterNode | undefined> = ref(undefined);
watch(
  baseFilter,
  (filter) => {
    if (filter && filter.hasChildren()) {
      $q.localStorage.set(BASE_FILTER_LOCAL_STORAGE_KEY, filter);
    } else {
      $q.localStorage.remove(BASE_FILTER_LOCAL_STORAGE_KEY);
    }
  },
  { deep: true },
);
watch(
  attributionFilter,
  (filter) => {
    if (filter && filter.hasChildren()) {
      $q.localStorage.set(ATTRIBUTION_FILTER_LOCAL_STORAGE_KEY, filter);
    } else {
      $q.localStorage.remove(ATTRIBUTION_FILTER_LOCAL_STORAGE_KEY);
    }
  },
  { deep: true },
);
</script>
