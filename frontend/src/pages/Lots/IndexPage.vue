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
      :is-exporting="isExporting"
      :export-progress="exportProgress"
      @export="onExport"
    />
  </PageLayout>
</template>

<script setup lang="ts">
import PageLayout from 'src/layouts/PageLayout.vue';
import { useQuery } from '@urql/vue';
import { ResultOf, graphql } from 'src/graphql';
import { computed, watch } from 'vue';
import { useI18n } from 'src/composables/useI18n';
import EntityContainer from 'src/components/Entity/EntityContainer.vue';
import { lotFragment } from 'src/components/Lot/lotFragment';
import { useEntityIndexHooks } from 'src/composables/useEntityIndexHooks';
import { useTimestampColumns } from 'src/composables/useTimestampColumns';
import { useEntityTableColumns } from 'src/components/Entity/List/useEntityTableColumns';
import { useExport } from 'src/composables/useExport';

const { t, n, d } = useI18n();

const query = graphql(
  `
    query Lots(
      $limit: Int!
      $offset: Int!
      $orderBy: [lots_order_by!]
      $where: lots_bool_exp!
      $LotWithOrchard: Boolean! = true
      $LotWithCrossing: Boolean! = false
    ) {
      lots_aggregate(where: $where) {
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
});

const variables = computed(() => ({
  ..._variables.value,
  where: {
    display_name: { _ilike: `%${search.value.replaceAll('.', '%.%')}%` },
    is_variety: { _eq: false },
  },
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
    field: 'date_sowed',
    format: (v: Lot['date_sowed']) => (v ? d(v, 'Ymd') : ''),
    sortable: true,
  },
  {
    name: 'numb_seeds_sowed',
    label: t('lots.fields.numbSeedsSowed'),
    align: 'right' as const,
    field: 'numb_seeds_sowed',
    format: (v: Lot['numb_seeds_sowed']) => (v ? n(v) : ''),
    sortable: true,
  },
  {
    name: 'numb_seedlings_grown',
    label: t('lots.fields.numbSeedlingsGrown'),
    align: 'right' as const,
    field: 'numb_seedlings_grown',
    format: (v: Lot['numb_seedlings_grown']) => (v ? n(v) : ''),
    sortable: true,
  },
  {
    name: 'seed_tray',
    label: t('lots.fields.seedTray'),
    align: 'left' as const,
    field: 'seed_tray',
    sortable: true,
    maxWidth: 'clamp(300px, 30svw, 600px)',
    ellipsis: true,
  },
  {
    name: 'date_planted',
    label: t('lots.fields.datePlanted'),
    align: 'left' as const,
    field: 'date_planted',
    format: (v: Lot['date_planted']) => (v ? d(v, 'Ymd') : ''),
    sortable: true,
  },
  {
    name: 'numb_seedlings_planted',
    label: t('lots.fields.numbSeedlingsPlanted'),
    align: 'right' as const,
    field: 'numb_seedlings_planted',
    format: (v: Lot['numb_seedlings_planted']) => (v ? n(v) : ''),
    sortable: true,
  },
  {
    name: 'plot',
    label: t('lots.fields.plot'),
    align: 'left' as const,
    field: 'plot',
    sortable: true,
    maxWidth: 'clamp(300px, 30svw, 600px)',
    ellipsis: true,
  },
  {
    name: 'orchard',
    label: t('plantRows.fields.orchard'),
    align: 'left' as const,
    field: (row: Lot) => row.orchard?.name,
    sortable: true,
  },
  {
    name: 'note',
    label: t('entity.commonColumns.note'),
    align: 'left' as const,
    field: 'note',
    sortable: true,
    maxWidth: 'clamp(300px, 30svw, 600px)',
    ellipsis: true,
  },
  ...useTimestampColumns(),
];

const { visibleColumns } = useEntityTableColumns({
  entityType: 'lots',
  defaultColumns: columns.map((column) => column.name),
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

const {
  exportDataAndWriteNewXLSX: onExport,
  isExporting,
  exportProgress,
} = useExport({
  entityName: 'lots',
  query,
  variables,
  visibleColumns,
  columns,
  title: t('lots.title', 2),
});
</script>
