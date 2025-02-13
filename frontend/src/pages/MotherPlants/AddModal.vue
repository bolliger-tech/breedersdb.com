<template>
  <EntityFetchWrapper :error="error" :fetching="fetching">
    <MotherPlantModalEdit
      v-if="motherPlant"
      :mother-plant="motherPlant"
      :title="t('base.new')"
    />
  </EntityFetchWrapper>
</template>

<script setup lang="ts">
import { useI18n } from 'src/composables/useI18n';
import MotherPlantModalEdit, {
  MotherPlantInsertInput,
} from 'src/components/MotherPlant/MotherPlantModalEdit.vue';
import EntityFetchWrapper from 'src/components/Entity/EntityFetchWrapper.vue';
import { useQuery } from '@urql/vue';
import { motherPlantFragment } from 'src/components/MotherPlant/motherPlantFragment';
import { graphql } from 'src/graphql';
import { computed } from 'vue';

const props = defineProps<{ templateId?: number; entityId: 'new' }>();

const emptyMotherPlant: MotherPlantInsertInput = {
  name: '',
  date_impregnated: null,
  date_fruits_harvested: null,
  numb_flowers: null,
  numb_fruits: null,
  numb_seeds: null,
  note: null,
};

const query = graphql(
  `
    query MotherPlant(
      $id: Int!
      $MotherPlantWithPlant: Boolean = false
      $MotherPlantWithPollen: Boolean = false
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
  variables: { id: props.templateId },
  context: { additionalTypenames: ['mother_plants'] },
  pause: !props.templateId,
});

const motherPlant = computed(() => {
  if (props.templateId) {
    if (!data.value?.mother_plants_by_pk) {
      return;
    }
    return {
      ...emptyMotherPlant,
      date_impregnated: data.value.mother_plants_by_pk.date_impregnated,
      date_fruits_harvested:
        data.value.mother_plants_by_pk.date_fruits_harvested,
      pollen_id: data.value.mother_plants_by_pk.pollen_id,
      crossing_id: data.value.mother_plants_by_pk.crossing_id,
    };
  } else {
    return emptyMotherPlant;
  }
});

const { t } = useI18n();
</script>
