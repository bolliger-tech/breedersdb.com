<template>
  <q-card v-if="error">
    <BaseGraphqlError :error="error" />
  </q-card>

  <EntityModalContent
    v-else-if="pollen"
    sprite-icon="male"
    :title="pollen.name"
    @edit="edit"
  >
    <template #default>
      <h3 class="q-my-md">{{ t('entity.basics') }}</h3>
      <EntityViewTable>
        <EntityViewTableRow :label="t('entity.commonColumns.name')">
          {{ pollen.name }}
        </EntityViewTableRow>
        <EntityViewTableRow
          v-if="pollen.cultivar"
          :label="t('cultivars.title', 1)"
          render-empty
        >
          <EntityName
            :cultivar="pollen.cultivar"
            :lot="pollen.cultivar.lot"
            :crossing="pollen.cultivar.lot?.crossing"
          />
        </EntityViewTableRow>
        <EntityViewTableRow :label="t('pollen.fields.dateHarvested')">
          {{ pollen.date_harvested ? d(pollen.date_harvested, 'Ymd') : '' }}
        </EntityViewTableRow>
        <EntityTableViewTimestampRows
          :created="pollen.created"
          :modified="pollen.modified"
        />
        <EntityViewTableRow :label="t('entity.commonColumns.note')" multiline>
          {{ pollen.note }}
        </EntityViewTableRow>
      </EntityViewTable>

      <h3 class="q-mb-md">
        {{ t('motherPlants.title', 2) }}
      </h3>
      <EntityRelatedTable
        entity-key="mother_plants"
        :rows="pollen.mother_plants || []"
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
        <template #body-cell-crossing__name="cellProps">
          <q-td key="crossing.name" :props="cellProps">
            <RouterLink
              :to="`/crossings/${cellProps.row.crossing?.id}`"
              class="undecorated-link"
            >
              {{ cellProps.row.crossing?.name }}
            </RouterLink>
          </q-td>
        </template>
        <template #body-cell-label_id="cellProps">
          <q-td key="label_id" :props="cellProps">
            <RouterLink
              :to="`/plants/${cellProps.row.plant?.id}`"
              class="undecorated-link"
            >
              <EntityLabelId
                :label-id="cellProps.row.plant?.label_id"
                entity-type="plant"
              />
            </RouterLink>
          </q-td>
        </template>
      </EntityRelatedTable>
    </template>

    <template #action-left>
      <PollenButtonDelete
        :pollen-id="pollen.id"
        @deleted="() => router.push({ path: '/pollen', query: route.query })"
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
import PollenButtonDelete from 'src/components/Pollen/PollenButtonDelete.vue';
import BaseGraphqlError from 'src/components/Base/BaseGraphqlError.vue';
import { ResultOf, graphql } from 'src/graphql';
import BaseSpinner from 'src/components/Base/BaseSpinner.vue';
import { computed } from 'vue';
import { pollenFragment } from 'src/components/Pollen/pollenFragment';
import { useI18n } from 'src/composables/useI18n';
import { useRoute, useRouter } from 'vue-router';
import EntityViewTable from 'src/components/Entity/View/EntityViewTable.vue';
import EntityViewTableRow from 'src/components/Entity/View/EntityViewTableRow.vue';
import { useLocalizedSort } from 'src/composables/useLocalizedSort';
import BaseNotFound from 'src/components/Base/BaseNotFound.vue';
import EntityRelatedTable from 'src/components/Entity/EntityRelatedTable.vue';
import EntityTableViewTimestampRows from 'src/components/Entity/View/EntityViewTableTimestampRows.vue';
import EntityName from 'src/components/Entity/EntityName.vue';
import EntityLabelId from 'src/components/Entity/EntityLabelId.vue';

const props = defineProps<{ entityId: number | string }>();

const query = graphql(
  `
    query Pollen(
      $id: Int!
      $PollenWithCultivar: Boolean = true
      $CultivarWithLot: Boolean = true
      $LotWithOrchard: Boolean = false
      $LotWithCrossing: Boolean = true
    ) {
      pollen_by_pk(id: $id) {
        ...pollenFragment
        mother_plants {
          id
          name
          date_impregnated
          created
          plant {
            id
            label_id
          }
          crossing {
            id
            name
          }
        }
      }
    }
  `,
  [pollenFragment],
);

const { data, error, fetching } = await useQuery({
  query,
  variables: { id: parseInt(props.entityId.toString()) },
  context: { additionalTypenames: ['pollen'] },
});

const pollen = computed(() => data.value?.pollen_by_pk);

const { t, d } = useI18n();
const { localizedSortPredicate } = useLocalizedSort();

const route = useRoute();
const router = useRouter();
function edit() {
  router.push({
    path: `/pollen/${props.entityId}/edit`,
    query: route.query,
  });
}

type MotherPlant = NonNullable<
  NonNullable<ResultOf<typeof query>['pollen_by_pk']>['mother_plants']
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
    name: 'crossing__name',
    label: t('motherPlants.fields.crossing'),
    field: (row: MotherPlant) => row.crossing?.name,
    align: 'left' as const,
    sortable: true,
    sort: (
      a: MotherPlant['crossing']['name'],
      b: MotherPlant['crossing']['name'],
    ) => localizedSortPredicate(a, b),
  },
  {
    name: 'label_id',
    label: t('plants.fields.labelId'),
    field: (row: MotherPlant) => row.plant?.label_id,
    align: 'left' as const,
    sortable: true,
    sort: (
      a: MotherPlant['plant']['label_id'],
      b: MotherPlant['plant']['label_id'],
    ) => localizedSortPredicate(a, b),
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
