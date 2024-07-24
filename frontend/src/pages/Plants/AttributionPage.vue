<template>
  <PageLayout>
    <h1>
      {{ t('attribute.attributeEntity', { entity: t('plants.title', 1) }) }}
    </h1>
    <AttributionSteps
      :entity-caption="entityCaption"
      :entity-loading="fetching"
      :entity-id="plant?.id || null"
      :entity-type="AttributableEntities.Plant"
      :focus-entity-selector="plantSelectorRef?.focus"
      entity-icon="svguse:/icons/sprite.svg#tree"
      @entity-step-completed="() => plantSelectorRef?.onManualInput()"
    >
      <template #entity-selector>
        <PlantSelector
          ref="plantSelectorRef"
          reject-eliminated
          @plant="(p) => (plant = p)"
          @fetching="(f) => (fetching = f)"
        />
      </template>

      <template #entity-preview>
        <PlantCard
          v-if="plant"
          :label-id="plant.label_id"
          :plant-group="plant.plant_group"
        />
        <!-- if the plant is missing AttributionSteps will handle it -->
      </template>
    </AttributionSteps>
  </PageLayout>
</template>

<script setup lang="ts">
import PageLayout from 'src/layouts/PageLayout.vue';
import { useI18n } from 'src/composables/useI18n';
import AttributionSteps from 'src/components/Attribution/Add/AttributionSteps.vue';
import PlantSelector from 'src/components/Plant/PlantSelector.vue';
import PlantCard from 'src/components/Plant/PlantCard.vue';
import { computed, ref } from 'vue';
import { PlantFragment } from 'src/components/Plant/plantFragment';
import { AttributableEntities } from 'src/components/Attribution/attributableEntities';

const { t } = useI18n();

const plantSelectorRef = ref<InstanceType<typeof PlantSelector> | null>(null);

const plant = ref<PlantFragment | null>(null);
const fetching = ref(false);

const entityCaption = computed(() => {
  if (!plant.value) {
    return undefined;
  }
  return plant.value.label_id;
});
</script>
