<template>
  <EntitySelect
    ref="attributeCardinalityRef"
    v-model="attributeCardinality"
    :label="t('attributes.columns.cardinality')"
    :options="attributeCardinalityOptions"
    option-value="value"
    option-label="label"
    :required="required"
    :clearable="false"
    :hint="
      required
        ? `${t('attributes.cardinalityHint')}. ${t('base.required')}.`
        : `${t('attributes.cardinalityHint')}.`
    "
    :loading="fetching"
    :rules="[
      (val: (typeof attributeCardinalityOptions)[number] | null | undefined) =>
        cardinalityChangeRule(val?.value),
    ]"
    no-sort
  >
    <template #option="{ opt, itemProps }">
      <q-item v-bind="itemProps">
        <q-item-section>
          <q-item-label>{{ opt.label }}</q-item-label>
          <q-item-label caption>{{ opt.caption }}</q-item-label>
        </q-item-section>
      </q-item>
    </template>
  </EntitySelect>
</template>

<script setup lang="ts">
import { useI18n } from 'src/composables/useI18n';
import { computed, ref } from 'vue';
import EntitySelect from '../Entity/Edit/EntitySelect.vue';
import { focusInView } from 'src/utils/focusInView';
import type { AttributeCardinalities } from 'src/graphql';
import type { ComponentExposed } from 'vue-component-type-helpers';
import { cardinalityToLabel } from 'src/utils/attributeUtils';
import { useCardinalityChangeRule } from './useCardinalityChangeRule';

export interface AttributeCardinalitySelectProps {
  required?: boolean;
  initialCardinality: AttributeCardinalities;
  attributeId?: number | undefined;
}
const props = defineProps<AttributeCardinalitySelectProps>();

const attributeCardinalityRef = ref<ComponentExposed<
  typeof EntitySelect
> | null>(null);

defineExpose({
  validate: () => attributeCardinalityRef.value?.validate(),
  focus: () =>
    attributeCardinalityRef.value && focusInView(attributeCardinalityRef.value),
});

const modelValue = defineModel<AttributeCardinalities | null>({
  required: true,
});

const { t } = useI18n();

const { cardinalityChangeRule, fetching } = useCardinalityChangeRule({
  attributeId: props.attributeId,
  initialCardinality: props.initialCardinality,
});

const attributeCardinalityOptions: {
  value: AttributeCardinalities;
  label: string;
  caption: string;
}[] = [
  {
    value: 'REPEATABLE',
    label: cardinalityToLabel('REPEATABLE', t),
    caption: t('attributes.cardinalityCaptions.repeatable'),
  },
  {
    value: 'UNIQUE_BLOCK',
    label: cardinalityToLabel('UNIQUE_BLOCK', t),
    caption: t('attributes.cardinalityCaptions.uniqueBlock'),
  },
  {
    value: 'UNIQUE_REPLACE',
    label: cardinalityToLabel('UNIQUE_REPLACE', t),
    caption: t('attributes.cardinalityCaptions.uniqueReplace'),
  },
];

const attributeCardinality = computed({
  get: () =>
    attributeCardinalityOptions.find((o) => o.value === modelValue.value),
  set: (cardinality) => (modelValue.value = cardinality?.value ?? null),
});
</script>
