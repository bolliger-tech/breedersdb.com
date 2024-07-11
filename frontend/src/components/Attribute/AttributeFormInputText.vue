<template>
  <q-input
    v-model.trim="modelValue"
    :bg-color="inputBgColor"
    dense
    outlined
    type="text"
    autocomplete="off"
    clearable
    autogrow
    :maxlength="validation.maxLen ?? undefined"
    :pattern="validation.pattern ?? undefined"
    :rules="[
      (value: string | null) =>
        value === null ||
        isValidString({ value, validation }) ||
        t('base.validation.maxLen', { x: 45 }),
    ]"
  />
</template>
<script setup lang="ts">
import { useInputBackground } from 'src/composables/useInputBackground';
import { isValidString } from 'src/utils/validationUtils';
import { useI18n } from 'src/composables/useI18n';

export interface AttributeFormInputProps {
  validation: { maxLen: number | null; pattern: string | null };
}

defineProps<AttributeFormInputProps>();
const modelValue = defineModel<string | null>({ required: true });

const { t } = useI18n();
const { inputBgColor } = useInputBackground();
</script>
