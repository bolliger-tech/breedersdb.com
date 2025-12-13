<template>
  <PageLayout>
    <EntityContainer
      v-model:search="search"
      v-model:pagination="pagination"
      v-model:visible-columns="visibleColumns"
      :title="t('personalAccessTokens.title', 2)"
      :search-placeholder="t('personalAccessTokens.searchPlaceholder')"
      :rows="data?.user_tokens || []"
      :loading="fetching"
      :all-columns="columns"
      list-entities-path="/personal-access-tokens"
      add-entity-path="/personal-access-tokens/new"
      :view-entity-path-getter="(id) => `/personal-access-tokens/${id}`"
      :is-exporting="isExporting"
      :export-progress="exportProgress"
      @export="onExport"
    />
  </PageLayout>
</template>

<script setup lang="ts">
import PageLayout from 'src/layouts/PageLayout.vue';
import { useQuery } from '@urql/vue';
import type { ResultOf } from 'src/graphql';
import { graphql } from 'src/graphql';
import { computed, watch } from 'vue';
import { useI18n } from 'src/composables/useI18n';
import EntityContainer from 'src/components/Entity/EntityContainer.vue';
import { userTokenFragment } from 'src/components/PersonalAccessToken/userTokenFragment';
import { useEntityIndexHooks } from 'src/composables/useEntityIndexHooks';
import { useTimestampColumns } from 'src/composables/useTimestampColumns';
import { useEntityTableColumns } from 'src/components/Entity/List/useEntityTableColumns';
import type { TransformDataArgs } from 'src/composables/useExport';
import { useExport } from 'src/composables/useExport';
import { useIdColumn } from 'src/composables/useIdColumn';

const { t } = useI18n();

const query = graphql(
  `
    query PersonalAccessTokens(
      $limit: Int!
      $offset: Int!
      $orderBy: [user_tokens_order_by!]
      $where: user_tokens_bool_exp
    ) {
      user_tokens_aggregate(where: $where) {
        aggregate {
          count
        }
      }
      user_tokens(
        where: $where
        limit: $limit
        offset: $offset
        order_by: $orderBy
      ) {
        ...userTokenFragment
      }
    }
  `,
  [userTokenFragment],
);

const { search, pagination, variables } = useEntityIndexHooks<typeof query>({
  defaultSortBy: 'last_verify',
  searchColumns: ['name'],
});

const { data, fetching, error } = await useQuery({
  query,
  variables,
  context: {
    additionalTypenames: ['user_tokens', 'CreatePersonalAccessTokenOutput'],
  },
});

const userTokensCount = computed(
  () => data.value?.user_tokens_aggregate?.aggregate?.count || 0,
);

const columns = [
  useIdColumn(),
  {
    name: 'name',
    label: t('entity.commonColumns.name'),
    align: 'left' as const,
    field: 'name',
    sortable: true,
  },
  {
    name: 'expires',
    label: t('personalAccessTokens.fields.expires'),
    align: 'left' as const,
    field: 'expires',
    sortable: true,
    timestamp: true,
  },
  {
    name: 'last_verify',
    label: t('personalAccessTokens.fields.lastVerify'),
    align: 'right' as const,
    field: 'last_verify',
    sortable: true,
    timestamp: true,
  },
  ...useTimestampColumns({ modified: false }),
];

const { visibleColumns } = useEntityTableColumns({
  entityType: 'userTokens',
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
  userTokensCount,
  (newValue) => {
    pagination.value.rowsNumber = newValue;
  },
  { immediate: true },
);

function transformData({
  data,
  visibleColumns,
}: TransformDataArgs<ResultOf<typeof query>['user_tokens'][0]>) {
  return {
    visibleColumns,
    data: data.map((row) => {
      return {
        ...row,
        expires: row.expires ? new Date(row.expires) : null,
        last_verify: row.last_verify ? new Date(row.last_verify) : null,
      };
    }),
  };
}

const {
  exportDataAndWriteNewXLSX: onExport,
  isExporting,
  exportProgress,
} = useExport({
  entityName: 'user_tokens',
  query,
  variables,
  visibleColumns,
  columns,
  title: t('personalAccessTokens.title', 2),
  transformDataFn: transformData,
});
</script>
