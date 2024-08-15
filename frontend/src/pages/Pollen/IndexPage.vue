<template>
  <PageLayout>
    <EntityContainer
      v-model:search="search"
      v-model:pagination="pagination"
      v-model:visible-columns="visibleColumns"
      :title="t('pollen.title', 2)"
      :search-placeholder="t('pollen.searchPlaceholder')"
      :rows="data?.pollen || []"
      :loading="fetching"
      :all-columns="columns"
      list-entities-path="/crossings/pollen"
      add-entity-path="/crossings/pollen/new"
      :view-entity-path-getter="(id) => `/crossings/pollen/${id}`"
    />
  </PageLayout>
  <router-view name="modal" />
</template>

<script setup lang="ts">
import PageLayout from 'src/layouts/PageLayout.vue';
import { useQuery } from '@urql/vue';
import { ResultOf, graphql } from 'src/graphql';
import { computed, watch } from 'vue';
import { useI18n } from 'src/composables/useI18n';
import { useQueryArg } from 'src/composables/useQueryArg';
import EntityContainer from 'src/components/Entity/EntityContainer.vue';
import { pollenFragment } from 'src/components/Pollen/pollenFragment';
import { useEntityIndexHooks } from 'src/composables/useEntityIndexHooks';

const { t, d } = useI18n();

const query = graphql(
  `
    query Pollen(
      $limit: Int!
      $offset: Int!
      $orderBy: [pollen_order_by!]
      $where: pollen_bool_exp
      $PollenWithCultivar: Boolean = true
      $CultivarWithLot: Boolean = false
      $LotWithOrchard: Boolean = false
      $LotWithCrossing: Boolean = false
    ) {
      pollen_aggregate {
        aggregate {
          count
        }
      }
      pollen(
        where: $where
        limit: $limit
        offset: $offset
        order_by: $orderBy
      ) {
        ...pollenFragment
      }
    }
  `,
  [pollenFragment],
);

const { search, pagination, variables } = useEntityIndexHooks<typeof query>({
  searchColumns: ['name', 'cultivar.display_name'],
});

const { data, fetching, error } = await useQuery({
  query,
  variables,
  context: { additionalTypenames: ['pollen'] },
});

const pollenCount = computed(
  () => data.value?.pollen_aggregate?.aggregate?.count || 0,
);

type Pollen = ResultOf<typeof query>['pollen'][0];

const columns = [
  {
    name: 'name',
    label: t('entity.commonColumns.name'),
    align: 'left' as const,
    field: 'name',
    sortable: true,
  },
  {
    name: 'cultivar.name',
    label: t('pollen.fields.cultivarName'),
    align: 'left' as const,
    field: (row: Pollen) => row.cultivar?.display_name,
    sortable: true,
  },
  {
    name: 'date_harvested',
    label: t('pollen.fields.dateHarvested'),
    align: 'left' as const,
    field: (row: Pollen) =>
      row.date_harvested ? d(row.date_harvested, 'ymd') : null,
    sortable: true,
  },
  {
    name: 'modified',
    label: t('entity.commonColumns.modified'),
    align: 'left' as const,
    field: (row: Pollen) => (row.modified ? d(row.modified, 'ymdHis') : null),
    sortable: true,
  },
  {
    name: 'created',
    label: t('entity.commonColumns.created'),
    align: 'left' as const,
    field: (row: Pollen) => d(row.created, 'ymdHis'),
    sortable: true,
  },
];

const { queryArg: visibleColumns } = useQueryArg<string[]>({
  key: 'col',
  defaultValue: columns.map((column) => column.name).slice(0, 3),
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
  pollenCount,
  (newValue) => {
    pagination.value.rowsNumber = newValue;
  },
  { immediate: true },
);
</script>
