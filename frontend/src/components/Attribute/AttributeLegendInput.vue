<template>
  <template v-if="dataType === 'RATING'">
    <EntityInput
      v-for="step in steps"
      :key="step"
      :model-value="modelValue ? modelValue[step - 1] : ''"
      :label="
        t('attributes.columns.legend') +
        ` ${step + (props.validationRule?.min || 0) - 1}`
      "
      type="text"
      autocomplete="off"
      @update:model-value="
        (val) => setValue(step - 1, val ? val.toString() : '')
      "
    />
  </template>
</template>

<script setup lang="ts">
import { useI18n } from 'src/composables/useI18n';
import { type AttributeDataTypes } from 'src/graphql';
import { AttributeFragment } from 'src/components/Attribute/attributeFragment';
import EntityInput from '../Entity/Edit/EntityInput.vue';
import { computed, onMounted, watch } from 'vue';

export interface AttributeLegendInputProps {
  dataType: AttributeDataTypes;
  validationRule: AttributeFragment['validation_rule'];
  initialData: AttributeFragment['legend'];
}

const props = defineProps<AttributeLegendInputProps>();

const modelValue = defineModel<AttributeFragment['legend']>({
  required: true,
});

const steps = computed(
  () => (props.validationRule?.max || 0) - (props.validationRule?.min || 0) + 1,
);

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
          props.initialData?.[modelValue.value.length] || '',
        );
      }
      while (modelValue.value.length > steps.value) {
        modelValue.value.pop();
      }
    }

    // if the min was changed, we must adjust on the start
    if (newValidationRule?.min !== oldValidationRule?.min) {
      while (modelValue.value.length < steps.value) {
        // we don't remember the old values here, as it is a very rare use case
        // and tedious to implement
        modelValue.value.unshift('');
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
  const newVal = value.trim();

  data[step] = newVal;

  modelValue.value = data.some((v) => v) ? data : null;
}

onMounted(() => {
  // set labels to null if all labels are empty (so numbers are displayed)
  modelValue.value = modelValue.value?.some((v) => v) ? modelValue.value : null;
});

const { t } = useI18n();
</script>
