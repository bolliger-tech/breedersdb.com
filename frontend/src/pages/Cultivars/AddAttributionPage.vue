<template>
  <PageLayout>
    <h1>
      {{
        t('attributions.add.attributeEntity', {
          entity: t('cultivars.title', 1),
        })
      }}
    </h1>
    <AttributionAddSteps
      :entity-caption="entityCaption"
      :entity-loading="fetching"
      :entity-id="cultivar?.id || null"
      :entity-type="AttributableEntities.Cultivar"
      :focus-entity-picker="cultivarPickerRef?.focus"
      entity-icon="svguse:/icons/sprite.svg#cultivar"
      @entity-step-completed="() => cultivarPickerRef?.loadEntity()"
    >
      <template #entity-picker>
        <CultivarPicker
          ref="cultivarPickerRef"
          @cultivar="(c) => (cultivar = c)"
          @fetching="(f) => (fetching = f)"
        />
      </template>

      <template #entity-preview>
        <EntityCard
          v-if="cultivar"
          :cultivar="cultivar"
          entity-type="cultivar"
        />
        <!-- if the cultivar is missing AttributionAddSteps will handle it -->
      </template>
    </AttributionAddSteps>
  </PageLayout>
</template>

<script setup lang="ts">
import PageLayout from 'src/layouts/PageLayout.vue';
import { useI18n } from 'src/composables/useI18n';
import AttributionAddSteps from 'src/components/Attribution/Add/AttributionAddSteps.vue';
import CultivarPicker from 'src/components/Cultivar/CultivarPicker.vue';
import EntityCard from 'src/components/Entity/EntityCard.vue';
import { computed, ref } from 'vue';
import { CultivarFragment } from 'src/components/Cultivar/cultivarFragment';
import { AttributableEntities } from 'src/components/Attribution/attributableEntities';

const { t } = useI18n();

const cultivarPickerRef = ref<InstanceType<typeof CultivarPicker> | null>(null);

const cultivar = ref<CultivarFragment | null>(null);
const fetching = ref(false);

const entityCaption = computed(() => {
  if (!cultivar.value) {
    return undefined;
  }
  return cultivar.value.display_name;
});
</script>
