<template>
  <q-input
    ref="inputRef"
    v-model.trim="modelValue"
    :bg-color="inputBgColor"
    dense
    outlined
    type="text"
    autocomplete="off"
    :placeholder="t('attribute.textPlaceholder')"
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
    ]"
  />
</template>
<script setup lang="ts">
import { useInputBackground } from 'src/composables/useInputBackground';
import { isValidString } from 'src/utils/validationUtils';
import { useI18n } from 'src/composables/useI18n';
import { ref } from 'vue';
import { type QInput } from 'quasar';

export interface AttributeFormInputProps {
  validation: { maxLen: number | null; pattern: string | null };
}

defineProps<AttributeFormInputProps>();
const modelValue = defineModel<string | null>({ required: true });

const inputRef = ref<QInput | null>(null);

const { t } = useI18n();
const { inputBgColor } = useInputBackground();
</script>
