<template>
  <PageLayout>
    <EntityContainer
      v-model:search="search"
      v-model:pagination="pagination"
      v-model:visible-columns="visibleColumns"
      :title="t('attributions.title', 2)"
      :search-placeholder="t('entity.searchPlaceholderName')"
      :rows="data?.attributions_view || []"
      :loading="fetching"
      :all-columns="columns"
      list-entities-path="/attributions"
      :view-entity-path-getter="(id) => `/attributions/${id}`"
    >
      <template #add-button><div></div></template>
    </EntityContainer>
  </PageLayout>
</template>

<script setup lang="ts">
import PageLayout from 'src/layouts/PageLayout.vue';
import { useQuery } from '@urql/vue';
import { graphql } from 'src/graphql';
import { computed, watch } from 'vue';
import { useI18n } from 'src/composables/useI18n';
import EntityContainer from 'src/components/Entity/EntityContainer.vue';
import { attributionsViewFragment } from 'src/components/Attribution/attributionsViewFragment';
import { useEntityIndexHooks } from 'src/composables/useEntityIndexHooks';
import { useTimestampColumns } from 'src/composables/useTimestampColumns';
import { useEntityTableColumns } from 'src/components/Entity/List/useEntityTableColumns';

const { t } = useI18n();

const query = graphql(
  `
    query AttributionsView(
      $limit: Int!
      $offset: Int!
      $orderBy: [attributions_view_order_by!]
      $where: attributions_view_bool_exp
      $AttributionsViewWithEntites: Boolean = true
    ) {
      attributions_view_aggregate(where: $where) {
        aggregate {
          count
        }
      }
      attributions_view(
        where: $where
        limit: $limit
        offset: $offset
        order_by: $orderBy
      ) {
        ...attributionsViewFragment
      }
    }
  `,
  [attributionsViewFragment],
);

const { search, pagination, variables } = useEntityIndexHooks<typeof query>({
  defaultSortBy: 'id',
  searchColumns: ['attribute_name'],
});

const { data, fetching, error } = await useQuery({
  query,
  variables,
  context: { additionalTypenames: ['attributions_view'] },
});

const attributionsCount = computed(
  () => data.value?.attributions_view_aggregate?.aggregate?.count || 0,
);

const columns = [
  {
    name: 'attribute_name',
    label: t('attributions.columns.attributeName'),
    field: 'attribute_name',
    align: 'left' as const,
    sortable: true,
  },
  ...useTimestampColumns(),
];

const { visibleColumns } = useEntityTableColumns({
  entityType: 'attributions',
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
  attributionsCount,
  (newValue) => {
    pagination.value.rowsNumber = newValue;
  },
  { immediate: true },
);
</script>
