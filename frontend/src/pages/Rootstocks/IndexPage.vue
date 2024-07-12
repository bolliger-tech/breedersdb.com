<template>
  <PageLayout>
    <EntityContainer
      v-model:search="search"
      v-model:pagination="pagination"
      v-model:visible-columns="visibleColumns"
      :title="t('rootstocks.title', 2)"
      :search-placeholder="t('rootstocks.searchPlaceholder')"
      :rows="data?.rootstocks || []"
      :loading="fetching"
      :all-columns="columns"
      list-entities-path="/rootstocks"
      add-entity-path="/rootstocks/new"
      :view-entity-path-getter="(id) => `/rootstocks/${id}`"
    />
  </PageLayout>
  <router-view name="modal" />
</template>

<script setup lang="ts">
import PageLayout from 'src/layouts/PageLayout.vue';
import { useQuery } from '@urql/vue';
import { ResultOf, graphql } from 'src/graphql';
import { computed, watch } from 'vue';
import { useI18n } from 'src/composables/useI18n';
import { useQueryArg } from 'src/composables/useQueryArg';
import EntityContainer from 'src/components/Entity/EntityContainer.vue';
import { rootstockFragment } from 'src/components/Rootstock/rootstockFragment';
import { useEntityIndexHooks } from 'src/composables/useEntityIndexHooks';

const { t, d } = useI18n();

const query = graphql(
  `
    query Rootstocks(
      $limit: Int!
      $offset: Int!
      $orderBy: [rootstocks_order_by!]
      $where: rootstocks_bool_exp
    ) {
      rootstocks_aggregate {
        aggregate {
          count
        }
      }
      rootstocks(
        where: $where
        limit: $limit
        offset: $offset
        order_by: $orderBy
      ) {
        ...rootstockFragment
      }
    }
  `,
  [rootstockFragment],
);

const { search, pagination, variables } = useEntityIndexHooks<typeof query>();

const { data, fetching, error } = await useQuery({
  query,
  variables,
});

const rootstocksCount = computed(
  () => data.value?.rootstocks_aggregate?.aggregate?.count || 0,
);

type Rootstock = ResultOf<typeof query>['rootstocks'][0];

const columns = [
  {
    name: 'name',
    label: t('rootstocks.fields.name'),
    align: 'left' as const,
    field: 'name',
    sortable: true,
  },
  {
    name: 'modified',
    label: t('entity.commonColumns.modified'),
    align: 'left' as const,
    field: (row: Rootstock) =>
      row.modified ? d(row.modified, 'ymdHis') : null,
    sortable: true,
  },
  {
    name: 'created',
    label: t('entity.commonColumns.created'),
    align: 'left' as const,
    field: (row: Rootstock) => d(row.created, 'ymdHis'),
    sortable: true,
  },
];

const { queryArg: visibleColumns } = useQueryArg<string[]>({
  key: 'col',
  defaultValue: columns.map((column) => column.name).slice(0, 4),
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
  rootstocksCount,
  (newValue) => {
    pagination.value.rowsNumber = newValue;
  },
  { immediate: true },
);
</script>
