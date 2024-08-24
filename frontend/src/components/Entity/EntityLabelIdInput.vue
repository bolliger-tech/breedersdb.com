<template>
  <!-- inputmode="tel": numeric keyboard with # -->
  <q-input
    ref="inputRef"
    v-model="modelValue"
    inputmode="tel"
    outlined
    dense
    type="text"
    :bg-color="inputBgColor"
    :error-message="errorMessage"
    :error="!!errorMessage"
    :hint="t('entity.labelIdOmitZeros')"
    :prefix="entityType === 'plantGroup' ? 'G' : undefined"
    :rules="[
      (value: string | null) =>
        !!value ||
        t('base.validation.xIsRequired', {
          x:
            entityType === 'plant'
              ? t('plants.fields.labelId')
              : t('plantGroups.fields.labelId'),
        }),
      (value: string | null) => {
        return (
          value === null ||
          utils.isValid(utils.zeroFill(value)) ||
          (entityType === 'plant'
            ? t('plants.errors.labelIdinvalid')
            : t('plantGroups.errors.labelIdinvalid'))
        );
      },
    ]"
    clearable
    @keyup.enter="onInputEnd"
    @blur="onInputEnd"
    @focus="onFocus"
  />
</template>

<script setup lang="ts">
import { useInputBackground } from 'src/composables/useInputBackground';
import { useI18n } from 'src/composables/useI18n';
import { ref } from 'vue';
import {
  plantLabelIdUtils,
  plantGroupLabelIdUtils,
} from 'src/utils/labelIdUtils';
import { computed } from 'vue';
import { type QInput } from 'quasar';
import { focusInView } from 'src/utils/focusInView';

export interface EntityLabelIdInputProps {
  entityType: 'plant' | 'plantGroup';
  errorMessage?: string;
}

const props = defineProps<EntityLabelIdInputProps>();

const modelValue = defineModel<string | null>({ required: true });

const utils = computed(() =>
  props.entityType === 'plant' ? plantLabelIdUtils : plantGroupLabelIdUtils,
);

const inputRef = ref<QInput | null>(null);

defineExpose({
  focus: () => inputRef.value && focusInView(inputRef.value),
});

function onInputEnd() {
  let value = modelValue.value;
  if (modelValue.value && utils.value.getSignificantDigits(modelValue.value)) {
    value = utils.value.zeroFill(value);
  }
  if (modelValue.value && props.entityType === 'plantGroup') {
    value = utils.value.removePrefix(value);
  }
  modelValue.value = value;
  inputRef.value?.blur;
}

function onFocus() {
  const significantDigits = utils.value.getSignificantDigits(modelValue.value);
  if (significantDigits) {
    modelValue.value = significantDigits;
  }
}

const { t } = useI18n();
const { inputBgColor } = useInputBackground();
</script>
