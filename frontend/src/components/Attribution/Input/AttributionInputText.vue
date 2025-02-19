<template>
  <q-input
    ref="inputRef"
    v-model.trim="modelValue"
    :bg-color="inputBgColor"
    dense
    outlined
    type="text"
    autocomplete="off"
    :placeholder="t('attributions.add.textPlaceholder')"
    clearable
    :hide-bottom-space="!inputRef?.hasError"
    autogrow
    :maxlength="validation.maxLen ?? undefined"
    :pattern="validation.pattern ?? undefined"
    :rules="[
      (value: string | null) =>
        value === null ||
        isValidString({ value, validation }) ||
        t('base.validation.maxLen', { x: validation.maxLen }),
      ...(props.additionalRules ?? []),
    ]"
    @blur="modelValue === '' && (modelValue = null)"
  />
</template>
<script setup lang="ts">
import { useInputBackground } from 'src/composables/useInputBackground';
import { isValidString } from 'src/utils/validationUtils';
import { useI18n } from 'src/composables/useI18n';
import { ref, watch } from 'vue';
import { type QInput } from 'quasar';
import { focusInView } from 'src/utils/focusInView';

export interface AttributionInputProps {
  validation: { maxLen: number | null; pattern: string | null };
  additionalRules?: QInput['rules'];
}

const props = defineProps<AttributionInputProps>();
const modelValue = defineModel<string | null>({ required: true });

const inputRef = ref<QInput | null>(null);

defineExpose({
  validate: () => inputRef.value?.validate(),
  focus: () => inputRef.value && focusInView(inputRef.value),
});

watch(
  () => props.validation,
  () => inputRef.value?.validate(),
  { deep: true },
);

const { t } = useI18n();
const { inputBgColor } = useInputBackground();
</script>
