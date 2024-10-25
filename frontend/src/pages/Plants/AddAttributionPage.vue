<template>
  <PageLayout>
    <h1>
      {{
        t('attributions.add.attributeEntity', { entity: t('plants.title', 1) })
      }}
    </h1>
    <AttributionAddSteps
      :entity-caption="entityCaption"
      :entity-loading="fetching"
      :entity-id="plant?.id || null"
      :entity-type="AttributableEntities.Plant"
      :focus-entity-picker="plantPickerRef?.focus"
      entity-icon="svguse:/icons/sprite.svg#tree"
      @entity-step-completed="() => plantPickerRef?.loadEntity()"
    >
      <template #entity-picker>
        <PlantPicker
          ref="plantPickerRef"
          reject-eliminated
          @plant="(p) => (plant = p)"
          @fetching="(f) => (fetching = f)"
        />
      </template>

      <template #entity-preview>
        <EntityCard
          v-if="plant"
          entity-type="plant"
          :label-id="plant.label_id"
          :plant-group="plant.plant_group"
        />
        <!-- if the plant is missing AttributionAddSteps will handle it -->
      </template>
    </AttributionAddSteps>
  </PageLayout>
</template>

<script setup lang="ts">
import PageLayout from 'src/layouts/PageLayout.vue';
import { useI18n } from 'src/composables/useI18n';
import AttributionAddSteps from 'src/components/Attribution/Add/AttributionAddSteps.vue';
import PlantPicker from 'src/components/Plant/PlantPicker.vue';
import EntityCard from 'src/components/Entity/EntityCard.vue';
import { computed, ref } from 'vue';
import { PlantFragmentWithSegments } from 'src/components/Plant/plantFragment';
import { AttributableEntities } from 'src/components/Attribution/attributableEntities';

const { t } = useI18n();

const plantPickerRef = ref<InstanceType<typeof PlantPicker> | null>(null);

const plant = ref<PlantFragmentWithSegments | null>(null);
const fetching = ref(false);

const entityCaption = computed(() => {
  if (!plant.value) {
    return undefined;
  }
  return plant.value.label_id;
});
</script>
