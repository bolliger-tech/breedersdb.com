<template>
  <PageLayout>
    <h1>
      {{
        t('attributions.add.attributeEntity', {
          entity: t('plantGroups.title', 1),
        })
      }}
    </h1>
    <AttributionAddSteps
      :entity-caption="entityCaption"
      :entity-loading="fetching"
      :entity="{ data: plantGroup, type: AttributableEntities.PlantGroup }"
      :focus-entity-picker="plantGroupPickerRef?.focus"
      entity-icon="svguse:/icons/sprite.svg#tree-group"
      @entity-step-completed="() => plantGroupPickerRef?.loadEntity()"
    >
      <template #entity-picker>
        <PlantGroupPicker
          ref="plantGroupPickerRef"
          reject-disabled
          @plant-group="(pg) => (plantGroup = pg)"
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
import PlantGroupPicker from 'src/components/PlantGroup/PlantGroupPicker.vue';
import { computed, ref } from 'vue';
import { PlantGroupFragment } from 'src/components/PlantGroup/plantGroupFragment';
import { AttributableEntities } from 'src/components/Attribution/attributableEntities';

const { t } = useI18n();

const plantGroupPickerRef = ref<InstanceType<typeof PlantGroupPicker> | null>(
  null,
);

const plantGroup = ref<PlantGroupFragment | null>(null);
const fetching = ref(false);

const entityCaption = computed(() => {
  if (!plantGroup.value) {
    return undefined;
  }
  return plantGroup.value.label_id;
});
</script>
