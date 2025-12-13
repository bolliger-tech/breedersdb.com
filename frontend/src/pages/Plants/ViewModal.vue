<template>
  <EntityFetchWrapper :error="error" :fetching="fetching">
    <EntityModalContent
      v-if="plant"
      sprite-icon="tree"
      :print-data="print || undefined"
      @edit="edit"
    >
      <template #title-text>
        <EntityLabelId entity-type="plant" :label-id="plant.label_id" />
      </template>
      <template #subtitle-text>
        <EntityName
          v-if="plant.plant_group"
          :plant-group="plant.plant_group"
          :cultivar="plant.plant_group.cultivar"
          :lot="plant.plant_group.cultivar?.lot"
          :crossing="plant.plant_group.cultivar?.lot?.crossing"
        />
      </template>

      <template #default>
        <h3 class="q-my-md">{{ t('entity.basics') }}</h3>
        <PlantEntityTable :plant="plant" />

        <EntityViewAllAttributions :attributions="attributions" />

        <h3 class="q-my-md">{{ t('motherPlants.title', 2) }}</h3>
        <EntityRelatedTable
          entity-key="mother_plants"
          :rows="plant.mother_plants || []"
          row-key="id"
          :columns="motherPlantColumns"
          default-sort-by="name"
          @row-click="(_, row) => $router.push(`/mother-plants/${row.id}`)"
        >
          <template #body-cell-name="cellProps">
            <q-td key="name" :props="cellProps">
              <RouterLink
                :to="`/mother-plants/${cellProps.row.id}`"
                class="undecorated-link"
              >
                {{ cellProps.row.name }}
              </RouterLink>
            </q-td>
          </template>
          <template #body-cell-pollen="cellProps">
            <q-td key="pollen" :props="cellProps">
              <RouterLink
                v-if="cellProps.row.pollen"
                :to="`/pollen/${cellProps.row.pollen.id}`"
                class="undecorated-link"
              >
                {{ cellProps.row.pollen.name }}
              </RouterLink>
            </q-td>
          </template>
        </EntityRelatedTable>
      </template>

      <template #action-left>
        <PlantButtonEliminate v-if="!plant.disabled" :plant-id="plant.id" />
        <div v-else></div>
      </template>
    </EntityModalContent>
  </EntityFetchWrapper>
</template>

<script setup lang="ts">
import EntityModalContent from 'src/components/Entity/EntityModalContent.vue';
import type { ResultOf } from 'src/graphql';
import { graphql } from 'src/graphql';
import { computed } from 'vue';
import { plantFragment } from 'src/components/Plant/plantFragment';
import PlantEntityTable from 'src/components/Plant/PlantEntityTable.vue';
import EntityLabelId from 'src/components/Entity/EntityLabelId.vue';
import EntityName from 'src/components/Entity/EntityName.vue';
import EntityViewAllAttributions from 'src/components/Entity/View/EntityViewAllAttributions.vue';
import type { CachedAttributionsFragment } from 'src/components/Attribution/cachedAttributionsFragment';
import { useI18n } from 'src/composables/useI18n';
import { useRoute, useRouter } from 'vue-router';
import PlantButtonEliminate from 'src/components/Plant/PlantButtonEliminate.vue';
import { useQuery } from '@urql/vue';
import { cachedAttributionsFragment } from 'src/components/Attribution/cachedAttributionsFragment';
import EntityRelatedTable from 'src/components/Entity/EntityRelatedTable.vue';
import { motherPlantFragment } from 'src/components/MotherPlant/motherPlantFragment';
import { useLocalizedSort } from 'src/composables/useLocalizedSort';
import { makeQrLabel } from 'src/utils/labelUtils';
import EntityFetchWrapper from 'src/components/Entity/EntityFetchWrapper.vue';

const props = defineProps<{ entityId: number | string }>();

const query = graphql(
  `
    query Plant(
      $id: Int!
      $PlantWithSegments: Boolean = true
      $CachedAttributionsWithEntites: Boolean = true
      $MotherPlantWithPlant: Boolean = false
      $MotherPlantWithPollen: Boolean = true
      $MotherPlantWithCrossing: Boolean = false
      $PollenWithCultivar: Boolean = false
      $CultivarWithLot: Boolean = false
      $LotWithOrchard: Boolean = false
      $LotWithCrossing: Boolean = false
    ) {
      plants_by_pk(id: $id) {
        ...plantFragment
        cached_attributions {
          ...cachedAttributionsFragment
        }
        mother_plants {
          ...motherPlantFragment
        }
      }
    }
  `,
  [plantFragment, motherPlantFragment, cachedAttributionsFragment],
);

const { data, fetching, error } = await useQuery({
  requestPolicy: 'cache-and-network',
  query,
  variables: { id: parseInt(props.entityId.toString()) },
  context: { additionalTypenames: ['cached_attributions'] },
});

const plant = computed(() => data.value?.plants_by_pk);
const attributions = computed(
  () =>
    (plant.value?.cached_attributions || []) as CachedAttributionsFragment[],
);

const print = computed(
  () =>
    plant.value &&
    makeQrLabel({
      code: plant.value.label_id,
      desc: plant.value.plant_group_name,
    }),
);

const route = useRoute();
const router = useRouter();
async function edit() {
  await router.push({
    path: `/plants/${props.entityId}/edit`,
    query: route.query,
  });
}

const { t, n, d } = useI18n();

const { localizedSortPredicate } = useLocalizedSort();

type MotherPlant = NonNullable<
  ResultOf<typeof query>['plants_by_pk']
>['mother_plants'][0];
const motherPlantColumns = [
  {
    name: 'name',
    field: 'name',
    label: t('entity.commonColumns.name'),
    align: 'left' as const,
    sortable: true,
    sort: (a: MotherPlant['name'], b: MotherPlant['name']) =>
      localizedSortPredicate(a, b),
  },
  {
    name: 'date_impregnated',
    field: 'date_impregnated',
    label: t('motherPlants.fields.dateImpregnated'),
    align: 'left' as const,
    sortable: true,
    format: (v: MotherPlant['date_impregnated']) => (v ? d(v, 'Ymd') : ''),
  },
  {
    name: 'pollen',
    field: 'pollen.name',
    label: t('motherPlants.fields.pollen'),
    align: 'left' as const,
    sortable: true,
  },
  {
    name: 'numb_flowers',
    field: 'numb_flowers',
    label: t('motherPlants.fields.numbFlowers'),
    align: 'right' as const,
    sortable: true,
    format: (v: MotherPlant['numb_flowers']) =>
      typeof v === 'number' ? n(v) : v,
  },
  {
    name: 'numb_fruits',
    field: 'numb_fruits',
    label: t('motherPlants.fields.numbFruits'),
    align: 'right' as const,
    sortable: true,
    format: (v: MotherPlant['numb_fruits']) =>
      typeof v === 'number' ? n(v) : v,
  },
  {
    name: 'date_fruits_harvested',
    field: 'date_fruits_harvested',
    label: t('motherPlants.fields.dateFruitsHarvested'),
    align: 'left' as const,
    sortable: true,
    format: (v: MotherPlant['date_fruits_harvested']) => (v ? d(v, 'Ymd') : ''),
  },
  {
    name: 'numb_seeds',
    field: 'numb_seeds',
    label: t('motherPlants.fields.numbSeeds'),
    align: 'right' as const,
    sortable: true,
    format: (v: MotherPlant['numb_seeds']) =>
      typeof v === 'number' ? n(v) : v,
  },
  {
    name: 'created',
    field: 'created',
    label: t('entity.commonColumns.created'),
    align: 'left' as const,
    sortable: true,
    format: (v: string) => d(v, 'YmdHis'),
  },
];
</script>
