<template>
  <PageLayout>
    <EntityContainer
      v-model:search="search"
      v-model:pagination="pagination"
      v-model:visible-columns="visibleColumns"
      :title="t('rootstocks.title', 2)"
      :search-placeholder="t('entity.searchPlaceholderName')"
      :rows="data?.rootstocks || []"
      :loading="fetching"
      :all-columns="columns"
      list-entities-path="/rootstocks"
      add-entity-path="/rootstocks/new"
      :view-entity-path-getter="(id) => `/rootstocks/${id}`"
      :is-exporting="isExporting"
      :export-progress="exportProgress"
      @export="onExport"
    />
  </PageLayout>
</template>

<script setup lang="ts">
import PageLayout from 'src/layouts/PageLayout.vue';
import { useQuery } from '@urql/vue';
import { graphql } from 'src/graphql';
import { computed, watch } from 'vue';
import { useI18n } from 'src/composables/useI18n';
import EntityContainer from 'src/components/Entity/EntityContainer.vue';
import { rootstockFragment } from 'src/components/Rootstock/rootstockFragment';
import { useEntityIndexHooks } from 'src/composables/useEntityIndexHooks';
import { useTimestampColumns } from 'src/composables/useTimestampColumns';
import { useEntityTableColumns } from 'src/components/Entity/List/useEntityTableColumns';
import { useExport } from 'src/composables/useExport';

const { t } = useI18n();

const query = graphql(
  `
    query Rootstocks(
      $limit: Int!
      $offset: Int!
      $orderBy: [rootstocks_order_by!]
      $where: rootstocks_bool_exp
    ) {
      rootstocks_aggregate(where: $where) {
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
  context: { additionalTypenames: ['rootstocks'] },
});

const rootstocksCount = computed(
  () => data.value?.rootstocks_aggregate?.aggregate?.count || 0,
);

const columns = [
  {
    name: 'name',
    label: t('entity.commonColumns.name'),
    align: 'left' as const,
    field: 'name',
    sortable: true,
  },
  ...useTimestampColumns(),
];

const { visibleColumns } = useEntityTableColumns({
  entityType: 'rootstocks',
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
  rootstocksCount,
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
  entityName: 'rootstocks',
  query,
  variables,
  visibleColumns,
  columns,
  title: t('rootstocks.title', 2),
});
</script>
