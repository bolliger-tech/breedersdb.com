<template>
  <q-space v-if="hide" class="col-12 col-md-4" />

  <template v-else>
    <q-select
      v-if="isEnum"
      :bg-color="disabled ? 'transparent' : inputBgColor"
      :disable="disabled"
      :error="isInvalid"
      :error-message="t('filter.error.criterion')"
      :label="t('filter.criteria')"
      :model-value="modelValue"
      :options="filteredSelectOptions"
      autocomplete="off"
      dense
      hide-bottom-space
      outlined
      use-input
      fill-input
      hide-selected
      clearable
      @filter="filterSelectOptions"
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
      :error-message="t('filter.error.criterion')"
      :label="t('filter.criteria')"
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
  PropertySchema,
  PropertySchemaOptions,
  PropertySchemaOptionType,
} from './filterOptionSchema';
import { useI18n } from 'src/composables/useI18n';
import { useLocalizedSort } from 'src/composables/useLocalizedSort';
import { filterOptions, FilterUpdateFn } from './filterRuleSelectOptionFilter';
import { useInputBackground } from './useQueryRule';

export interface QueryFilterRuleTermProps {
  schema?: PropertySchema;
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

const type = computed<null | PropertySchemaOptionType>(
  () => props.schema?.options.type || null,
);

const isEnum = computed<boolean>(() => {
  return type.value === PropertySchemaOptionType.Enum;
});

const isDate = computed<boolean>(() => {
  return type.value === PropertySchemaOptionType.Date;
});

const isTime = computed<boolean>(() => {
  return type.value === PropertySchemaOptionType.Time;
});

const isDateTime = computed<boolean>(() => {
  return type.value === PropertySchemaOptionType.Datetime;
});

const step = computed<number | undefined>(() => {
  const options: PropertySchemaOptions | undefined =
    props.schema?.options || undefined;
  if (options && 'validation' in options && 'step' in options.validation) {
    return options.validation.step;
  }
  return undefined;
});

const minValue = computed<number | undefined>(() => {
  const options: PropertySchemaOptions | undefined =
    props.schema?.options || undefined;
  if (options && 'validation' in options && 'min' in options.validation) {
    return options.validation.min;
  }
  return undefined;
});

const maxValue = computed<number | undefined>(() => {
  const options: PropertySchemaOptions | undefined =
    props.schema?.options || undefined;
  if (options && 'validation' in options && 'max' in options.validation) {
    return options.validation.max;
  }
  return undefined;
});

const maxLen = computed<number | undefined>(() => {
  const options: PropertySchemaOptions | undefined =
    props.schema?.options || undefined;
  if (options && 'validation' in options && 'maxLen' in options.validation) {
    return options.validation.maxLen || undefined;
  }
  return undefined;
});

const pattern = computed<string | undefined>(() => {
  const options: PropertySchemaOptions | undefined =
    props.schema?.options || undefined;
  if (options && 'validation' in options && 'pattern' in options.validation) {
    return options.validation.pattern || undefined;
  }
  return undefined;
});

const { localizedSort } = useLocalizedSort();
const selectOptions = computed<string[]>(() => {
  const options: PropertySchemaOptions | null = props.schema?.options || null;
  if (options && 'validation' in options && 'options' in options.validation) {
    const selectOptions = options.validation.options;
    return localizedSort(selectOptions);
  }
  return [];
});

const filteredSelectOptions = ref(selectOptions.value);

const inputType = computed(() => {
  switch (type.value) {
    case PropertySchemaOptionType.Date:
      return 'date';
    case PropertySchemaOptionType.Time:
      return 'time';
    case PropertySchemaOptionType.Datetime:
      return 'datetime-local';
    case PropertySchemaOptionType.Integer:
    case PropertySchemaOptionType.Float:
      return 'number';
    default:
      return 'text';
  }
});

const isValidInteger = computed<boolean>(() => {
  if (
    props.modelValue === undefined ||
    type.value !== PropertySchemaOptionType.Integer
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
    type.value !== PropertySchemaOptionType.Float
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
    type.value !== PropertySchemaOptionType.Date
  ) {
    return false;
  }

  return !isNaN(Date.parse(props.modelValue));
});

const isValidDateTime = computed<boolean>(() => {
  if (
    props.modelValue === undefined ||
    type.value !== PropertySchemaOptionType.Datetime
  ) {
    return false;
  }

  return !isNaN(Date.parse(props.modelValue));
});

const isValidTime = computed<boolean>(() => {
  if (
    props.modelValue === undefined ||
    props.modelValue === '' ||
    type.value !== PropertySchemaOptionType.Time
  ) {
    return false;
  }

  return !isNaN(Date.parse(`1970-01-01T${props.modelValue}`));
});

const isValidString = computed<boolean>(() => {
  if (
    props.modelValue === undefined ||
    type.value !== PropertySchemaOptionType.String
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
    type.value !== PropertySchemaOptionType.Enum
  ) {
    return false;
  }

  return selectOptions.value.indexOf(props.modelValue) > -1;
});

const isValidPhoto = computed<boolean>(() => {
  return !(
    props.modelValue === undefined ||
    type.value !== PropertySchemaOptionType.Photo
  );
});

const isValidBoolean = computed<boolean>(() => {
  return !(
    props.modelValue === undefined ||
    type.value !== PropertySchemaOptionType.Boolean
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

function filterSelectOptions(value: string, update: FilterUpdateFn) {
  filterOptions<string>(
    value,
    update,
    selectOptions.value,
    filteredSelectOptions,
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
