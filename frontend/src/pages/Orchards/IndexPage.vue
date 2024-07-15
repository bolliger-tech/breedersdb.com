<template>
  <PageLayout>
    <EntityContainer
      v-model:search="search"
      v-model:pagination="pagination"
      v-model:visible-columns="visibleColumns"
      :title="t('orchards.title', 2)"
      :search-placeholder="t('entity.searchPlaceholderName')"
      :rows="data?.orchards || []"
      :loading="fetching"
      :all-columns="columns"
      list-entities-path="/orchards"
      add-entity-path="/orchards/new"
      :view-entity-path-getter="(id) => `/orchards/${id}`"
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
import { orchardFragment } from 'src/components/Orchard/orchardFragment';
import { useEntityIndexHooks } from 'src/composables/useEntityIndexHooks';

const { t, d } = useI18n();

const query = graphql(
  `
    query Orchards(
      $limit: Int!
      $offset: Int!
      $orderBy: [orchards_order_by!]
      $where: orchards_bool_exp
    ) {
      orchards_aggregate {
        aggregate {
          count
        }
      }
      orchards(
        where: $where
        limit: $limit
        offset: $offset
        order_by: $orderBy
      ) {
        ...orchardFragment
      }
    }
  `,
  [orchardFragment],
);

const { search, pagination, variables } = useEntityIndexHooks<typeof query>();

const { data, fetching, error } = await useQuery({
  query,
  variables,
});

const orchardsCount = computed(
  () => data.value?.orchards_aggregate?.aggregate?.count || 0,
);

type Orchard = ResultOf<typeof query>['orchards'][0];

const columns = [
  {
    name: 'name',
    label: t('entity.commonColumns.name'),
    align: 'left' as const,
    field: 'name',
    sortable: true,
  },
  {
    name: 'disabled',
    label: t('entity.commonColumns.disabled'),
    align: 'left' as const,
    field: (row: Orchard) => (row.disabled ? t('base.yes') : t('base.no')),
    sortable: true,
  },
  {
    name: 'modified',
    label: t('entity.commonColumns.modified'),
    align: 'left' as const,
    field: (row: Orchard) => (row.modified ? d(row.modified, 'ymdHis') : null),
    sortable: true,
  },
  {
    name: 'created',
    label: t('entity.commonColumns.created'),
    align: 'left' as const,
    field: (row: Orchard) => d(row.created, 'ymdHis'),
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
  orchardsCount,
  (newValue) => {
    pagination.value.rowsNumber = newValue;
  },
  { immediate: true },
);
</script>
