<template>
  <q-card v-if="error">
    <BaseGraphqlError :error="error" />
  </q-card>

  <EntityModalContent
    v-else-if="crossing"
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
        <EntityViewTableRow :label="t('entity.commonColumns.created')">
          {{ localizeDate(crossing.created) }}
        </EntityViewTableRow>
        <EntityViewTableRow :label="t('entity.commonColumns.modified')">
          {{
            crossing.modified
              ? localizeDate(crossing.modified)
              : t('base.notAvailable')
          }}
        </EntityViewTableRow>
      </EntityViewTable>

      <h3 class="q-mb-md">
        {{ t('lots.title', 2) }}
      </h3>
      <q-table
        v-if="crossing.lots"
        class="q-mt-md"
        flat
        dense
        :rows="crossing.lots"
        :columns="lotsColumns"
        :rows-per-page-options="[0]"
        hide-pagination
        wrap-cells
        binary-state-sort
      >
        <template #body-cell-lot="cellProps">
          <q-td key="value" :props="cellProps">
            <RouterLink
              :to="`/lots/${cellProps.row.id}`"
              class="undecorated-link"
            >
              {{ cellProps.row.display_name }}
            </RouterLink>
          </q-td>
        </template>
      </q-table>

      <h3 class="q-mb-md">
        {{ t('motherPlants.title', 2) }}
      </h3>
      <q-table
        v-if="crossing.mother_plants"
        class="q-mt-md"
        flat
        dense
        :rows="crossing.mother_plants"
        :columns="motherPlantsColumns"
        :rows-per-page-options="[0]"
        hide-pagination
        wrap-cells
        binary-state-sort
      >
        <template #body-cell-mother_plant="cellProps">
          <q-td key="value" :props="cellProps">
            <RouterLink
              :to="`/crossings/mother-plants/${cellProps.row.id}`"
              class="undecorated-link"
            >
              {{ cellProps.row.name }}
            </RouterLink>
          </q-td>
        </template>
      </q-table>
    </template>

    <template #action-left>
      <CrossingButtonDelete
        :crossing-id="crossing.id"
        @deleted="() => router.push({ path: '/crossings', query: route.query })"
      />
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
import { useQuery } from '@urql/vue';
import EntityModalContent from 'src/components/Entity/EntityModalContent.vue';
import CrossingButtonDelete from 'src/components/Crossing/CrossingButtonDelete.vue';
import BaseGraphqlError from 'src/components/Base/BaseGraphqlError.vue';
import { ResultOf, graphql } from 'src/graphql';
import BaseSpinner from 'src/components/Base/BaseSpinner.vue';
import { computed } from 'vue';
import { crossingFragment } from 'src/components/Crossing/crossingFragment';
import { useI18n } from 'src/composables/useI18n';
import { useRoute, useRouter } from 'vue-router';
import EntityViewTable from 'src/components/Entity/View/EntityViewTable.vue';
import EntityViewTableRow from 'src/components/Entity/View/EntityViewTableRow.vue';
import { localizeDate } from 'src/utils/dateUtils';
import { useLocalizedSort } from 'src/composables/useLocalizedSort';
import BaseNotFound from 'src/components/Base/BaseNotFound.vue';
import { lotFragment } from 'src/components/Lot/lotFragment';
import { motherPlantFragment } from 'src/components/MotherPlant/motherPlantFragment';
import { cultivarFragment } from 'src/components/Cultivar/cultivarFragment';

const props = defineProps<{ entityId: number | string }>();

const query = graphql(
  `
    query Crossing(
      $id: Int!
      $CultivarWithLot: Boolean = false
      $LotWithOrchard: Boolean = false
      $LotWithCrossing: Boolean = false
      $MotherPlantWithPlant: Boolean = false
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

const { data, error, fetching } = useQuery({
  query,
  variables: { id: parseInt(props.entityId.toString()) },
});

const crossing = computed(() => data.value?.crossings_by_pk);

const { t } = useI18n();
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
    name: 'lot',
    label: t('entity.commonColumns.name'),
    field: 'display_name',
    align: 'left' as const,
    sortable: true,
    sort: (a: Lot, b: Lot) =>
      localizedSortPredicate(a.display_name, b.display_name),
  },
];

type MotherPlant = NonNullable<
  NonNullable<ResultOf<typeof query>['crossings_by_pk']>['mother_plants']
>[0];

const motherPlantsColumns = [
  {
    name: 'mother_plant',
    label: t('entity.commonColumns.name'),
    field: 'name',
    align: 'left' as const,
    sortable: true,
    sort: (a: MotherPlant, b: MotherPlant) =>
      localizedSortPredicate(a.name, b.name),
  },
];
</script>
