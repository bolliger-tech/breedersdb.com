<template>
  <PageLayout>
    <EntityContainer
      v-model:search="search"
      v-model:pagination="pagination"
      v-model:visible-columns="visibleColumns"
      :title="t('motherPlants.title', 2)"
      :search-placeholder="t('motherPlants.searchPlaceholder')"
      :rows="data?.mother_plants || []"
      :loading="fetching"
      :all-columns="columns"
      list-entities-path="/mother-plants"
      add-entity-path="/mother-plants/new"
      :view-entity-path-getter="(id) => `/mother-plants/${id}`"
      @scanned-qr="(code) => (search = code)"
    >
      <template #[`body-cell-plant.label_id`]="cellProps">
        <q-td :props="cellProps">
          <EntityLabelId :label-id="cellProps.value" entity-type="plant" />
        </q-td>
      </template>
    </EntityContainer>
  </PageLayout>
</template>

<script setup lang="ts">
import PageLayout from 'src/layouts/PageLayout.vue';
import { useQuery } from '@urql/vue';
import { ResultOf, graphql } from 'src/graphql';
import { computed, watch } from 'vue';
import { useI18n } from 'src/composables/useI18n';
import EntityContainer from 'src/components/Entity/EntityContainer.vue';
import { motherPlantFragment } from 'src/components/MotherPlant/motherPlantFragment';
import { useEntityIndexHooks } from 'src/composables/useEntityIndexHooks';
import { useTimestampColumns } from 'src/composables/useTimestampColumns';
import EntityLabelId from 'src/components/Entity/EntityLabelId.vue';
import { useEntityTableColumns } from 'src/components/Entity/List/useEntityTableColumns';

const { t, n, d } = useI18n();

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
      mother_plants_aggregate(where: $where) {
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

const { search, pagination, variables } = useEntityIndexHooks<typeof query>({
  searchColumns: ['name', 'crossing.name', 'plant.label_id'],
});

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
    format: (v: MotherPlant['date_impregnated']) => (v ? d(v, 'Ymd') : ''),
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
    format: (v: MotherPlant['numb_flowers']) => (v ? n(v) : ''),
    sortable: true,
  },
  {
    name: 'numb_fruits',
    label: t('motherPlants.fields.numbFruits'),
    align: 'left' as const,
    field: 'numb_fruits',
    format: (v: MotherPlant['numb_fruits']) => (v ? n(v) : ''),
    sortable: true,
  },
  {
    name: 'date_fruits_harvested',
    label: t('motherPlants.fields.dateFruitsHarvested'),
    align: 'left' as const,
    field: 'date_fruits_harvested',
    sortable: true,
    format: (v: MotherPlant['date_fruits_harvested']) => (v ? d(v, 'Ymd') : ''),
  },
  {
    name: 'numb_seeds',
    label: t('motherPlants.fields.numbSeeds'),
    align: 'left' as const,
    field: 'numb_seeds',
    format: (v: MotherPlant['numb_seeds']) => (v ? n(v) : ''),
    sortable: true,
  },
  {
    name: 'note',
    label: t('entity.commonColumns.note'),
    align: 'left' as const,
    field: 'note',
    sortable: true,
    maxWidth: 'clamp(300px, 30svw, 600px)',
    ellipsis: true,
  },
  ...useTimestampColumns(),
];

const { visibleColumns } = useEntityTableColumns({
  entityType: 'motherPlants',
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
  motherPlantsCount,
  (newValue) => {
    pagination.value.rowsNumber = newValue;
  },
  { immediate: true },
);
</script>
