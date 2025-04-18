<template>
  <EntityFetchWrapper :error="error" :fetching="fetching">
    <EntityModalContent
      v-if="pollen"
      sprite-icon="male"
      :title="pollen.name"
      :print-data="print || undefined"
      @edit="edit"
    >
      <template #default>
        <h3 class="q-my-md">{{ t('entity.basics') }}</h3>
        <PollenEntityTable :pollen="pollen" />

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
          @deleted="() => $router.push({ path: '/pollen', query: route.query })"
        />
      </template>
    </EntityModalContent>
  </EntityFetchWrapper>
</template>

<script setup lang="ts">
import { useQuery } from '@urql/vue';
import EntityModalContent from 'src/components/Entity/EntityModalContent.vue';
import PollenButtonDelete from 'src/components/Pollen/PollenButtonDelete.vue';
import type { ResultOf } from 'src/graphql';
import { graphql } from 'src/graphql';
import { computed } from 'vue';
import { pollenFragment } from 'src/components/Pollen/pollenFragment';
import { useI18n } from 'src/composables/useI18n';
import { useRoute, useRouter } from 'vue-router';
import { useLocalizedSort } from 'src/composables/useLocalizedSort';
import EntityRelatedTable from 'src/components/Entity/EntityRelatedTable.vue';
import EntityLabelId from 'src/components/Entity/EntityLabelId.vue';
import EntityFetchWrapper from 'src/components/Entity/EntityFetchWrapper.vue';
import PollenEntityTable from 'src/components/Pollen/PollenEntityTable.vue';
import { makeTextLabel } from 'src/utils/labelUtils';

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

const print = computed(
  () =>
    pollen.value?.name &&
    makeTextLabel({
      text: pollen.value?.name,
      caption: t('pollen.title', 1),
    }),
);

const { localizedSortPredicate } = useLocalizedSort();

const route = useRoute();
const router = useRouter();
async function edit() {
  await router.push({
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
