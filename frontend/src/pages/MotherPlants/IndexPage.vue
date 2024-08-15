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
      list-entities-path="/mother-plants"
      add-entity-path="/mother-plants/new"
      :view-entity-path-getter="(id) => `/mother-plants/${id}`"
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
import { localizeDate } from 'src/utils/dateUtils';

const { t, d } = useI18n();

const query = graphql(
  `
    query MotherPlants(
      $limit: Int!
      $offset: Int!
      $orderBy: [mother_plants_order_by!]
      $where: mother_plants_bool_exp
      $MotherPlantWithPlant: Boolean = true
      $MotherPlantWithCrossing: Boolean = true
      $MotherPlantWithPollen: Boolean = true
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
    name: 'crossing.name',
    label: t('motherPlants.fields.crossing'),
    align: 'left' as const,
    field: (row: MotherPlant) => row.crossing?.name,
    sortable: true,
  },
  {
    name: 'plant.label_id',
    label: t('plants.fields.labelId'),
    align: 'left' as const,
    field: (row: MotherPlant) => row.plant?.label_id,
    sortable: true,
  },
  {
    name: 'date_impregnated',
    label: t('motherPlants.fields.dateImpregnated'),
    align: 'left' as const,
    field: 'date_impregnated',
    sortable: true,
    format: (v: MotherPlant['date_impregnated']) => localizeDate(v) || '',
  },
  {
    name: 'pollen.name',
    label: t('motherPlants.fields.pollen'),
    align: 'left' as const,
    field: (row: MotherPlant) => row.pollen?.name,
    sortable: true,
  },
  {
    name: 'numb_flowers',
    label: t('motherPlants.fields.numbFlowers'),
    align: 'left' as const,
    field: 'numb_flowers',
    sortable: true,
  },
  {
    name: 'date_fruits_harvested',
    label: t('motherPlants.fields.dateFruitsHarvested'),
    align: 'left' as const,
    field: 'date_fruits_harvested',
    sortable: true,
    format: (v: MotherPlant['date_fruits_harvested']) => localizeDate(v) || '',
  },
  {
    name: 'numb_seeds',
    label: t('motherPlants.fields.numbSeeds'),
    align: 'left' as const,
    field: 'numb_seeds',
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
  defaultValue: columns.map((column) => column.name).slice(0, 9),
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
