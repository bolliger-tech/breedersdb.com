<template>
  <PageLayout>
    <EntityContainer
      v-model:search="search"
      v-model:pagination="pagination"
      v-model:visible-columns="visibleColumns"
      :title="t('lots.title', 2)"
      :search-placeholder="t('entity.searchPlaceholderName')"
      :rows="data?.lots || []"
      :loading="fetching"
      :all-columns="columns"
      list-entities-path="/lots"
      add-entity-path="/lots/new"
      :view-entity-path-getter="(id) => `/lots/${id}`"
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
import { lotFragment } from 'src/components/Lot/lotFragment';
import { useEntityIndexHooks } from 'src/composables/useEntityIndexHooks';

const { t, d, n } = useI18n();

const query = graphql(
  `
    query Lots(
      $limit: Int!
      $offset: Int!
      $orderBy: [lots_order_by!]
      $where: lots_bool_exp!
      $LotWithOrchard: Boolean! = true
      $LotWithCrossing: Boolean! = false
      $withParentCultivar: Boolean! = false
      $withMotherPlants: Boolean! = false
      $withPlantRows: Boolean! = false
    ) {
      lots_aggregate {
        aggregate {
          count
        }
      }
      lots(where: $where, limit: $limit, offset: $offset, order_by: $orderBy) {
        ...lotFragment
      }
    }
  `,
  [lotFragment],
);

const {
  search,
  pagination,
  variables: _variables,
} = useEntityIndexHooks<typeof query>({
  defaultSortBy: 'display_name',
  searchColumns: ['display_name'],
});

const variables = computed(() => ({
  ..._variables.value,
  where: { ..._variables.value.where, is_variety: { _eq: false } },
}));

const { data, fetching, error } = await useQuery({
  query,
  variables,
  context: { additionalTypenames: ['lots'] },
});

const lotsCount = computed(
  () => data.value?.lots_aggregate?.aggregate?.count || 0,
);

type Lot = ResultOf<typeof query>['lots'][0];

const columns = [
  {
    name: 'display_name',
    label: t('entity.commonColumns.name'),
    align: 'left' as const,
    field: 'display_name',
    sortable: true,
  },
  {
    name: 'date_sowed',
    label: t('lots.fields.dateSowed'),
    align: 'left' as const,
    field: (row: Lot) => (row.date_sowed ? d(row.date_sowed, 'ymdHis') : null),
    sortable: true,
  },
  {
    name: 'numb_seeds_sowed',
    label: t('lots.fields.numbSeedsSowed'),
    align: 'right' as const,
    field: 'numb_seeds_sowed',
    format: (value: number | null) => (value ? n(value) : ''),
    sortable: true,
  },
  {
    name: 'numb_seedlings_grown',
    label: t('lots.fields.numbSeedlingsGrown'),
    align: 'right' as const,
    field: 'numb_seedlings_grown',
    format: (value: number | null) => (value ? n(value) : ''),
    sortable: true,
  },
  {
    name: 'seed_tray',
    label: t('lots.fields.seedTray'),
    align: 'left' as const,
    field: 'seed_tray',
    sortable: true,
  },
  {
    name: 'date_planted',
    label: t('lots.fields.datePlanted'),
    align: 'left' as const,
    field: (row: Lot) =>
      row.date_planted ? d(row.date_planted, 'ymdHis') : null,
    sortable: true,
  },
  {
    name: 'numb_seedlings_planted',
    label: t('lots.fields.numbSeedlingsPlanted'),
    align: 'right' as const,
    field: 'numb_seedlings_planted',
    format: (value: number | null) => (value ? n(value) : ''),
    sortable: true,
  },
  {
    name: 'plot',
    label: t('lots.fields.plot'),
    align: 'left' as const,
    field: 'plot',
    sortable: true,
  },
  {
    name: 'orchard',
    label: t('plantRows.fields.orchard'),
    align: 'left' as const,
    field: (row: Lot) => row.orchard?.name,
    sortable: true,
  },
  {
    name: 'modified',
    label: t('entity.commonColumns.modified'),
    align: 'left' as const,
    field: (row: Lot) => (row.modified ? d(row.modified, 'ymdHis') : null),
    sortable: true,
  },
  {
    name: 'created',
    label: t('entity.commonColumns.created'),
    align: 'left' as const,
    field: (row: Lot) => d(row.created, 'ymdHis'),
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
  lotsCount,
  (newValue) => {
    pagination.value.rowsNumber = newValue;
  },
  { immediate: true },
);
</script>
