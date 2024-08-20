<template>
  <q-card v-if="error">
    <BaseGraphqlError :error="error" />
  </q-card>

  <EntityModalContent v-else-if="plant" sprite-icon="tree" @edit="edit">
    <template #title-text>
      <PlantLabelId :label-id="plant.label_id" />
    </template>
    <template #subtitle-text>
      <EntityName
        v-if="plant.plant_group"
        :plant-group="plant.plant_group"
        :cultivar="plant.plant_group.cultivar"
        :lot="plant.plant_group.cultivar?.lot"
        :crossing="plant.plant_group.cultivar?.lot?.crossing"
      />
    </template>

    <template #default>
      <h3 class="q-my-md">{{ t('entity.basics') }}</h3>
      <PlantEntityTable :plant="plant" />

      <EntityViewAllAttributions :attributions="attributions" />
    </template>

    <template #action-left>
      <PlantButtonEliminate v-if="!plant.disabled" :plant-id="plant.id" />
      <div v-else></div>
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
import EntityModalContent from 'src/components/Entity/EntityModalContent.vue';
import BaseGraphqlError from 'src/components/Base/BaseGraphqlError.vue';
import { graphql } from 'src/graphql';
import BaseSpinner from 'src/components/Base/BaseSpinner.vue';
import { computed } from 'vue';
import { plantFragment } from 'src/components/Plant/plantFragment';
import PlantEntityTable from 'src/components/Plant/PlantEntityTable.vue';
import PlantLabelId from 'src/components/Plant/PlantLabelId.vue';
import EntityName from 'src/components/Entity/EntityName.vue';
import EntityViewAllAttributions from 'src/components/Entity/View/EntityViewAllAttributions.vue';
import { EntityAttributionsViewFragment } from 'src/components/Entity/entityAttributionsViewFragment';
import { useI18n } from 'src/composables/useI18n';
import { useRoute, useRouter } from 'vue-router';
import PlantButtonEliminate from 'src/components/Plant/PlantButtonEliminate.vue';
import { useRefreshAttributionsViewThenQuery } from 'src/composables/useRefreshAttributionsView';
import BaseNotFound from 'src/components/Base/BaseNotFound.vue';
import { entityAttributionsViewFragment } from 'src/components/Entity/entityAttributionsViewFragment';

const props = defineProps<{ entityId: number | string }>();

const query = graphql(
  `
    query Plant(
      $id: Int!
      $PlantWithSegments: Boolean = true
      $AttributionsViewWithEntites: Boolean = true
    ) {
      plants_by_pk(id: $id) {
        ...plantFragment
        attributions_views {
          ...entityAttributionsViewFragment
        }
      }
    }
  `,
  [plantFragment, entityAttributionsViewFragment],
);

const { data, error, fetching } = useRefreshAttributionsViewThenQuery({
  query,
  variables: { id: parseInt(props.entityId.toString()) },
});

const plant = computed(() => data.value?.plants_by_pk);
const attributions = computed(
  () =>
    (plant.value?.attributions_views || []) as EntityAttributionsViewFragment[],
);

const { t } = useI18n();

const route = useRoute();
const router = useRouter();
function edit() {
  router.push({
    path: `/plants/${props.entityId}/edit`,
    query: route.query,
  });
}
</script>
