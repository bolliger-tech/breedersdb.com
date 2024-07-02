<template>
  <PageLayout>
    <h1>{{ t('attribute.title') }}</h1>
    <AttributeSteps
      :has-entity="false"
      :entity-title="t('plants.title', { count: 1 })"
      :entity-caption="undefined"
      entity-icon="svguse:/icons/sprite.svg#tree"
    >
      <template #entity-selector>
        <PlantSelector />
      </template>
    </AttributeSteps>
  </PageLayout>
</template>

<script setup lang="ts">
import PageLayout from 'src/layouts/PageLayout.vue';
import { useI18n } from 'src/composables/useI18n';
import AttributeSteps from 'src/components/Attribute/AttributeSteps.vue';
import PlantSelector from 'src/components/Plant/PlantSelector.vue';

const { t } = useI18n();
</script>
