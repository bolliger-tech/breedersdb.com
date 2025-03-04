<template>
  <EntityFetchWrapper :error="error" :fetching="fetching">
    <PlantModalEdit v-if="plant" :plant="plant" :title="t('base.new')" />
  </EntityFetchWrapper>
</template>

<script setup lang="ts">
import { useI18n } from 'src/composables/useI18n';
import type { PlantInsertInput } from 'src/components/Plant/PlantModalEdit.vue';
import PlantModalEdit from 'src/components/Plant/PlantModalEdit.vue';
import EntityFetchWrapper from 'src/components/Entity/EntityFetchWrapper.vue';
import { useQuery } from '@urql/vue';
import { plantFragment } from 'src/components/Plant/plantFragment';
import { graphql } from 'src/graphql';
import { computed } from 'vue';

const props = defineProps<{ templateId?: number; entityId: 'new' }>();

const emptyPlant: PlantInsertInput = {
  serial_in_plant_row: null,
  distance_plant_row_start: null,
  geo_location: null,
  geo_location_accuracy: null,
  date_grafted: null,
  date_planted: null,
  date_eliminated: null,
  date_labeled: null,
  note: null,
  rootstock: null,
  grafting: null,
  plant_row: null,
  disabled: false,
};

const query = graphql(
  `
    query Plant($id: Int!, $PlantWithSegments: Boolean = true) {
      plants_by_pk(id: $id) {
        ...plantFragment
      }
    }
  `,
  [plantFragment],
);

const { data, error, fetching } = useQuery({
  query,
  variables: { id: props.templateId },
  context: { additionalTypenames: ['plants'] },
  pause: !props.templateId,
});

const plant = computed(() => {
  if (props.templateId) {
    if (!data.value?.plants_by_pk) {
      return;
    }
    return {
      ...emptyPlant,
      plant_group: data.value.plants_by_pk.plant_group,
      date_grafted: data.value.plants_by_pk.date_grafted,
      date_planted: data.value.plants_by_pk.date_planted,
      date_eliminated: data.value.plants_by_pk.date_eliminated,
      date_labeled: data.value.plants_by_pk.date_labeled,
      rootstock: data.value.plants_by_pk.rootstock,
      grafting: data.value.plants_by_pk.grafting,
      plant_row: data.value.plants_by_pk.plant_row,
      disabled: data.value.plants_by_pk.disabled,
    };
  } else {
    return emptyPlant;
  }
});

const { t } = useI18n();
</script>
