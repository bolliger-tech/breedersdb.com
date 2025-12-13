<template>
  <PageLayout>
    <EntityContainer
      v-model:search="search"
      v-model:pagination="pagination"
      v-model:visible-columns="visibleColumns"
      :title="t('personalAccessTokens.title', 2)"
      :search-placeholder="t('personalAccessTokens.searchPlaceholder')"
      :rows="personalAccessTokens"
      :loading="fetching"
      :all-columns="columns"
      list-entities-path="/personal-access-tokens"
      add-entity-path="/personal-access-tokens/new"
      :view-entity-path-getter="(id) => `/personal-access-tokens/${id}`"
      :is-exporting="isExporting"
      :export-progress="exportProgress"
      @export="onExport"
    />
    <PersonalAccessTokenCreatedDialog
      v-if="createdTokenData"
      v-model="showTokenCreatedDialog"
      :created-token-data="createdTokenData"
      :key="createdTokenData.id"
    />
  </PageLayout>
</template>

<script setup lang="ts">
import PageLayout from 'src/layouts/PageLayout.vue';
import { useQuery } from '@urql/vue';
import type { ResultOf } from 'src/graphql';
import { graphql } from 'src/graphql';
import { computed, ref, watch } from 'vue';
import { useI18n } from 'src/composables/useI18n';
import EntityContainer from 'src/components/Entity/EntityContainer.vue';
import { personalAccessTokenFragment } from 'src/components/PersonalAccessToken/personalAccessTokenFragment';
import { useEntityIndexHooks } from 'src/composables/useEntityIndexHooks';
import { useTimestampColumns } from 'src/composables/useTimestampColumns';
import { useEntityTableColumns } from 'src/components/Entity/List/useEntityTableColumns';
import type { TransformDataArgs } from 'src/composables/useExport';
import { useExport } from 'src/composables/useExport';
import { useIdColumn } from 'src/composables/useIdColumn';
import PersonalAccessTokenCreatedDialog from 'src/components/PersonalAccessToken/PersonalAccessTokenCreatedDialog.vue';
import type { TokenCreatedData } from 'src/components/PersonalAccessToken/PersonalAccessTokenModalEdit.vue';
import { usePersonalAccessTokenCreated } from 'src/components/PersonalAccessToken/usePersonalAccessTokenCreated';

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
        ...personalAccessTokenFragment
      }
    }
  `,
  [personalAccessTokenFragment],
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

const personalAccessTokens = computed(() => data.value?.user_tokens || []);

const personalAccessTokensCount = computed(
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
  personalAccessTokensCount,
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

const showTokenCreatedDialog = ref(false);
const createdTokenData = ref<TokenCreatedData>();

function onTokenCreated(data: TokenCreatedData) {
  createdTokenData.value = data;
  showTokenCreatedDialog.value = true;
}
const { provide } = usePersonalAccessTokenCreated();
provide(onTokenCreated);
</script>
