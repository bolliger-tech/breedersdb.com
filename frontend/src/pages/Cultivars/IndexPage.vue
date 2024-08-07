<template>
  <PageLayout>
    <EntityContainer
      v-model:search="search"
      v-model:pagination="pagination"
      v-model:visible-columns="visibleColumns"
      :title="t('cultivars.title', 2)"
      :search-placeholder="t('entity.searchPlaceholderName')"
      :rows="data?.cultivars || []"
      :loading="fetching"
      :all-columns="columns"
      list-entities-path="/cultivars"
      add-entity-path="/cultivars/new"
      :view-entity-path-getter="(id) => `/cultivars/${id}`"
    />
  </PageLayout>
</template>

<script setup lang="ts">
import PageLayout from 'src/layouts/PageLayout.vue';
import { useQuery } from '@urql/vue';
import { ResultOf, graphql } from 'src/graphql';
import { computed, watch } from 'vue';
import { useI18n } from 'src/composables/useI18n';
import { useQueryArg } from 'src/composables/useQueryArg';
import EntityContainer from 'src/components/Entity/EntityContainer.vue';
import { cultivarFragment } from 'src/components/Cultivar/cultivarFragment';
import { useEntityIndexHooks } from 'src/composables/useEntityIndexHooks';

const { t, d } = useI18n();

const query = graphql(
  `
    query Cultivars(
      $limit: Int!
      $offset: Int!
      $orderBy: [cultivars_order_by!]
      $where: cultivars_bool_exp
      $withLot: Boolean = true
    ) {
      cultivars_aggregate {
        aggregate {
          count
        }
      }
      cultivars(
        where: $where
        limit: $limit
        offset: $offset
        order_by: $orderBy
      ) {
        ...cultivarFragment
      }
    }
  `,
  [cultivarFragment],
);

const { search, pagination, variables } = useEntityIndexHooks<typeof query>({
  defaultSortBy: 'display_name',
  searchColumns: ['display_name'],
});

const { data, fetching, error } = await useQuery({
  query,
  variables,
  context: { additionalTypenames: ['cultivars'] },
});

const cultivarsCount = computed(
  () => data.value?.cultivars_aggregate?.aggregate?.count || 0,
);

type Cultivar = ResultOf<typeof query>['cultivars'][0];

const columns = [
  {
    name: 'display_name',
    label: t('entity.commonColumns.displayName'),
    align: 'left' as const,
    field: 'display_name',
    sortable: true,
  },
  {
    name: 'lot',
    label: t('cultivars.fields.lot'),
    align: 'left' as const,
    field: (row: Cultivar) => row.lot?.display_name,
    sortable: true,
  },
  {
    name: 'modified',
    label: t('entity.commonColumns.modified'),
    align: 'left' as const,
    field: (row: Cultivar) => (row.modified ? d(row.modified, 'ymdHis') : null),
    sortable: true,
  },
  {
    name: 'created',
    label: t('entity.commonColumns.created'),
    align: 'left' as const,
    field: (row: Cultivar) => d(row.created, 'ymdHis'),
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
  cultivarsCount,
  (newValue) => {
    pagination.value.rowsNumber = newValue;
  },
  { immediate: true },
);
</script>
