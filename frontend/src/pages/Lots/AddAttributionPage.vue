<template>
  <PageLayout>
    <h1>
      {{
        t('attributions.add.attributeEntity', {
          entity: t('lots.title', 1),
        })
      }}
    </h1>
    <AttributionAddSteps
      :entity-caption="entityCaption"
      :entity-loading="fetching"
      :entity-id="lot?.id || null"
      :entity-type="AttributableEntities.Lot"
      :focus-entity-picker="lotPickerRef?.focus"
      entity-icon="svguse:/icons/sprite.svg#lot"
      @entity-step-completed="() => lotPickerRef?.loadEntity()"
    >
      <template #entity-picker>
        <LotPicker
          ref="lotPickerRef"
          @lot="(l) => (lot = l)"
          @fetching="(f) => (fetching = f)"
        />
      </template>

      <template #entity-preview>
        <EntityCard v-if="lot" entity-type="lot" :lot="lot" />
        <!-- if the lot is missing AttributionAddSteps will handle it -->
      </template>
    </AttributionAddSteps>
  </PageLayout>
</template>

<script setup lang="ts">
import PageLayout from 'src/layouts/PageLayout.vue';
import { useI18n } from 'src/composables/useI18n';
import AttributionAddSteps from 'src/components/Attribution/Add/AttributionAddSteps.vue';
import LotPicker from 'src/components/Lot/LotPicker.vue';
import EntityCard from 'src/components/Entity/EntityCard.vue';
import { computed, ref } from 'vue';
import { LotFragment } from 'src/components/Lot/lotFragment';
import { AttributableEntities } from 'src/components/Attribution/attributableEntities';

const { t } = useI18n();

const lotPickerRef = ref<InstanceType<typeof LotPicker> | null>(null);

const lot = ref<LotFragment | null>(null);
const fetching = ref(false);

const entityCaption = computed(() => {
  if (!lot.value) {
    return undefined;
  }
  return lot.value.display_name;
});
</script>
