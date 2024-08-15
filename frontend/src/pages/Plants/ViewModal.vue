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

      <h3 class="q-mb-md">{{ t('attributions.photos') }}</h3>
      <EntityViewAttributionImageGallery :images="images" />

      <h3 class="q-mb-md">{{ t('attributions.observations') }}</h3>
      <EntityViewAttributionsTable
        attribute-type="OBSERVATION"
        :rows="observations"
      />

      <h3 class="q-mb-md">{{ t('attributions.treatments') }}</h3>
      <EntityViewAttributionsTable
        attribute-type="TREATMENT"
        :rows="treatments"
      />

      <h3 class="q-mb-md">{{ t('attributions.samples') }}</h3>
      <EntityViewAttributionsTable attribute-type="SAMPLE" :rows="samples" />

      <h3 class="q-mb-md">{{ t('attributions.others') }}</h3>
      <EntityViewAttributionsTable attribute-type="OTHER" :rows="other" />
    </template>

    <template #action-left>
      <PlantButtonEliminate v-if="!plant.disabled" :plant-id="plant.id" />
      <div v-else></div>
    </template>
  </EntityModalContent>

  <q-card v-else-if="fetching || refreshingAttributionsView">
    <BaseSpinner size="xl" />
  </q-card>

  <q-card v-else>
    <BaseNotFound />
  </q-card>
</template>

<script setup lang="ts">
import { useQuery } from '@urql/vue';
import EntityModalContent from 'src/components/Entity/EntityModalContent.vue';
import BaseGraphqlError from 'src/components/Base/BaseGraphqlError.vue';
import { graphql } from 'src/graphql';
import BaseSpinner from 'src/components/Base/BaseSpinner.vue';
import { computed } from 'vue';
import { plantFragment } from 'src/components/Plant/plantFragment';
import PlantEntityTable from 'src/components/Plant/PlantEntityTable.vue';
import PlantLabelId from 'src/components/Plant/PlantLabelId.vue';
import EntityName from 'src/components/Entity/EntityName.vue';
import EntityViewAttributionsTable from 'src/components/Entity/View/EntityViewAttributionsTable.vue';
import { EntityAttributionsViewFragment } from 'src/components/Entity/entityAttributionsViewFragment';
import { useI18n } from 'src/composables/useI18n';
import EntityViewAttributionImageGallery from 'src/components/Entity/View/EntityViewAttributionImageGallery.vue';
import { useRoute, useRouter } from 'vue-router';
import PlantButtonEliminate from 'src/components/Plant/PlantButtonEliminate.vue';
import { useRefreshAttributionsView } from 'src/composables/useRefreshAttributionsView';
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

const {
  data,
  error: plantError,
  fetching,
  resume: enablePlantQuery,
} = useQuery({
  query,
  variables: { id: parseInt(props.entityId.toString()) },
  pause: true,
  requestPolicy: 'cache-and-network',
});

const {
  executeMutation: refreshAttributionsView,
  fetching: refreshingAttributionsView,
  error: attributionsRefreshError,
} = useRefreshAttributionsView();

refreshAttributionsView({}).then(() => enablePlantQuery());

const error = computed(
  () => plantError.value || attributionsRefreshError.value,
);

const plant = computed(() => data.value?.plants_by_pk);
const attributions = computed(
  () =>
    (plant.value?.attributions_views || []) as EntityAttributionsViewFragment[],
);

const images = computed(() =>
  attributions.value.filter(
    (row) => row.data_type === 'PHOTO' || row.photo_note,
  ),
);

const { t } = useI18n();

const observations = computed(() =>
  attributions.value.filter((row) => row.attribute_type === 'OBSERVATION'),
);
const treatments = computed(() =>
  attributions.value.filter((row) => row.attribute_type === 'TREATMENT'),
);
const samples = computed(() =>
  attributions.value.filter((row) => row.attribute_type === 'SAMPLE'),
);
const other = computed(() =>
  attributions.value.filter((row) => row.attribute_type === 'OTHER'),
);

const route = useRoute();
const router = useRouter();
function edit() {
  router.push({
    path: `/plants/${props.entityId}/edit`,
    query: route.query,
  });
}
</script>
