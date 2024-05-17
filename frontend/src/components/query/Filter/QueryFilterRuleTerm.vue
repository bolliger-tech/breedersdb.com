<template>
  <q-space v-if="hide" class="col-12 col-md-4" />

  <template v-else>
    <q-select
      v-if="isEnum"
      :bg-color="disabled ? 'transparent' : inputBgColor"
      :disable="disabled"
      :error="isInvalid"
      :error-message="t('filter.error.term')"
      :label="t('filter.term')"
      :model-value="modelValue"
      :options="filteredOptions"
      autocomplete="off"
      dense
      hide-bottom-space
      outlined
      use-input
      fill-input
      hide-selected
      clearable
      @filter="filterOptions"
      @update:model-value="(value) => $emit('update:modelValue', value)"
    >
      <template #no-option>
        <q-item>
          <q-item-section class="text-grey">
            {{ t('filter.noResults') }}
          </q-item-section>
        </q-item>
      </template>
    </q-select>

    <q-input
      v-else
      :bg-color="disabled ? 'transparent' : inputBgColor"
      :disable="disabled"
      :error="isInvalid"
      :error-message="t('filter.error.term')"
      :label="t('filter.term')"
      :max="maxValue"
      :maxlength="maxLen"
      :min="minValue"
      :model-value="modelValue"
      :pattern="pattern"
      :stack-label="isDate || isTime || isDateTime"
      :step="step"
      :type="inputType"
      autocomplete="off"
      dense
      hide-bottom-space
      outlined
      clearable
      @update:model-value="
        (value) => $emit('update:modelValue', (value || '').toString().trim())
      "
    />
  </template>
</template>

<script lang="ts" setup>
import { computed, onMounted, ref, watch } from 'vue';
import {
  AttributeSchema,
  AttributeSchemaOptionType,
} from './filterOptionSchemaTypes';
import { useI18n } from 'src/composables/useI18n';
import { useLocalizedSort } from 'src/composables/useLocalizedSort';
import {
  filterSelectOptions,
  FilterSelectOptionsUpdateFn,
} from './selectOptionFilter';
import { useInputBackground } from './useQueryRule';

export interface QueryFilterRuleTermProps {
  schema?: AttributeSchema;
  disabled: boolean;
  hide: boolean;
  modelValue?: string;
}

const { t } = useI18n();

const emit = defineEmits<{
  (e: 'update:modelValue', value: string): void;
  (e: 'valid'): void;
  (e: 'invalid'): void;
}>();

const props = defineProps<QueryFilterRuleTermProps>();

const type = computed<null | AttributeSchemaOptionType>(
  () => props.schema?.options.type || null,
);

const isEnum = computed<boolean>(() => {
  return type.value === AttributeSchemaOptionType.Enum;
});

const isDate = computed<boolean>(() => {
  return type.value === AttributeSchemaOptionType.Date;
});

const isTime = computed<boolean>(() => {
  return type.value === AttributeSchemaOptionType.Time;
});

const isDateTime = computed<boolean>(() => {
  return type.value === AttributeSchemaOptionType.Datetime;
});

const validationOptions = computed(() => {
  const options = props.schema?.options;
  if (options && 'validation' in options) {
    return options.validation;
  }
  return undefined;
});

const step = computed<number | undefined>(() => {
  return validationOptions.value && 'step' in validationOptions.value
    ? validationOptions.value.step
    : undefined;
});

const minValue = computed<number | undefined>(() => {
  return validationOptions.value && 'min' in validationOptions.value
    ? validationOptions.value.min
    : undefined;
});

const maxValue = computed<number | undefined>(() => {
  return validationOptions.value && 'max' in validationOptions.value
    ? validationOptions.value.max
    : undefined;
});

const maxLen = computed<number | undefined>(() => {
  return validationOptions.value && 'maxLen' in validationOptions.value
    ? validationOptions.value.maxLen ?? undefined
    : undefined;
});

const pattern = computed<string | null | undefined>(() => {
  return validationOptions.value && 'pattern' in validationOptions.value
    ? validationOptions.value.pattern
    : undefined;
});

const { localizedSort } = useLocalizedSort();
const options = computed<string[]>(() => {
  return validationOptions.value && 'options' in validationOptions.value
    ? localizedSort(validationOptions.value.options)
    : [];
});

const filteredOptions = ref(options.value);

const inputType = computed(() => {
  switch (type.value) {
    case AttributeSchemaOptionType.Date:
      return 'date';
    case AttributeSchemaOptionType.Time:
      return 'time';
    case AttributeSchemaOptionType.Datetime:
      return 'datetime-local';
    case AttributeSchemaOptionType.Integer:
    case AttributeSchemaOptionType.Float:
      return 'number';
    default:
      return 'text';
  }
});

const isValidInteger = computed<boolean>(() => {
  if (
    props.modelValue === undefined ||
    type.value !== AttributeSchemaOptionType.Integer
  ) {
    return false;
  }

  const value = Number.parseFloat(props.modelValue);

  if (step.value !== undefined && value % step.value !== 0.0) {
    return false;
  }

  if (minValue.value !== undefined && value < minValue.value) {
    return false;
  }

  return !(maxValue.value !== undefined && value > maxValue.value);
});

const isValidFloat = computed<boolean>(() => {
  if (
    props.modelValue === undefined ||
    type.value !== AttributeSchemaOptionType.Float
  ) {
    return false;
  }

  const value = Number.parseFloat(props.modelValue);

  if (step.value !== undefined && value % step.value !== 0.0) {
    return false;
  }

  if (minValue.value !== undefined && value < minValue.value) {
    return false;
  }

  return !(maxValue.value !== undefined && value > maxValue.value);
});

const isValidDate = computed<boolean>(() => {
  if (
    props.modelValue === undefined ||
    type.value !== AttributeSchemaOptionType.Date
  ) {
    return false;
  }

  return !isNaN(Date.parse(props.modelValue));
});

const isValidDateTime = computed<boolean>(() => {
  if (
    props.modelValue === undefined ||
    type.value !== AttributeSchemaOptionType.Datetime
  ) {
    return false;
  }

  return !isNaN(Date.parse(props.modelValue));
});

const isValidTime = computed<boolean>(() => {
  if (
    props.modelValue === undefined ||
    props.modelValue === '' ||
    type.value !== AttributeSchemaOptionType.Time
  ) {
    return false;
  }

  return !isNaN(Date.parse(`1970-01-01T${props.modelValue}`));
});

const isValidString = computed<boolean>(() => {
  if (
    props.modelValue === undefined ||
    type.value !== AttributeSchemaOptionType.String
  ) {
    return false;
  }

  if (maxLen.value !== undefined && props.modelValue.length > maxLen.value) {
    return false;
  }

  return !(
    pattern.value !== undefined &&
    props.modelValue.match(`/${pattern.value}/`) === null
  );
});

const isValidEnum = computed<boolean>(() => {
  if (
    props.modelValue === undefined ||
    type.value !== AttributeSchemaOptionType.Enum
  ) {
    return false;
  }

  return options.value.indexOf(props.modelValue) > -1;
});

const isValidPhoto = computed<boolean>(() => {
  return !(
    props.modelValue === undefined ||
    type.value !== AttributeSchemaOptionType.Photo
  );
});

const isValidBoolean = computed<boolean>(() => {
  return !(
    props.modelValue === undefined ||
    type.value !== AttributeSchemaOptionType.Boolean
  );
});

const isValid = computed<boolean>(() => {
  return (
    isValidInteger.value ||
    isValidFloat.value ||
    isValidDate.value ||
    isValidDateTime.value ||
    isValidTime.value ||
    isValidString.value ||
    isValidEnum.value ||
    isValidPhoto.value ||
    isValidBoolean.value
  );
});

const isInvalid = computed<boolean>(() => {
  return !isValid.value && props.modelValue !== undefined;
});

function filterOptions(value: string, update: FilterSelectOptionsUpdateFn) {
  filterSelectOptions<string>(
    value,
    update,
    options.value,
    filteredOptions,
    (item) => item,
  );
}

function emitValidity() {
  if (isValid.value) {
    emit('valid');
  }
  if (isInvalid.value) {
    emit('invalid');
  }
}

watch(isValid, emitValidity);
watch(isInvalid, emitValidity);
onMounted(emitValidity);

const inputBgColor = useInputBackground();
</script>
./filterOptionSchemaTypes
