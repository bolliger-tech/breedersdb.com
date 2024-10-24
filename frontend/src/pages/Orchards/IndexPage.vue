<template>
  <PageLayout>
    <EntityContainer
      v-model:tab="subset"
      v-model:search="search"
      v-model:pagination="pagination"
      v-model:visible-columns="visibleColumns"
      :title="t('orchards.title', 2)"
      :tabs="tabs"
      :search-placeholder="t('entity.searchPlaceholderName')"
      :rows="data?.orchards || []"
      :loading="fetching"
      :all-columns="columns"
      list-entities-path="/orchards"
      add-entity-path="/orchards/new"
      :view-entity-path-getter="(id) => `/orchards/${id}`"
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
import { UnwrapRef, computed, watch } from 'vue';
import { useI18n } from 'src/composables/useI18n';
import { useQueryArg } from 'src/composables/useQueryArg';
import EntityContainer from 'src/components/Entity/EntityContainer.vue';
import { orchardFragment } from 'src/components/Orchard/orchardFragment';
import { useEntityIndexHooks } from 'src/composables/useEntityIndexHooks';
import { useTimestampColumns } from 'src/composables/useTimestampColumns';
import { useEntityTableColumns } from 'src/components/Entity/List/useEntityTableColumns';
import { useExport } from 'src/composables/useExport';

const { t } = useI18n();

const query = graphql(
  `
    query Orchards(
      $limit: Int!
      $offset: Int!
      $orderBy: [orchards_order_by!]
      $where: orchards_bool_exp
    ) {
      orchards_aggregate(where: $where) {
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

const { queryArg: subset } = useQueryArg<'active' | 'disabled' | 'all'>({
  key: 'tab',
  defaultValue: 'active',
  replace: true,
});
const tabs = computed<{ value: UnwrapRef<typeof subset>; label: string }[]>(
  () => [
    { value: 'active', label: t('entity.tabs.active') },
    { value: 'disabled', label: t('entity.tabs.disabled') },
    { value: 'all', label: t('entity.tabs.all') },
  ],
);

const { search, pagination, variables } = useEntityIndexHooks<typeof query>({
  subset,
});

const { data, fetching, error } = await useQuery({
  query,
  variables,
  context: { additionalTypenames: ['orchards'] },
});

const orchardsCount = computed(
  () => data.value?.orchards_aggregate?.aggregate?.count || 0,
);

const columns = computed(() => [
  {
    name: 'name',
    label: t('entity.commonColumns.name'),
    align: 'left' as const,
    field: 'name',
    sortable: true,
  },
  ...(subset.value === 'all'
    ? [
        {
          name: 'disabled',
          label: t('entity.commonColumns.disabled'),
          field: 'disabled',
          sortable: true,
        },
      ]
    : []),
  ...useTimestampColumns(),
]);

const { visibleColumns } = useEntityTableColumns({
  entityType: 'orchards',
  defaultColumns: columns.value
    .map((column) => column.name)
    .filter((name) => subset.value === 'all' || name !== 'disabled'),
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

const {
  exportDataAndWriteNewXLSX: onExport,
  isExporting,
  exportProgress,
} = useExport({
  entityName: 'orchards',
  query,
  variables,
  visibleColumns,
  columns,
  title: t('orchards.title', 2),
  subsetLabel: computed(
    () => tabs.value.find((t) => t.value === subset.value)?.label,
  ),
});
</script>
