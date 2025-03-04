<template>
  <EntityFetchWrapper :error="error" :fetching="fetching">
    <EntityModalContent
      v-if="crossing"
      sprite-icon="blossom"
      :title="crossing.name"
      @edit="edit"
    >
      <template #default>
        <h3 class="q-my-md">{{ t('entity.basics') }}</h3>
        <EntityViewTable>
          <EntityViewTableRow :label="t('entity.commonColumns.name')">
            {{ crossing.name }}
          </EntityViewTableRow>
          <EntityViewTableRow :label="t('crossings.fields.motherCultivar')">
            <RouterLink
              :to="`/cultivars/${crossing.mother_cultivar?.id}`"
              class="undecorated-link"
            >
              {{ crossing.mother_cultivar?.display_name }}
            </RouterLink>
          </EntityViewTableRow>
          <EntityViewTableRow :label="t('crossings.fields.fatherCultivar')">
            <RouterLink
              :to="`/cultivars/${crossing.father_cultivar?.id}`"
              class="undecorated-link"
            >
              {{ crossing.father_cultivar?.display_name }}
            </RouterLink>
          </EntityViewTableRow>
          <EntityTableViewTimestampRows
            :created="crossing.created"
            :modified="crossing.modified"
          />
          <EntityViewTableRow :label="t('entity.commonColumns.note')" multiline>
            {{ crossing.note }}
          </EntityViewTableRow>
        </EntityViewTable>

        <h3 class="q-mb-md">
          {{ t('lots.title', 2) }}
        </h3>
        <EntityRelatedTable
          entity-key="lots"
          :rows="crossing.lots || []"
          row-key="id"
          :columns="lotsColumns"
          default-sort-by="display_name"
        >
          <template #body-cell-display_name="cellProps">
            <q-td key="display_name" :props="cellProps">
              <RouterLink
                :to="`/lots/${cellProps.row.id}`"
                class="undecorated-link"
              >
                {{ cellProps.row.display_name }}
              </RouterLink>
            </q-td>
          </template>
        </EntityRelatedTable>

        <h3 class="q-mb-md">
          {{ t('motherPlants.title', 2) }}
        </h3>
        <EntityRelatedTable
          entity-key="mother_plants"
          :rows="crossing.mother_plants || []"
          row-key="id"
          :columns="motherPlantsColumns"
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
          <template #body-cell-label_id="cellProps">
            <q-td key="label_id" :props="cellProps">
              <RouterLink
                :to="`/plants/${cellProps.row.plant?.id}`"
                class="undecorated-link"
              >
                {{ cellProps.row.plant?.label_id }}
              </RouterLink>
            </q-td>
          </template>
        </EntityRelatedTable>
      </template>

      <template #action-left>
        <CrossingButtonDelete
          :crossing-id="crossing.id"
          @deleted="
            () => router.push({ path: '/crossings', query: route.query })
          "
        />
      </template>
    </EntityModalContent>
  </EntityFetchWrapper>
</template>

<script setup lang="ts">
import { useQuery } from '@urql/vue';
import EntityModalContent from 'src/components/Entity/EntityModalContent.vue';
import CrossingButtonDelete from 'src/components/Crossing/CrossingButtonDelete.vue';
import type { ResultOf } from 'src/graphql';
import { graphql } from 'src/graphql';
import { computed } from 'vue';
import { crossingFragment } from 'src/components/Crossing/crossingFragment';
import { useI18n } from 'src/composables/useI18n';
import { useRoute, useRouter } from 'vue-router';
import EntityViewTable from 'src/components/Entity/View/EntityViewTable.vue';
import EntityViewTableRow from 'src/components/Entity/View/EntityViewTableRow.vue';
import { useLocalizedSort } from 'src/composables/useLocalizedSort';
import EntityRelatedTable from 'src/components/Entity/EntityRelatedTable.vue';
import { lotFragment } from 'src/components/Lot/lotFragment';
import { motherPlantFragment } from 'src/components/MotherPlant/motherPlantFragment';
import { cultivarFragment } from 'src/components/Cultivar/cultivarFragment';
import EntityTableViewTimestampRows from 'src/components/Entity/View/EntityViewTableTimestampRows.vue';
import EntityFetchWrapper from 'src/components/Entity/EntityFetchWrapper.vue';

const props = defineProps<{ entityId: number | string }>();

const query = graphql(
  `
    query Crossing(
      $id: Int!
      $CultivarWithLot: Boolean = false
      $LotWithOrchard: Boolean = false
      $LotWithCrossing: Boolean = false
      $MotherPlantWithPlant: Boolean = true
      $MotherPlantWithPollen: Boolean = false
      $MotherPlantWithCrossing: Boolean = false
      $PlantWithSegments: Boolean = false
      $PollenWithCultivar: Boolean = false
    ) {
      crossings_by_pk(id: $id) {
        ...crossingFragment
        lots {
          ...lotFragment
        }
        mother_plants {
          ...motherPlantFragment
        }
        mother_cultivar {
          ...cultivarFragment
        }
        father_cultivar {
          ...cultivarFragment
        }
      }
    }
  `,
  [crossingFragment, lotFragment, motherPlantFragment, cultivarFragment],
);

const { data, error, fetching } = await useQuery({
  query,
  variables: { id: parseInt(props.entityId.toString()) },
  context: { additionalTypenames: ['crossings'] },
});

const crossing = computed(() => data.value?.crossings_by_pk);

const { t, d } = useI18n();
const { localizedSortPredicate } = useLocalizedSort();

const route = useRoute();
const router = useRouter();
function edit() {
  router.push({
    path: `/crossings/${props.entityId}/edit`,
    query: route.query,
  });
}

type Lot = NonNullable<
  NonNullable<ResultOf<typeof query>['crossings_by_pk']>['lots']
>[0];

const lotsColumns = [
  {
    name: 'display_name',
    label: t('entity.commonColumns.name'),
    field: 'display_name',
    align: 'left' as const,
    sortable: true,
    sort: (a: Lot['display_name'], b: Lot['display_name']) =>
      localizedSortPredicate(a, b),
  },
  {
    name: 'date_sowed',
    label: t('lots.fields.dateSowed'),
    align: 'left' as const,
    field: 'date_sowed',
    format: (v: Lot['date_sowed']) => (v ? d(v, 'Ymd') : ''),
    sortable: true,
  },
  {
    name: 'date_planted',
    label: t('lots.fields.datePlanted'),
    align: 'left' as const,
    field: 'date_planted',
    format: (v: Lot['date_planted']) => (v ? d(v, 'Ymd') : ''),
    sortable: true,
  },
  {
    name: 'plot',
    label: t('lots.fields.plot'),
    align: 'left' as const,
    field: 'plot',
    sortable: true,
    sort: (a: Lot['plot'], b: Lot['plot']) =>
      localizedSortPredicate(a || '', b || ''),
  },
  {
    name: 'orchard',
    label: t('plantRows.fields.orchard'),
    align: 'left' as const,
    field: (row: Lot) => row.orchard?.name,
    sortable: true,
    sort: (a: Lot['display_name'], b: Lot['display_name']) =>
      localizedSortPredicate(a, b),
  },
];

type MotherPlant = NonNullable<
  NonNullable<ResultOf<typeof query>['crossings_by_pk']>['mother_plants']
>[0];

const motherPlantsColumns = [
  {
    name: 'name',
    label: t('entity.commonColumns.name'),
    field: 'name',
    align: 'left' as const,
    sortable: true,
    sort: (a: MotherPlant['name'], b: MotherPlant['name']) =>
      localizedSortPredicate(a, b),
  },
  {
    name: 'label_id',
    label: t('plants.fields.labelId'),
    field: (row: MotherPlant) => row.plant?.label_id,
    align: 'left' as const,
    sortable: true,
    sort: (
      a: NonNullable<MotherPlant['plant']>['label_id'] | undefined,
      b: NonNullable<MotherPlant['plant']>['label_id'] | undefined,
    ) => localizedSortPredicate(a || '', b || ''),
  },
  {
    name: 'date_impregnated',
    label: t('motherPlants.fields.dateImpregnated'),
    field: 'date_impregnated',
    align: 'left' as const,
    sortable: true,
    format: (v: MotherPlant['date_impregnated']) => (v ? d(v, 'Ymd') : ''),
  },
];
</script>
