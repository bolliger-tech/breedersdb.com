<template>
  <q-card v-if="error">
    <BaseGraphqlError :error="error" />
  </q-card>

  <MotherPlantModalEdit
    v-else-if="motherPlant"
    :mother-plant="motherPlant"
    :title="t('base.edit')"
  />

  <q-card v-else>
    <BaseSpinner size="xl" />
  </q-card>
</template>

<script setup lang="ts">
import { useQuery } from '@urql/vue';
import { motherPlantFragment } from 'src/components/MotherPlant/motherPlantFragment';
import { graphql } from 'src/graphql';
import { computed } from 'vue';
import BaseGraphqlError from 'src/components/Base/BaseGraphqlError.vue';
import BaseSpinner from 'src/components/Base/BaseSpinner.vue';
import { useI18n } from 'src/composables/useI18n';
import MotherPlantModalEdit from 'src/components/MotherPlant/MotherPlantModalEdit.vue';

const props = defineProps<{ entityId: number | string }>();

const query = graphql(
  `
    query MotherPlant(
      $id: Int!
      $withPlant: Boolean = false
      $withPollen: Boolean = false
      $withCrossing: Boolean = false
      $withParentCultivar: Boolean = false
      $withCultivar: Boolean = false
      $withMotherPlants: Boolean = false
      $withSegments: Boolean = false
      $withAttributions: Boolean = false
    ) {
      mother_plants_by_pk(id: $id) {
        ...motherPlantFragment
      }
    }
  `,
  [motherPlantFragment],
);

const { data, error } = useQuery({
  query,
  variables: { id: parseInt(props.entityId.toString()) },
});
const motherPlant = computed(() => data.value?.mother_plants_by_pk);

const { t } = useI18n();
</script>
