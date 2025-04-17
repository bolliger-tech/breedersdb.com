<template>
  <BaseInputLabel :label="label" :explainer="explainer">
    <q-input
      v-bind="$props"
      ref="inputRef"
      :label="undefined"
      :bg-color="inputBgColor"
      dense
      outlined
      :hint="hint ?? (required ? t('base.required') : '')"
      :clearable="!required"
      :model-value="modelValue"
      :min="min"
      :max="max"
      :step="step"
      :pattern="pattern"
      :autocomplete="autocomplete"
      :placeholder="placeholder"
      :input-style="
        autogrow && type === 'textarea' && !inputStyle
          ? 'min-height: 5em'
          : inputStyle
      "
      @update:model-value="updateModelValue"
      @blur="blur"
    >
      <template
        v-for="slot in slotNames.filter((s) => s in $slots)"
        :key="slot"
        #[slot]
      >
        <slot :name="slot"></slot>
      </template>
    </q-input>
    <template v-if="$slots.explainer" #explainer>
      <slot name="explainer"></slot>
    </template>
  </BaseInputLabel>
</template>

<script setup lang="ts">
import { useInputBackground } from 'src/composables/useInputBackground';
import type { QInput, QInputProps, QInputSlots } from 'quasar';
import { nextTick, ref, type Slot } from 'vue';
import { useI18n } from 'src/composables/useI18n';
import BaseInputLabel from 'src/components/Base/BaseInputLabel.vue';
import { focusInView } from 'src/utils/focusInView';

export interface EntityInputProps
  extends Omit<
    QInputProps,
    'bgColor' | 'dense' | 'outlined' | 'modelValue' | 'dark' // if the `dark` prop is not excluded, the colors are wrong in dark mode
  > {
  required?: boolean | undefined;
  min?: number | string | undefined;
  max?: number | string | undefined;
  step?: number | undefined;
  pattern?: string | undefined;
  autocomplete?: string | undefined;
  explainer?: string | undefined;
  placeholder?: string | undefined;
  trim?: boolean | undefined; // workaround for https://github.com/quasarframework/quasar/issues/17663
}

const props = defineProps<EntityInputProps>();

const inputRef = ref<QInput | null>(null);
defineExpose({
  validate: () => inputRef.value?.validate(),
  focus: () => inputRef.value && focusInView(inputRef.value),
});

const modelValue = defineModel<QInputProps['modelValue']>();

export interface EntityInputSlots extends QInputSlots {
  explainer: Slot;
}
const slots = defineSlots<EntityInputSlots>();
const slotNames = Object.keys(slots) as (keyof typeof slots)[];

function updateModelValue(value: QInputProps['modelValue']) {
  if (!props.required && value === '') {
    modelValue.value = null;
  } else {
    modelValue.value = value;
  }
}

async function blur(e: Event) {
  if (props.trim && typeof modelValue.value === 'string') {
    modelValue.value = modelValue.value.trim();
    await nextTick();
  }
  if (props.onBlur) {
    props.onBlur(e);
  }
}

const { inputBgColor } = useInputBackground();
const { t } = useI18n();
</script>
