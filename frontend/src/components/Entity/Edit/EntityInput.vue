<template>
  <q-input
    v-bind="$props"
    ref="inputRef"
    :bg-color="inputBgColor"
    dense
    outlined
    :hint="hint ?? (required ? t('base.required') : '')"
    :clearable="clearable ?? !required"
    :dark="$q.dark.isActive"
  />
</template>

<script setup lang="ts">
import { useInputBackground } from 'src/composables/useInputBackground';
import type { QInput, QInputProps } from 'quasar';
import { ComponentPublicInstance, ref } from 'vue';
import { useI18n } from 'src/composables/useI18n';

export type EntityInputInstance = ComponentPublicInstance<EntityInputProps> & {
  validate: () => ReturnType<QInput['validate']> | undefined;
};

export type EntityInputProps = Omit<
  QInputProps,
  'bgColor' | 'dense' | 'outlined'
> & {
  required?: boolean;
};

defineProps<EntityInputProps>();

const inputRef = ref<QInput | null>(null);
defineExpose({
  validate: () => inputRef.value?.validate(),
});

const { inputBgColor } = useInputBackground();
const { t } = useI18n();
</script>
