<template>
  <EntityInput
    v-if="['INTEGER', 'FLOAT', 'RATING', 'TEXT'].includes(props.dataType)"
    :ref="(el: InputRef) => (inputRef = el)"
    v-model="numberOrStringModelValue"
    :label="t('attributes.columns.defaultValue')"
    :rules="rules"
    :type="inputType"
    :autogrow="props.dataType === 'TEXT'"
    autocomplete="off"
    :trim="props.dataType === 'TEXT'"
  />
  <BaseInputLabel
    v-else-if="['DATE'].includes(props.dataType)"
    :label="t('attributes.columns.defaultValue')"
  >
    <q-date
      v-model="dateModelValue"
      first-day-of-week="1"
      mask="YYYY-MM-DD"
      minimal
    />
  </BaseInputLabel>
  <EntityToggle
    v-else-if="['BOOLEAN'].includes(props.dataType)"
    v-model="booleanModelValue"
    :label="t('attributes.columns.defaultValue')"
    :state-label="
      booleanModelValue === null
        ? t('attributes.noDefaultValue')
        : modelValue
          ? t('base.yes')
          : t('base.no')
    "
  />
</template>

<script setup lang="ts">
import { useI18n } from 'src/composables/useI18n';
import { type AttributeDataTypes } from 'src/graphql';
import { AttributeFragment } from 'src/components/Attribute/attributeFragment';
import EntityInput from 'src/components/Entity/Edit/EntityInput.vue';
import EntityToggle from 'src/components/Entity/Edit/EntityToggle.vue';
import BaseInputLabel from 'src/components/Base/BaseInputLabel.vue';
import { computed } from 'vue';
import { InputRef } from 'src/composables/useEntityForm';
import { isValidFloat, isValidInteger } from 'src/utils/validationUtils';

export interface AttributeLegendInputProps {
  dataType: AttributeDataTypes;
  validationRule: AttributeFragment['validation_rule'];
}

const props = defineProps<AttributeLegendInputProps>();

const modelValue = defineModel<AttributeFragment['default_value']>({
  required: true,
});
const inputRef = defineModel<InputRef | null>('inputRef', {
  required: true,
});

const inputType = computed(() => {
  switch (props.dataType) {
    case 'INTEGER':
    case 'FLOAT':
    case 'RATING':
      return 'number';
    case 'TEXT':
      return 'text';
    default:
      throw new Error(
        `Default value not implemented for data type: ${props.dataType}`,
      );
  }
});

const numberOrStringModelValue = computed({
  get: () => {
    return ['INTEGER', 'FLOAT', 'RATING', 'TEXT'].includes(props.dataType)
      ? (modelValue.value as string | number | null)
      : null;
  },
  set: (val: string | number | null) => {
    if ('TEXT' === props.dataType) {
      modelValue.value = val ? val.toString() : null;
    } else if (['INTEGER', 'FLOAT', 'RATING'].includes(props.dataType)) {
      modelValue.value = val || val === 0 ? parseFloat(val.toString()) : null;
    }
  },
});

const dateModelValue = computed({
  get: () => {
    return props.dataType === 'DATE'
      ? (modelValue.value as string | null)
      : null;
  },
  set: (val: string | null) => {
    modelValue.value = val ? val : null;
  },
});

const booleanModelValue = computed({
  get: () => {
    return props.dataType === 'BOOLEAN'
      ? (modelValue.value as boolean | null)
      : null;
  },
  set: (val: boolean | null) => {
    modelValue.value = val;
  },
});

const rules = computed(() => {
  const r = [];
  if ('FLOAT' === props.dataType) {
    r.push(
      (val: string | null) =>
        val === '' ||
        val === null ||
        !props.validationRule ||
        isValidFloat({ value: val, validation: props.validationRule }) ||
        t('attributions.add.invalidNumber', { ...props.validationRule }),
    );
  }
  if (['INTEGER', 'RATING'].includes(props.dataType)) {
    r.push(
      (val: string | null) =>
        val === '' ||
        val === null ||
        !props.validationRule ||
        isValidInteger({ value: val, validation: props.validationRule }) ||
        t('attributions.add.invalidNumber', { ...props.validationRule }),
    );
  }
  return r;
});

const { t } = useI18n();
</script>
