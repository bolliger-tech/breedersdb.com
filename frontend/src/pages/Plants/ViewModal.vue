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

      <!-- images: Carousel -->

      <EntityViewAttributionsTable
        :rows="observations"
        :title="t('attributions.observations')"
      />
      <q-separator />
      <EntityViewAttributionsTable
        :rows="treatments"
        :title="t('attributions.treatments')"
      />
      <q-separator />
      <EntityViewAttributionsTable
        :rows="samples"
        :title="t('attributions.samples')"
      />
      <q-separator />
      <EntityViewAttributionsTable
        :rows="other"
        :title="t('attributions.others')"
      />

      <pre>{{ JSON.stringify(plant.attributions_views, undefined, 2) }}</pre>
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
</script>
