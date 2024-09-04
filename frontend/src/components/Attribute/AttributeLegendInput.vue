<template>
  <template v-if="dataType === 'RATING'">
    <EntityInput
      v-for="step in steps"
      :ref="(el: InputRef) => (refs[step] = el)"
      :key="step"
      :model-value="modelValue ? modelValue[step - 1] : ''"
      :label="t('attributes.columns.legend') + ` ${step + (min || 0) - 1}`"
      :rules="[
        (v) => !v || v.length <= 80 || t('base.validation.maxLen', { x: 80 }),
      ]"
      type="text"
      autocomplete="off"
      @update:model-value="
        (val) => setValue(step - 1, val ? val.toString() : '')
      "
      @blur="modelValue = modelValue?.map((v) => v.trim()) || null"
    />
  </template>
</template>

<script setup lang="ts">
import { useI18n } from 'src/composables/useI18n';
import { type AttributeDataTypes } from 'src/graphql';
import { AttributeFragment } from 'src/components/Attribute/attributeFragment';
import EntityInput from '../Entity/Edit/EntityInput.vue';
import { computed, onMounted, watch, ref } from 'vue';
import { InputRef } from 'src/composables/useEntityForm';

export interface AttributeLegendInputProps {
  dataType: AttributeDataTypes;
  validationRule: AttributeFragment['validation_rule'];
  initialData: AttributeFragment['legend'];
}

const props = defineProps<AttributeLegendInputProps>();

const modelValue = defineModel<AttributeFragment['legend']>({
  required: true,
});

const refs = ref<{ [key: number]: InputRef | null }>({});
defineExpose({
  validate: async () => (await validate()).every((input) => input.valid),
  focus: () => focusFirstInvalidOrFirst(),
});

async function validate() {
  return await Promise.all(
    Object.values(refs.value).map(async (ref) => ({
      ref,
      valid: (await ref?.validate?.()) ?? true,
    })),
  );
}

async function focusFirstInvalidOrFirst() {
  const validated = await validate();
  const firstInvalid = validated.find((input) => !input.valid);
  if (firstInvalid) {
    firstInvalid.ref?.focus?.();
  } else {
    refs.value[0]?.focus?.();
  }
}

// limit min & max, so the form doesn't explode in case of invalid validation rules
const min = computed(() => Math.max(props.validationRule?.min || 0, 0));
const max = computed(() => Math.min(props.validationRule?.max || 0, 9));
const steps = computed(() => max.value - min.value + 1);

const backup = ref(
  Object.fromEntries(
    (props.initialData || []).map((v, idx) => [min.value + idx, v]),
  ),
);
watch(modelValue, (newValues) => {
  if (!newValues) return;
  newValues.forEach((v, idx) => (backup.value[min.value + idx] = v));
});

watch(
  [() => props.validationRule, () => props.dataType],
  async ([newValidationRule], [oldValidationRule]) => {
    if (props.dataType !== 'RATING') {
      modelValue.value = null;
      return;
    }

    if (!modelValue.value) {
      return;
    }

    // if the max was changed, we must adjust on the end
    if (newValidationRule?.max !== oldValidationRule?.max) {
      while (modelValue.value.length < steps.value) {
        modelValue.value.push(
          backup.value[min.value + modelValue.value.length] || '',
        );
      }
      while (modelValue.value.length > steps.value) {
        modelValue.value.pop();
      }
    }

    // if the min was changed, we must adjust on the start
    if (newValidationRule?.min !== oldValidationRule?.min) {
      while (modelValue.value.length < steps.value) {
        modelValue.value.unshift(backup.value[min.value] || '');
      }
      while (modelValue.value.length > steps.value) {
        modelValue.value.shift();
      }
    }
  },
  { immediate: true, deep: true },
);

function setValue(step: number, value: string) {
  const data = modelValue.value
    ? [...modelValue.value]
    : Array(steps.value).fill('');

  data[step] = value;

  modelValue.value = data.some((v) => v) ? data : null;
}

onMounted(() => {
  // set labels to null if all labels are empty (so numbers are displayed)
  modelValue.value = modelValue.value?.some((v) => v) ? modelValue.value : null;
});

const { t } = useI18n();
</script>
