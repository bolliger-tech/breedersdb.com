<template>
  <EntityFetchWrapper :error="error" :fetching="fetching">
    <EntityModalContent
      v-if="motherPlant"
      sprite-icon="female"
      :title="motherPlant.name"
      :print-data="print || undefined"
      @edit="edit"
    >
      <template #default>
        <h3 class="q-my-md">{{ t('entity.basics') }}</h3>
        <MotherPlantEntityTable :mother-plant="motherPlant" />
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
import EntityFetchWrapper from 'src/components/Entity/EntityFetchWrapper.vue';
import MotherPlantEntityTable from 'src/components/MotherPlant/MotherPlantEntityTable.vue';
import { makeTextLabel } from 'src/utils/labelUtils';

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

const { t } = useI18n();

const print = computed(
  () =>
    motherPlant.value?.name &&
    makeTextLabel({
      text: motherPlant.value?.name,
      caption: t('motherPlants.title', 1),
    }),
);

const route = useRoute();
const router = useRouter();
async function edit() {
  await router.push({
    path: `/mother-plants/${props.entityId}/edit`,
    query: route.query,
  });
}
</script>
