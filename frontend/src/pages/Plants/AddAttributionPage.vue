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
      :entity="{ data: plant, type: AttributableEntities.Plant }"
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
    </AttributionAddSteps>
  </PageLayout>
</template>

<script setup lang="ts">
import PageLayout from 'src/layouts/PageLayout.vue';
import { useI18n } from 'src/composables/useI18n';
import AttributionAddSteps from 'src/components/Attribution/Add/AttributionAddSteps.vue';
import PlantPicker from 'src/components/Plant/PlantPicker.vue';
import { computed, ref } from 'vue';
import type { PlantFragmentWithSegments } from 'src/components/Plant/plantFragment';
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
