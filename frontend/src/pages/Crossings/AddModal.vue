<template>
  <EntityFetchWrapper :error="error" :fetching="fetching">
    <CrossingModalEdit
      v-if="crossing"
      :crossing="crossing"
      :title="t('base.new')"
    />
  </EntityFetchWrapper>
</template>

<script setup lang="ts">
import { useI18n } from 'src/composables/useI18n';
import CrossingModalEdit, {
  CrossingInsertInput,
} from 'src/components/Crossing/CrossingModalEdit.vue';
import EntityFetchWrapper from 'src/components/Entity/EntityFetchWrapper.vue';
import { useQuery } from '@urql/vue';
import { crossingFragment } from 'src/components/Crossing/crossingFragment';
import { lotFragment } from 'src/components/Lot/lotFragment';
import { motherPlantFragment } from 'src/components/MotherPlant/motherPlantFragment';
import { cultivarFragment } from 'src/components/Cultivar/cultivarFragment';
import { graphql } from 'src/graphql';
import { computed } from 'vue';

const props = defineProps<{ templateId?: number; entityId: 'new' }>();

const emptyCrossing: CrossingInsertInput = {
  name: '',
  mother_cultivar_id: null,
  father_cultivar_id: null,
  note: null,
};

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
  variables: { id: props.templateId },
  context: { additionalTypenames: ['crossings'] },
  pause: !props.templateId,
});

const crossing = computed(() => {
  if (props.templateId) {
    if (!data.value?.crossings_by_pk) {
      return;
    }
    return {
      ...emptyCrossing,
      mother_cultivar_id: data.value.crossings_by_pk.mother_cultivar_id,
      father_cultivar_id: data.value.crossings_by_pk.father_cultivar_id,
    };
  } else {
    return emptyCrossing;
  }
});

const { t } = useI18n();
</script>
