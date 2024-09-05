<template>
  <q-card v-if="error">
    <BaseGraphqlError :error="error" />
  </q-card>

  <EntityModalContent v-else-if="plant" sprite-icon="tree" @edit="edit">
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
        entity-key="plants"
        :rows="plant.mother_plants || []"
        row-key="id"
        :columns="motherPlantColumns"
        default-sort-by="name"
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

  <q-card v-else-if="fetching">
    <BaseSpinner size="xl" />
  </q-card>

  <q-card v-else>
    <BaseNotFound />
  </q-card>
</template>

<script setup lang="ts">
import EntityModalContent from 'src/components/Entity/EntityModalContent.vue';
import BaseGraphqlError from 'src/components/Base/BaseGraphqlError.vue';
import { graphql, ResultOf } from 'src/graphql';
import BaseSpinner from 'src/components/Base/BaseSpinner.vue';
import { computed } from 'vue';
import { plantFragment } from 'src/components/Plant/plantFragment';
import PlantEntityTable from 'src/components/Plant/PlantEntityTable.vue';
import EntityLabelId from 'src/components/Entity/EntityLabelId.vue';
import EntityName from 'src/components/Entity/EntityName.vue';
import EntityViewAllAttributions from 'src/components/Entity/View/EntityViewAllAttributions.vue';
import { AttributionsViewFragment } from 'src/components/Attribution/attributionsViewFragment';
import { useI18n } from 'src/composables/useI18n';
import { useRoute, useRouter } from 'vue-router';
import PlantButtonEliminate from 'src/components/Plant/PlantButtonEliminate.vue';
import { useRefreshAttributionsViewThenQuery } from 'src/composables/useRefreshAttributionsView';
import BaseNotFound from 'src/components/Base/BaseNotFound.vue';
import { attributionsViewFragment } from 'src/components/Attribution/attributionsViewFragment';
import EntityRelatedTable from 'src/components/Entity/EntityRelatedTable.vue';
import { motherPlantFragment } from 'src/components/MotherPlant/motherPlantFragment';
import { useLocalizedSort } from 'src/composables/useLocalizedSort';

const props = defineProps<{ entityId: number | string }>();

const query = graphql(
  `
    query Plant(
      $id: Int!
      $PlantWithSegments: Boolean = true
      $AttributionsViewWithEntites: Boolean = true
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
        attributions_views {
          ...attributionsViewFragment
        }
        mother_plants {
          ...motherPlantFragment
        }
      }
    }
  `,
  [plantFragment, motherPlantFragment, attributionsViewFragment],
);

const { data, error, fetching } = await useRefreshAttributionsViewThenQuery({
  query,
  variables: { id: parseInt(props.entityId.toString()) },
});

const plant = computed(() => data.value?.plants_by_pk);
const attributions = computed(
  () => (plant.value?.attributions_views || []) as AttributionsViewFragment[],
);

const route = useRoute();
const router = useRouter();
function edit() {
  router.push({
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
    format: (v: MotherPlant['numb_flowers']) => (v ? n(v) : v),
  },
  {
    name: 'numb_fruits',
    field: 'numb_fruits',
    label: t('motherPlants.fields.numbFruits'),
    align: 'right' as const,
    sortable: true,
    format: (v: MotherPlant['numb_fruits']) => (v ? n(v) : v),
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
    format: (v: MotherPlant['numb_seeds']) => (v ? n(v) : v),
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
