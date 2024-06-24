<template>
  <q-card v-if="error">
    <BaseGraphqlError :error="error" />
  </q-card>

  <EntityModalContent v-else-if="plant">
    <template #title>
      <BaseSpriteIcon name="tree" color="grey-7" size="lg" />
      <div class="q-ma-sm">
        <h4 class="q-ma-none">
          <PlantLabelId :label-id="plant.label_id" />
        </h4>
        <EntityName
          :plant-group="plant.plant_group"
          :cultivar="plant.plant_group?.cultivar"
          :lot="plant.plant_group?.cultivar.lot"
          :crossing="plant.plant_group?.cultivar.lot.crossing"
        />
      </div>
    </template>

    <template #default>
      <PlantEntityTable :plant="plant" />

      <!-- <pre>{{ JSON.stringify(plant, undefined, 2) }}</pre> -->
    </template>
  </EntityModalContent>

  <q-card v-else>
    <BaseSpinner />
  </q-card>
</template>

<script setup lang="ts">
import { useQuery } from '@urql/vue';
import EntityModalContent from 'src/components/Entity/EntityModalContent.vue';
import BaseGraphqlError from 'src/components/Base/BaseGraphqlError.vue';
import { graphql } from 'src/graphql';
import BaseSpinner from 'src/components/Base/BaseSpinner.vue';
import BaseSpriteIcon from 'src/components/Base/BaseSpriteIcon/BaseSpriteIcon.vue';
import PlantLabelId from 'src/components/Plant/PlantLabelId.vue';
import { computed } from 'vue';
import { plantFragment } from 'src/components/Plant/plantFragment';
import PlantEntityTable from 'src/components/Plant/PlantEntityTable.vue';
import EntityName from 'src/components/Entity/EntityName.vue';

const props = defineProps<{ entityId: number | string }>();

const query = graphql(
  `
    query Plant(
      $id: Int!
      $withAttributions: Boolean = true
      $withSegments: Boolean = true
    ) {
      plants_by_pk(id: $id) {
        ...plantFragment
      }
    }
  `,
  [plantFragment],
);

const { data, error } = useQuery({
  query,
  variables: { id: parseInt(props.entityId.toString()) },
});

const plant = computed(() => data.value?.plants_by_pk);
</script>
