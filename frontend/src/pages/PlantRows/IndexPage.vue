<template>
  <PageLayout>
    <EntityContainer
      v-model:tab="subset"
      v-model:search="search"
      v-model:pagination="pagination"
      v-model:visible-columns="visibleColumns"
      :title="t('plantRows.title', 2)"
      :tabs="tabs"
      :search-placeholder="t('entity.searchPlaceholderName')"
      :rows="data?.plant_rows || []"
      :loading="fetching"
      :all-columns="columns"
      list-entities-path="/rows"
      add-entity-path="/rows/new"
      :view-entity-path-getter="(id) => `/rows/${id}`"
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
import { UnwrapRef, computed, watch } from 'vue';
import { useI18n } from 'src/composables/useI18n';
import { useQueryArg } from 'src/composables/useQueryArg';
import EntityContainer from 'src/components/Entity/EntityContainer.vue';
import { plantRowFragment } from 'src/components/PlantRow/plantRowFragment';
import { useEntityIndexHooks } from 'src/composables/useEntityIndexHooks';
import { useTimestampColumns } from 'src/composables/useTimestampColumns';
import { useEntityTableColumns } from 'src/components/Entity/List/useEntityTableColumns';
import { useExport } from 'src/composables/useExport';

const { t, d } = useI18n();

const query = graphql(
  `
    query PlantRows(
      $limit: Int!
      $offset: Int!
      $orderBy: [plant_rows_order_by!]
      $where: plant_rows_bool_exp
    ) {
      plant_rows_aggregate(where: $where) {
        aggregate {
          count
        }
      }
      plant_rows(
        where: $where
        limit: $limit
        offset: $offset
        order_by: $orderBy
      ) {
        ...plantRowFragment
      }
    }
  `,
  [plantRowFragment],
);

const { queryArg: subset } = useQueryArg<'active' | 'disabled' | 'all'>({
  key: 'tab',
  defaultValue: 'active',
  replace: true,
});
const tabs: { value: UnwrapRef<typeof subset>; label: string }[] = [
  { value: 'active', label: t('entity.tabs.active') },
  { value: 'disabled', label: t('entity.tabs.disabled') },
  { value: 'all', label: t('entity.tabs.all') },
];

const { search, pagination, variables } = useEntityIndexHooks<typeof query>({
  subset,
});

const { data, fetching, error } = await useQuery({
  query,
  variables,
  context: { additionalTypenames: ['plant_rows'] },
});

const plantRowsCount = computed(
  () => data.value?.plant_rows_aggregate?.aggregate?.count || 0,
);

type PlantRow = ResultOf<typeof query>['plant_rows'][0];

const columns = computed(() => [
  {
    name: 'name',
    label: t('entity.commonColumns.name'),
    align: 'left' as const,
    field: 'name',
    sortable: true,
  },
  {
    name: 'orchard.name',
    label: t('plantRows.fields.orchard'),
    align: 'left' as const,
    field: (row: PlantRow) => row.orchard.name,
    sortable: true,
  },
  {
    name: 'date_created',
    label: t('plantRows.fields.dateCreated'),
    align: 'left' as const,
    field: 'date_created',
    sortable: true,
    format: (v: PlantRow['date_created']) => (v ? d(v, 'Ymd') : ''),
  },
  ...(subset.value === 'disabled'
    ? [
        {
          name: 'date_eliminated',
          label: t('plantRows.fields.dateEliminated'),
          align: 'left' as const,
          field: 'date_eliminated',
          sortable: true,
          format: (v: PlantRow['date_eliminated']) => (v ? d(v, 'Ymd') : ''),
        },
      ]
    : []),
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
]);

const { visibleColumns } = useEntityTableColumns({
  entityType: 'plantRows',
  defaultColumns: columns.value.map((column) => column.name),
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
  plantRowsCount,
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
  entityName: 'plant_rows',
  query: computed(() => query),
  variables,
  visibleColumns,
  columns: computed(() => columns),
  title: t('plantRows.title', 2),
  subsetLabel: computed(
    () => tabs.find((t) => t.value === subset.value)?.label,
  ),
});
</script>
