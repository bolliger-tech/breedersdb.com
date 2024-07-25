<template>
  <BaseInputLabel :label="label">
    <q-input
      v-bind="$props"
      ref="inputRef"
      :label="undefined"
      :bg-color="inputBgColor"
      dense
      outlined
      :hint="hint ?? (required ? t('base.required') : '')"
      :clearable="!required"
      :dark="$q.dark.isActive"
      :model-value="modelValue"
      :min="min"
      :max="max"
      :step="step"
      :pattern="pattern"
      @update:model-value="updateModelValue"
    >
      <template v-if="$slots.error" #error>
        <slot name="error"></slot>
      </template>
    </q-input>
  </BaseInputLabel>
</template>

<script setup lang="ts">
import { useInputBackground } from 'src/composables/useInputBackground';
import type { QInput, QInputProps } from 'quasar';
import { ComponentPublicInstance, ref, type Slot } from 'vue';
import { useI18n } from 'src/composables/useI18n';
import BaseInputLabel from 'src/components/Base/BaseInputLabel.vue';
import { focusInView } from 'src/utils/focusInView';

export type EntityInputInstance = ComponentPublicInstance<EntityInputProps> & {
  validate: () => ReturnType<QInput['validate']> | undefined;
  focus: () => ReturnType<QInput['focus']> | undefined;
};

export type EntityInputProps = Omit<
  QInputProps,
  'bgColor' | 'dense' | 'outlined' | 'modelValue'
> & {
  required?: boolean;
  min?: number;
  max?: number;
  step?: number;
  pattern?: string;
};

const props = defineProps<EntityInputProps>();

const inputRef = ref<QInput | null>(null);
defineExpose({
  validate: () => inputRef.value?.validate(),
  focus: () => inputRef.value && focusInView(inputRef.value),
});

const modelValue = defineModel<QInputProps['modelValue']>();

defineSlots<{ error: Slot }>();

function updateModelValue(value: QInputProps['modelValue']) {
  if (!props.required && value === '') {
    modelValue.value = null;
  } else {
    modelValue.value = value;
  }
}

const { inputBgColor } = useInputBackground();
const { t } = useI18n();
</script>
