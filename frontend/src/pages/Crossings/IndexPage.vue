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
import { crossingFragment } from 'src/components/Crossing/crossingFragment';
import { useEntityIndexHooks } from 'src/composables/useEntityIndexHooks';

const { t, d } = useI18n();

const query = graphql(
  `
    query Crossings(
      $limit: Int!
      $offset: Int!
      $orderBy: [crossings_order_by!]
      $where: crossings_bool_exp
      $withParentCultivar: Boolean = true
      $withLot: Boolean = false
      $withLots: Boolean = false
      $withMotherPlants: Boolean = false
    ) {
      crossings_aggregate {
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
      }
    }
  `,
  [crossingFragment],
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
    name: 'motherCultivar',
    label: t('crossings.fields.motherCultivar'),
    align: 'left' as const,
    field: (row: Crossing) => row.mother_cultivar?.display_name,
    sortable: true,
  },
  {
    name: 'fatherCultivar',
    label: t('crossings.fields.fatherCultivar'),
    align: 'left' as const,
    field: (row: Crossing) => row.father_cultivar?.display_name,
    sortable: true,
  },
  {
    name: 'modified',
    label: t('entity.commonColumns.modified'),
    align: 'left' as const,
    field: (row: Crossing) => (row.modified ? d(row.modified, 'ymdHis') : null),
    sortable: true,
  },
  {
    name: 'created',
    label: t('entity.commonColumns.created'),
    align: 'left' as const,
    field: (row: Crossing) => d(row.created, 'ymdHis'),
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
  crossingsCount,
  (newValue) => {
    pagination.value.rowsNumber = newValue;
  },
  { immediate: true },
);
</script>
