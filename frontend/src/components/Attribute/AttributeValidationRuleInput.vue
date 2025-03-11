<template>
  <EntityInput
    v-if="['INTEGER', 'FLOAT', 'RATING'].includes(dataType)"
    :ref="(el: InputRef) => (minRef = el)"
    :model-value="validationRule.min"
    :label="t('attributes.minLong')"
    :rules="[
      (val: string | number | null | undefined) =>
        nonEmptyStringRule(val, t('attributes.min')),
      integerUnlessTypeFloatRule,
      (val: string | number | null | undefined) => {
        const minForType = 'RATING' === dataType ? 0 : MIN_INT_PG;
        return (
          ((!!val || val === 0) && parseFloat(val.toString()) >= minForType) ||
          t('base.validation.min', { x: minForType })
        );
      },
      (val: string | number | null | undefined) => {
        const maxForType = 'RATING' === dataType ? 9 : MAX_INT_PG;
        const max = Math.min(maxForType, validationRule.max || maxForType);
        return (
          ((!!val || val === 0) && parseFloat(val.toString()) <= max) ||
          t('base.validation.max', { x: max })
        );
      },
    ]"
    type="number"
    autocomplete="off"
    required
    :step="inputStep"
    :min="inputMin"
    :max="inputMax"
    @update:model-value="
      (val) => {
        validationRule.min = val ? parseFloat(val.toString()) : undefined;
      }
    "
  />
  <EntityInput
    v-if="['INTEGER', 'FLOAT', 'RATING'].includes(dataType)"
    :ref="(el: InputRef) => (maxRef = el)"
    :model-value="validationRule.max"
    :label="t('attributes.maxLong')"
    :rules="[
      (val: string | number | null | undefined) =>
        nonEmptyStringRule(val, t('attributes.max')),
      integerUnlessTypeFloatRule,
      (val: string | number | null | undefined) => {
        const minForType = 'RATING' === dataType ? 0 : MIN_INT_PG;
        const min = Math.max(minForType, validationRule.min || minForType);
        return (
          ((!!val || val === 0) && parseFloat(val.toString()) >= min) ||
          t('base.validation.min', { x: min })
        );
      },
      (val: string | number | null | undefined) => {
        const maxForType = 'RATING' === dataType ? 9 : MAX_INT_PG;
        return (
          ((!!val || val === 0) && parseFloat(val.toString()) <= maxForType) ||
          t('base.validation.max', { x: maxForType })
        );
      },
    ]"
    type="number"
    autocomplete="off"
    required
    :step="inputStep"
    :min="inputMin"
    :max="inputMax"
    @update:model-value="
      (val) => {
        validationRule.max = val ? parseFloat(val.toString()) : undefined;
      }
    "
  />
  <EntityInput
    v-if="['INTEGER', 'FLOAT'].includes(dataType)"
    :ref="(el: InputRef) => (stepRef = el)"
    :model-value="validationRule.step"
    :label="t('attributes.step')"
    :explainer="
      'INTEGER' === dataType
        ? t('attributes.stepExplainerInteger')
        : t('attributes.stepExplainerFloat')
    "
    :rules="[
      (val: string | number | null | undefined) =>
        nonEmptyStringRule(val, t('attributes.step')),
      (val: string | number | null | undefined) =>
        (!val && val !== 0) ||
        parseFloat(val.toString()) > 0 ||
        t('base.validation.xMustBeGreaterThanZero', {
          x: t('attributes.step'),
        }),
      integerUnlessTypeFloatRule,
    ]"
    type="number"
    autocomplete="off"
    required
    :step="inputStep"
    :min="'FLOAT' === dataType ? 0.001 : 1"
    :max="inputMax"
    @update:model-value="
      (val) => {
        validationRule.step = val ? parseFloat(val.toString()) : undefined;
      }
    "
  />
</template>

<script setup lang="ts">
import { type AttributeDataTypes } from 'src/graphql';
import { useI18n } from 'src/composables/useI18n';
import { computed, ref, watch } from 'vue';
import type { InputRef } from 'src/composables/useEntityForm';
import type { AttributeFragment } from 'src/components/Attribute/attributeFragment';
import EntityInput from '../Entity/Edit/EntityInput.vue';
import { MAX_INT_PG, MIN_INT_PG } from 'src/utils/constants';

export interface AttributeEntityFormValidationRuleProps {
  dataType: AttributeDataTypes;
}

const props = defineProps<AttributeEntityFormValidationRuleProps>();
const modelValue = defineModel<AttributeFragment['validation_rule']>({
  required: true,
});
const stepRef = defineModel<InputRef | null | undefined>('stepRef', {
  required: true,
});
const minRef = defineModel<InputRef | null | undefined>('minRef', {
  required: true,
});
const maxRef = defineModel<InputRef | null | undefined>('maxRef', {
  required: true,
});

function integerUnlessTypeFloatRule(val: string | null) {
  return (
    (val !== null && parseFloat(val) === parseInt(val)) ||
    props.dataType === 'FLOAT' ||
    t('base.validation.integer')
  );
}

function nonEmptyStringRule(
  val: string | number | null | undefined,
  fieldName: string,
) {
  return (
    ((!!val || val === 0) && val.toString().trim() !== '') ||
    t('base.validation.xIsRequired', { x: fieldName })
  );
}

const inputStep = computed(() =>
  ['INTEGER', 'RATING'].includes(props.dataType) ? 1 : 0.001,
);
const inputMin = computed(() => ('RATING' === props.dataType ? 0 : undefined));
const inputMax = computed(() => ('RATING' === props.dataType ? 9 : undefined));

const validationRule = ref({
  min: modelValue.value?.min,
  max: modelValue.value?.max,
  step: modelValue.value?.step,
});

watch(
  [validationRule, () => props.dataType],
  async () => {
    if (['INTEGER', 'FLOAT'].includes(props.dataType)) {
      modelValue.value = {
        min: validationRule.value.min ?? MIN_INT_PG,
        max: validationRule.value.max ?? MAX_INT_PG,
        step:
          validationRule.value.step ??
          ('INTEGER' === props.dataType ? 1 : 0.001),
      };
    } else if ('RATING' === props.dataType) {
      modelValue.value = {
        min: validationRule.value.min ?? 1,
        max: validationRule.value.max ?? 9,
        step: 1,
      };
    } else {
      modelValue.value = null;
    }

    await minRef.value?.validate();
    await maxRef.value?.validate();
    await stepRef.value?.validate();
  },
  { deep: true },
);

const { t } = useI18n();
</script>
