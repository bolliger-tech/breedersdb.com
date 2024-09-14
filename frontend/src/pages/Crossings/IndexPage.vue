<template>
  <PageLayout>
    <EntityContainer
      v-model:search="search"
      v-model:pagination="pagination"
      v-model:visible-columns="visibleColumns"
      :title="t('crossings.title', 2)"
      :search-placeholder="t('entity.searchPlaceholderName')"
      :rows="data?.crossings || []"
      :loading="fetching"
      :all-columns="columns"
      list-entities-path="/crossings"
      add-entity-path="/crossings/new"
      :view-entity-path-getter="(id) => `/crossings/${id}`"
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
import { crossingFragment } from 'src/components/Crossing/crossingFragment';
import { useEntityIndexHooks } from 'src/composables/useEntityIndexHooks';
import { cultivarFragment } from 'src/components/Cultivar/cultivarFragment';
import { useTimestampColumns } from 'src/composables/useTimestampColumns';
import { useEntityTableColumns } from 'src/components/Entity/List/useEntityTableColumns';
import { useExport } from 'src/composables/useExport';

const { t } = useI18n();

const query = graphql(
  `
    query Crossings(
      $limit: Int!
      $offset: Int!
      $orderBy: [crossings_order_by!]
      $where: crossings_bool_exp
      $CultivarWithLot: Boolean = false
      $LotWithOrchard: Boolean = false
      $LotWithCrossing: Boolean = false
    ) {
      crossings_aggregate(where: $where) {
        aggregate {
          count
        }
      }
      crossings(
        where: $where
        limit: $limit
        offset: $offset
        order_by: $orderBy
      ) {
        ...crossingFragment
        mother_cultivar {
          ...cultivarFragment
        }
        father_cultivar {
          ...cultivarFragment
        }
      }
    }
  `,
  [crossingFragment, cultivarFragment],
);

const { search, pagination, variables } = useEntityIndexHooks<typeof query>();

const { data, fetching, error } = await useQuery({
  query,
  variables,
  context: { additionalTypenames: ['crossings'] },
});

const crossingsCount = computed(
  () => data.value?.crossings_aggregate?.aggregate?.count || 0,
);

type Crossing = ResultOf<typeof query>['crossings'][0];

const columns = [
  {
    name: 'name',
    label: t('entity.commonColumns.name'),
    align: 'left' as const,
    field: 'name',
    sortable: true,
  },
  {
    name: 'mother_cultivar.display_name',
    label: t('crossings.fields.motherCultivar'),
    align: 'left' as const,
    field: (row: Crossing) => row.mother_cultivar?.display_name,
    sortable: true,
  },
  {
    name: 'father_cultivar.display_name',
    label: t('crossings.fields.fatherCultivar'),
    align: 'left' as const,
    field: (row: Crossing) => row.father_cultivar?.display_name,
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
  entityType: 'crossings',
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
  crossingsCount,
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
  entityName: 'crossings',
  query: computed(() => query),
  variables,
  visibleColumns,
  columns: computed(() => columns),
  title: t('crossings.title', 2),
});
</script>
