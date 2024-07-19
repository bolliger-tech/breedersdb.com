<template>
  <PageLayout>
    <EntityContainer
      v-model:search="search"
      v-model:pagination="pagination"
      v-model:visible-columns="visibleColumns"
      :title="t('analyze.title', { entity: t('cultivars.title', 2) })"
      :search-placeholder="t('entity.searchPlaceholderName')"
      :rows="data?.analyze_filters || []"
      :loading="fetching"
      :all-columns="columns"
      list-entities-path="/cultivars/analyze"
      add-entity-path="/cultivars/analyze/new"
      :view-entity-path-getter="(id) => `/cultivars/analyze/${id}`"
    />
  </PageLayout>
</template>

<script setup lang="ts">
import PageLayout from 'src/layouts/PageLayout.vue';
import EntityContainer from 'src/components/Entity/EntityContainer.vue';
import { useI18n } from 'src/composables/useI18n';
import { useQuery } from '@urql/vue';
import { ResultOf, graphql } from 'src/graphql';
import { analyzeFiltersFragment } from 'src/components/Analyze/analyzeFiltersFragment';
import { useEntityIndexHooks } from 'src/composables/useEntityIndexHooks';
import { computed, watch } from 'vue';
import { useQueryArg } from 'src/composables/useQueryArg';

const { t, d } = useI18n();

const query = graphql(
  `
    query AnalyzeFilters(
      $limit: Int!
      $offset: Int!
      $orderBy: [analyze_filters_order_by!]
      $where: analyze_filters_bool_exp!
    ) {
      analyze_filters_aggregate {
        aggregate {
          count
        }
      }
      analyze_filters(
        where: { _and: [{ base_table: { _eq: CULTIVARS } }, $where] }
        limit: $limit
        offset: $offset
        order_by: $orderBy
      ) {
        ...analyzeFiltersFragment
      }
    }
  `,
  [analyzeFiltersFragment],
);

const { search, pagination, variables } = useEntityIndexHooks<typeof query>();

const { data, fetching, error } = await useQuery({
  query,
  variables,
});

const analyzeFiltersCount = computed(
  () => data.value?.analyze_filters_aggregate?.aggregate?.count || 0,
);

type AnalyzeFilter = ResultOf<typeof query>['analyze_filters'][0];

const columns = [
  {
    name: 'name',
    label: t('entity.commonColumns.name'),
    align: 'left' as const,
    field: 'name',
    sortable: true,
  },
  {
    name: 'modified',
    label: t('entity.commonColumns.modified'),
    align: 'left' as const,
    field: (row: AnalyzeFilter) =>
      row.modified ? d(row.modified, 'ymdHis') : null,
    sortable: true,
  },
  {
    name: 'created',
    label: t('entity.commonColumns.created'),
    align: 'left' as const,
    field: (row: AnalyzeFilter) => d(row.created, 'ymdHis'),
    sortable: true,
  },
];

const { queryArg: visibleColumns } = useQueryArg<string[]>({
  key: 'col',
  defaultValue: columns.map((column) => column.name).slice(0, 3),
  replace: true,
});

watch(
  error,
  (newValue) => {
    if (newValue) {
      throw newValue;
    }
  },
  { immediate: true },
);

watch(
  analyzeFiltersCount,
  (newValue) => {
    pagination.value.rowsNumber = newValue;
  },
  { immediate: true },
);
</script>
