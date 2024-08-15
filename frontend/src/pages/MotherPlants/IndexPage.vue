<template>
  <PageLayout>
    <EntityContainer
      v-model:search="search"
      v-model:pagination="pagination"
      v-model:visible-columns="visibleColumns"
      :title="t('motherPlants.title', 2)"
      :search-placeholder="t('entity.searchPlaceholderName')"
      :rows="data?.mother_plants || []"
      :loading="fetching"
      :all-columns="columns"
      list-entities-path="/crossings/mother-plants"
      add-entity-path="/crossings/mother-plants/new"
      :view-entity-path-getter="(id) => `/crossings/mother-plants/${id}`"
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
import { motherPlantFragment } from 'src/components/MotherPlant/motherPlantFragment';
import { useEntityIndexHooks } from 'src/composables/useEntityIndexHooks';

const { t, d } = useI18n();

const query = graphql(
  `
    query MotherPlants(
      $limit: Int!
      $offset: Int!
      $orderBy: [mother_plants_order_by!]
      $where: mother_plants_bool_exp
      $MotherPlantWithPlant: Boolean = false
      $MotherPlantWithCrossing: Boolean = false
      $MotherPlantWithPollen: Boolean = false
      $PollenWithCultivar: Boolean = false
      $PlantWithSegments: Boolean = false
      $CultivarWithLot: Boolean = false
      $LotWithOrchard: Boolean = false
      $LotWithCrossing: Boolean = false
    ) {
      mother_plants_aggregate {
        aggregate {
          count
        }
      }
      mother_plants(
        where: $where
        limit: $limit
        offset: $offset
        order_by: $orderBy
      ) {
        ...motherPlantFragment
      }
    }
  `,
  [motherPlantFragment],
);

const { search, pagination, variables } = useEntityIndexHooks<typeof query>();

const { data, fetching, error } = await useQuery({
  query,
  variables,
  context: { additionalTypenames: ['motherPlants'] },
});

const motherPlantsCount = computed(
  () => data.value?.mother_plants_aggregate?.aggregate?.count || 0,
);

type MotherPlant = ResultOf<typeof query>['mother_plants'][0];

const columns = [
  {
    name: 'name',
    label: t('entity.commonColumns.name'),
    align: 'left' as const,
    field: 'name',
    sortable: true,
  },
  {
    name: 'modified',
    label: t('entity.commonColumns.modified'),
    align: 'left' as const,
    field: (row: MotherPlant) =>
      row.modified ? d(row.modified, 'ymdHis') : null,
    sortable: true,
  },
  {
    name: 'created',
    label: t('entity.commonColumns.created'),
    align: 'left' as const,
    field: (row: MotherPlant) => d(row.created, 'ymdHis'),
    sortable: true,
  },
];

const { queryArg: visibleColumns } = useQueryArg<string[]>({
  key: 'col',
  defaultValue: columns.map((column) => column.name).slice(0, 2),
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
  motherPlantsCount,
  (newValue) => {
    pagination.value.rowsNumber = newValue;
  },
  { immediate: true },
);
</script>
