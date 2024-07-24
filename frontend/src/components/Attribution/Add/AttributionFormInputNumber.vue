<template>
  <q-input
    ref="inputRef"
    :bg-color="inputBgColor"
    dense
    outlined
    type="number"
    input-mode="decimal"
    :pattern="isIntegerOnly && $q.platform.is.ios ? '[0-9]*' : undefined"
    autocomplete="off"
    :placeholder="t('attributions.add.numberPlaceholder')"
    clearable
    :hide-bottom-space="!inputRef?.hasError"
    :min="validation.min"
    :max="validation.max"
    :step="validation.step"
    :rules="rules"
    :model-value="modelValue"
    @update:model-value="updateModelValue"
  />
</template>
<script setup lang="ts">
import { useInputBackground } from 'src/composables/useInputBackground';
import { computed, ref } from 'vue';
import { isValidFloat, isValidInteger } from 'src/utils/validationUtils';
import { useI18n } from 'src/composables/useI18n';
import { type QInput } from 'quasar';
import { focusInView } from 'src/utils/focusInView';

export interface AttributionFormInputProps {
  validation: { min: number; max: number; step: number };
}

const props = defineProps<AttributionFormInputProps>();

const modelValue = defineModel<number | null>({ required: true });

const inputRef = ref<QInput | null>(null);

defineExpose({
  validate: () => inputRef.value?.validate(),
  focus: () => inputRef.value && focusInView(inputRef.value),
});

const { t } = useI18n();

const isIntegerOnly = computed(
  () =>
    isInteger(props.validation.min) &&
    isInteger(props.validation.max) &&
    isInteger(props.validation.step),
);

function isInteger(value: number) {
  // we all love JS 😂 (note: no type coersion operator)
  return parseInt(value.toString()) === parseFloat(value.toString());
}

const rules = computed(() => {
  return [
    (value: string | number | null) => {
      if (value === null || value === '') {
        return true;
      }

      const valid = isIntegerOnly.value
        ? isValidInteger({ value, validation: props.validation })
        : isValidFloat({
            value: normalizeDecimalSeparator(value),
            validation: props.validation,
          });

      return (
        valid || t('attributions.add.invalidNumber', { ...props.validation })
      );
    },
  ];
});

function updateModelValue(value: string | number | null) {
  if (value === '' || value === null) {
    modelValue.value = null;
  } else if (isIntegerOnly.value) {
    modelValue.value = parseInt(value.toString());
  } else {
    modelValue.value = parseFloat(normalizeDecimalSeparator(value));
  }
}

function normalizeDecimalSeparator(value: string | number) {
  return value.toString().replace(',', '.');
}

const { inputBgColor } = useInputBackground();
</script>
