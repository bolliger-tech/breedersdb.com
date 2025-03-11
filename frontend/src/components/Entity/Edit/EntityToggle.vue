<template>
  <BaseInputLabel :label="label" :explainer="explainer">
    <template v-if="$slots.explainer" #explainer>
      <slot name="explainer"></slot>
    </template>
    <q-toggle
      ref="toggleRef"
      v-bind="$props"
      v-model="modelValue"
      checked-icon="check"
      unchecked-icon="clear"
      :label="_stateLabel"
      :toggle-indeterminate="!required"
    />
  </BaseInputLabel>
</template>

<script setup lang="ts">
import { type Slot, type ComponentPublicInstance, ref, computed } from 'vue';
import type { QToggle, QToggleProps } from 'quasar';
import { useI18n } from 'src/composables/useI18n';
import BaseInputLabel from 'src/components/Base/BaseInputLabel.vue';
import { focusInView } from 'src/utils/focusInView';

export type EntityToggleInstance =
  ComponentPublicInstance<EntityToggleProps> & {
    validate: () => boolean;
    focus: () => void;
  };

export type EntityToggleProps = Omit<
  QToggleProps,
  'modelValue' | 'checkedIcon' | 'uncheckedIcon' | 'toggle-indeterminate'
> & {
  explainer?: string;
  required?: boolean;
  stateLabel?: string;
};

const props = defineProps<EntityToggleProps>();

const toggleRef = ref<QToggle | null>(null);
defineExpose({
  validate: () => !props.required || modelValue.value !== null,
  focus: () => {
    if (toggleRef.value) focusInView(toggleRef.value.$el);
  },
});

const modelValue = defineModel<boolean | null>({ required: true });

defineSlots<{ explainer: Slot }>();

const _stateLabel = computed(() => {
  if (props.stateLabel) {
    return props.stateLabel;
  }
  if (modelValue.value === null) {
    return '';
  }
  return modelValue.value ? t('base.yes') : t('base.no');
});

const { t } = useI18n();
</script>
