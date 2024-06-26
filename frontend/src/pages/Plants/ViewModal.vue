<template>
  <q-card v-if="error">
    <BaseGraphqlError :error="error" />
  </q-card>

  <EntityModalContent v-else-if="plant" @edit="edit">
    <template #title>
      <BaseSpriteIcon name="tree" color="grey-7" size="50px" />
      <div class="q-ma-sm">
        <h2 class="q-ma-none">
          <PlantLabelId :label-id="plant.label_id" />
        </h2>
        <EntityName
          :plant-group="plant.plant_group"
          :cultivar="plant.plant_group?.cultivar"
          :lot="plant.plant_group?.cultivar.lot"
          :crossing="plant.plant_group?.cultivar.lot.crossing"
        />
      </div>
    </template>

    <template #default>
      <h3 class="q-my-md">{{ t('entity.basics') }}</h3>
      <PlantEntityTable :plant="plant" />

      <h3 class="q-mb-md">{{ t('attributions.photos') }}</h3>
      <EntityViewAttributionImageGallery
        :images="images"
        :plant="plant"
        :plant-group="plant.plant_group"
        :cultivar="plant.plant_group?.cultivar"
        :lot="plant.plant_group?.cultivar.lot"
        :crossing="plant.plant_group?.cultivar.lot.crossing"
      />

      <h3 class="q-mb-md">{{ t('attributions.observations') }}</h3>
      <EntityViewAttributionsTable
        attribute-type="OBSERVATION"
        :rows="observations"
        :plant="plant"
        :plant-group="plant.plant_group"
        :cultivar="plant.plant_group?.cultivar"
        :lot="plant.plant_group?.cultivar.lot"
        :crossing="plant.plant_group?.cultivar.lot.crossing"
      />

      <h3 class="q-mb-md">{{ t('attributions.treatments') }}</h3>
      <EntityViewAttributionsTable
        attribute-type="TREATMENT"
        :rows="treatments"
        :plant="plant"
        :plant-group="plant.plant_group"
        :cultivar="plant.plant_group?.cultivar"
        :lot="plant.plant_group?.cultivar.lot"
        :crossing="plant.plant_group?.cultivar.lot.crossing"
      />

      <h3 class="q-mb-md">{{ t('attributions.samples') }}</h3>
      <EntityViewAttributionsTable
        attribute-type="SAMPLE"
        :rows="samples"
        :plant="plant"
        :plant-group="plant.plant_group"
        :cultivar="plant.plant_group?.cultivar"
        :lot="plant.plant_group?.cultivar.lot"
        :crossing="plant.plant_group?.cultivar.lot.crossing"
      />

      <h3 class="q-mb-md">{{ t('attributions.others') }}</h3>
      <EntityViewAttributionsTable
        attribute-type="OTHER"
        :rows="other"
        :plant="plant"
        :plant-group="plant.plant_group"
        :cultivar="plant.plant_group?.cultivar"
        :lot="plant.plant_group?.cultivar.lot"
        :crossing="plant.plant_group?.cultivar.lot.crossing"
      />
    </template>

    <template #action-left>
      <PlantButtonEliminate v-if="!plant.disabled" :plant-id="plant.id" />
      <div v-else></div>
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
import EntityViewAttributionsTable from 'src/components/Entity/View/EntityViewAttributionsTable.vue';
import { EntityAttributionsViewFragment } from 'src/components/Entity/entityAttributionsViewFragment';
import { useI18n } from 'src/composables/useI18n';
import EntityViewAttributionImageGallery from 'src/components/Entity/View/EntityViewAttributionImageGallery.vue';
import { useRoute, useRouter } from 'vue-router';
import PlantButtonEliminate from 'src/components/Plant/PlantButtonEliminate.vue';

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
const attributions = computed(
  () =>
    (plant.value?.attributions_views || []) as EntityAttributionsViewFragment[],
);

const images = computed(() =>
  attributions.value.filter((row) => row.data_type === 'PHOTO'),
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
