<template>
  <PageLayout>
    <h1>{{ t('attribute.title') }}</h1>
    <AttributeSteps
      :entity-title="t('plants.title', { count: 1 })"
      :entity-caption="entityCaption"
      :entity-loading="fetching"
      :has-entity="!!plant"
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
    </AttributeSteps>
  </PageLayout>
</template>

<script setup lang="ts">
import PageLayout from 'src/layouts/PageLayout.vue';
import { useI18n } from 'src/composables/useI18n';
import AttributeSteps from 'src/components/Attribute/AttributeSteps.vue';
import PlantSelector from 'src/components/Plant/PlantSelector.vue';
import { computed, ref } from 'vue';
import { PlantFragment } from 'src/components/Plant/plantFragment';

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
