<template>
  <PageLayout>
    <EntityContainer
      v-model:search="search"
      v-model:pagination="pagination"
      v-model:visible-columns="visibleColumns"
      :title="t('graftings.title', 2)"
      :search-placeholder="t('entity.searchPlaceholderName')"
      :rows="data?.graftings || []"
      :loading="fetching"
      :all-columns="columns"
      list-entities-path="/graftings"
      add-entity-path="/graftings/new"
      :view-entity-path-getter="(id) => `/graftings/${id}`"
    />
  </PageLayout>
</template>

<script setup lang="ts">
import PageLayout from 'src/layouts/PageLayout.vue';
import { useQuery } from '@urql/vue';
import { graphql } from 'src/graphql';
import { computed, watch } from 'vue';
import { useI18n } from 'src/composables/useI18n';
import { useQueryArg } from 'src/composables/useQueryArg';
import EntityContainer from 'src/components/Entity/EntityContainer.vue';
import { graftingFragment } from 'src/components/Grafting/graftingFragment';
import { useEntityIndexHooks } from 'src/composables/useEntityIndexHooks';
import { useTimestampColumns } from 'src/composables/useTimestampColumns';

const { t } = useI18n();

const query = graphql(
  `
    query Graftings(
      $limit: Int!
      $offset: Int!
      $orderBy: [graftings_order_by!]
      $where: graftings_bool_exp
    ) {
      graftings_aggregate(where: $where) {
        aggregate {
          count
        }
      }
      graftings(
        where: $where
        limit: $limit
        offset: $offset
        order_by: $orderBy
      ) {
        ...graftingFragment
      }
    }
  `,
  [graftingFragment],
);

const { search, pagination, variables } = useEntityIndexHooks<typeof query>();

const { data, fetching, error } = await useQuery({
  query,
  variables,
  context: { additionalTypenames: ['graftings'] },
});

const graftingsCount = computed(
  () => data.value?.graftings_aggregate?.aggregate?.count || 0,
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

const { queryArg: visibleColumns } = useQueryArg<string[]>({
  key: 'col',
  defaultValue: columns.map((column) => column.name),
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
  graftingsCount,
  (newValue) => {
    pagination.value.rowsNumber = newValue;
  },
  { immediate: true },
);
</script>
