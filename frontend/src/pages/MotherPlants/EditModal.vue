<template>
  <EntityFetchWrapper :error="error" :fetching="fetching">
    <MotherPlantModalEdit
      v-if="motherPlant"
      :mother-plant="motherPlant"
      :title="t('base.edit')"
    />
  </EntityFetchWrapper>
</template>

<script setup lang="ts">
import { useQuery } from '@urql/vue';
import { motherPlantFragment } from 'src/components/MotherPlant/motherPlantFragment';
import { graphql } from 'src/graphql';
import { computed } from 'vue';
import { useI18n } from 'src/composables/useI18n';
import MotherPlantModalEdit from 'src/components/MotherPlant/MotherPlantModalEdit.vue';
import EntityFetchWrapper from 'src/components/Entity/EntityFetchWrapper.vue';

const props = defineProps<{ entityId: number | string }>();

const query = graphql(
  `
    query MotherPlant(
      $id: Int!
      $MotherPlantWithPlant: Boolean = false
      $MotherPlantWithPollen: Boolean = true
      $MotherPlantWithCrossing: Boolean = false
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

const { data, error, fetching } = useQuery({
  query,
  variables: { id: parseInt(props.entityId.toString()) },
  context: { additionalTypenames: ['mother_plants'] },
});
const motherPlant = computed(() => data.value?.mother_plants_by_pk);

const { t } = useI18n();
</script>
