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
      :entity-id="plantGroup?.id || null"
      :entity-type="AttributableEntities.PlantGroup"
      :focus-entity-selector="plantGroupSelectorRef?.focus"
      entity-icon="svguse:/icons/sprite.svg#tree-group"
      @entity-step-completed="() => plantGroupSelectorRef?.onManualInput()"
    >
      <template #entity-selector>
        <PlantGroupSelector
          ref="plantGroupSelectorRef"
          reject-disabled
          @plant-group="(pg) => (plantGroup = pg)"
          @fetching="(f) => (fetching = f)"
        />
      </template>

      <template #entity-preview>
        <PlantGroupCard
          v-if="plantGroup"
          :label-id="plantGroup.label_id || undefined"
          :plant-group="plantGroup"
        />
        <!-- if the plantGroup is missing AttributionAddSteps will handle it -->
      </template>
    </AttributionAddSteps>
  </PageLayout>
</template>

<script setup lang="ts">
import PageLayout from 'src/layouts/PageLayout.vue';
import { useI18n } from 'src/composables/useI18n';
import AttributionAddSteps from 'src/components/Attribution/Add/AttributionAddSteps.vue';
import PlantGroupSelector from 'src/components/PlantGroup/PlantGroupSelector.vue';
import PlantGroupCard from 'src/components/PlantGroup/PlantGroupCard.vue';
import { computed, ref } from 'vue';
import { PlantGroupFragment } from 'src/components/PlantGroup/plantGroupFragment';
import { AttributableEntities } from 'src/components/Attribution/attributableEntities';

const { t } = useI18n();

const plantGroupSelectorRef = ref<InstanceType<
  typeof PlantGroupSelector
> | null>(null);

const plantGroup = ref<PlantGroupFragment | null>(null);
const fetching = ref(false);

const entityCaption = computed(() => {
  if (!plantGroup.value) {
    return undefined;
  }
  return plantGroup.value.label_id;
});
</script>
