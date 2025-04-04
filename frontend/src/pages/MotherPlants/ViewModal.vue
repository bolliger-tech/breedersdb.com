<template>
  <EntityFetchWrapper :error="error" :fetching="fetching">
    <EntityModalContent
      v-if="motherPlant"
      sprite-icon="female"
      :title="motherPlant.name"
      @edit="edit"
    >
      <template #default>
        <h3 class="q-my-md">{{ t('entity.basics') }}</h3>
        <EntityViewTable>
          <EntityViewTableRow :label="t('entity.commonColumns.name')">
            {{ motherPlant.name }}
          </EntityViewTableRow>
          <EntityViewTableRow :label="t('motherPlants.fields.crossing')">
            <RouterLink
              :to="`/crossings/${motherPlant.crossing?.id}`"
              class="undecorated-link"
            >
              {{ motherPlant.crossing?.name }}
            </RouterLink>
          </EntityViewTableRow>
          <EntityViewTableRow :label="t('motherPlants.fields.plant')">
            <RouterLink
              :to="`/plants/${motherPlant.plant?.id}`"
              class="undecorated-link"
            >
              {{ motherPlant.plant?.label_id }}
            </RouterLink>
          </EntityViewTableRow>
          <EntityViewTableRow :label="t('motherPlants.fields.dateImpregnated')">
            {{
              motherPlant.date_impregnated
                ? d(motherPlant.date_impregnated, 'Ymd')
                : ''
            }}
          </EntityViewTableRow>
          <EntityViewTableRow :label="t('motherPlants.fields.pollen')">
            <RouterLink
              v-if="motherPlant.pollen"
              :to="`/pollen/${motherPlant.pollen?.id}`"
              class="undecorated-link"
            >
              {{ motherPlant.pollen?.name }}
            </RouterLink>
            <span v-else class="text-body2 text-italic">{{
              t('base.notAvailable')
            }}</span>
          </EntityViewTableRow>
          <EntityViewTableRow :label="t('motherPlants.fields.numbFlowers')">
            {{ motherPlant.numb_flowers }}
          </EntityViewTableRow>
          <EntityViewTableRow :label="t('motherPlants.fields.numbFruits')">
            {{ motherPlant.numb_fruits }}
          </EntityViewTableRow>
          <EntityViewTableRow
            :label="t('motherPlants.fields.dateFruitsHarvested')"
          >
            {{
              motherPlant.date_fruits_harvested
                ? d(motherPlant.date_fruits_harvested, 'Ymd')
                : ''
            }}
          </EntityViewTableRow>
          <EntityViewTableRow :label="t('motherPlants.fields.numbSeeds')">
            {{ motherPlant.numb_seeds }}
          </EntityViewTableRow>
          <EntityTableViewTimestampRows
            :created="motherPlant.created"
            :modified="motherPlant.modified"
          />
          <EntityViewTableRow :label="t('entity.commonColumns.note')" multiline>
            {{ motherPlant.note }}
          </EntityViewTableRow>
        </EntityViewTable>
      </template>

      <template #action-left>
        <MotherPlantButtonDelete
          :mother-plant-id="motherPlant.id"
          @deleted="
            () =>
              $router.push({
                path: '/mother-plants',
                query: route.query,
              })
          "
        />
      </template>
    </EntityModalContent>
  </EntityFetchWrapper>
</template>

<script setup lang="ts">
import { useQuery } from '@urql/vue';
import EntityModalContent from 'src/components/Entity/EntityModalContent.vue';
import MotherPlantButtonDelete from 'src/components/MotherPlant/MotherPlantButtonDelete.vue';
import { graphql } from 'src/graphql';
import { computed } from 'vue';
import { motherPlantFragment } from 'src/components/MotherPlant/motherPlantFragment';
import { useI18n } from 'src/composables/useI18n';
import { useRoute, useRouter } from 'vue-router';
import EntityViewTable from 'src/components/Entity/View/EntityViewTable.vue';
import EntityViewTableRow from 'src/components/Entity/View/EntityViewTableRow.vue';
import EntityTableViewTimestampRows from 'src/components/Entity/View/EntityViewTableTimestampRows.vue';
import EntityFetchWrapper from 'src/components/Entity/EntityFetchWrapper.vue';

const props = defineProps<{ entityId: number | string }>();

const query = graphql(
  `
    query MotherPlant(
      $id: Int!
      $MotherPlantWithPlant: Boolean = true
      $MotherPlantWithPollen: Boolean = true
      $MotherPlantWithCrossing: Boolean = true
      $PollenWithCultivar: Boolean = false
      $PlantWithSegments: Boolean = false
      $CultivarWithLot: Boolean = false
      $LotWithOrchard: Boolean = false
      $LotWithCrossing: Boolean = false
    ) {
      mother_plants_by_pk(id: $id) {
        ...motherPlantFragment
      }
    }
  `,
  [motherPlantFragment],
);

const { data, error, fetching } = await useQuery({
  query,
  variables: { id: parseInt(props.entityId.toString()) },
  context: { additionalTypenames: ['mother_plants'] },
});

const motherPlant = computed(() => data.value?.mother_plants_by_pk);

const { t, d } = useI18n();

const route = useRoute();
const router = useRouter();
async function edit() {
  await router.push({
    path: `/mother-plants/${props.entityId}/edit`,
    query: route.query,
  });
}
</script>
