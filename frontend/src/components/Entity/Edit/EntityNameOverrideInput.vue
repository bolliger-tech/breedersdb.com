<template>
  <EntityInput
    ref="inputRef"
    :model-value="modelValue"
    :label="t('entity.commonColumns.explicitDisplayName')"
    :rules="rules"
    type="text"
    autocomplete="off"
    debounce="300"
    :loading="loading"
    :hint="hint"
    :placeholder="fullName"
    @update:model-value="updateModelValue"
  />
</template>

<script setup lang="ts">
import EntityInput, { EntityInputProps } from './EntityInput.vue';
import { useI18n } from 'src/composables/useI18n';
import { ref } from 'vue';
import { focusInView } from 'src/utils/focusInView';
import { InputRef } from 'src/composables/useEntityForm';

export interface LotNameInputProps {
  fullName: string | undefined;
  rules?: EntityInputProps['rules'];
  loading?: boolean;
  hint?: string;
}

defineProps<LotNameInputProps>();
const modelValue = defineModel<string | null>({ required: true });

const inputRef = ref<InputRef | null>(null);
defineExpose({
  validate: () => inputRef.value?.validate(),
  focus: () => inputRef.value && focusInView(inputRef.value),
});

const { t } = useI18n();

function updateModelValue(
  value: InstanceType<typeof EntityInput>['modelValue'],
) {
  const clean = value?.toString().trim();
  modelValue.value = !clean ? null : clean;
}
</script>
