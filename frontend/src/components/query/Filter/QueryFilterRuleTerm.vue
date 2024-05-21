<template>
  <q-space v-if="hide" class="col-12 col-md-4" />

  <template v-else>
    <q-select
      v-if="isEnum"
      :bg-color="disabled ? 'transparent' : inputBgColor"
      :disable="disabled"
      :error="modelValue?.isValid === false"
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
      :error="modelValue?.isValid === false"
      :error-message="t('filter.error.term')"
      :label="t('filter.term')"
      :max="maxValue"
      :maxlength="maxLen"
      :min="minValue"
      :model-value="modelValue?.value"
      :pattern="pattern"
      :stack-label="isDate || isTime || isDateTime"
      :step="step"
      :type="inputType"
      autocomplete="off"
      dense
      hide-bottom-space
      outlined
      clearable
      @update:model-value="updateTerm"
    />
  </template>
</template>

<script lang="ts" setup>
import { computed, ref } from 'vue';
import { useI18n } from 'src/composables/useI18n';
import { useLocalizedSort } from 'src/composables/useLocalizedSort';
import {
  filterSelectOptions,
  FilterSelectOptionsUpdateFn,
} from './selectOptionFilter';
import { useInputBackground } from './useQueryRule';
import { FilterRuleSchema, FilterRuleType } from './filterRuleTypes';
import { FilterTerm } from './filterTerm';

export interface QueryFilterRuleTermProps {
  schema?: FilterRuleSchema;
  disabled: boolean;
  hide: boolean;
  modelValue?: FilterTerm;
}

const { t } = useI18n();

const emit = defineEmits<{
  (e: 'update:modelValue', value: FilterTerm): void;
}>();

const props = defineProps<QueryFilterRuleTermProps>();

function updateTerm(value: string | number | null) {
  const term =
    props.modelValue ?? new FilterTerm({ value: '', schema: props.schema });
  term.value = (value || '').toString().trim();
  emit('update:modelValue', term);
}

const type = computed<null | FilterRuleType>(() => props.schema?.type || null);

const isEnum = computed<boolean>(() => {
  return type.value === FilterRuleType.Enum;
});

const isDate = computed<boolean>(() => {
  return type.value === FilterRuleType.Date;
});

const isTime = computed<boolean>(() => {
  return type.value === FilterRuleType.Time;
});

const isDateTime = computed<boolean>(() => {
  return type.value === FilterRuleType.Datetime;
});

const validationOptions = computed(() => {
  if (props.schema && 'validation' in props.schema) {
    return props.schema.validation;
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
    case FilterRuleType.Date:
      return 'date';
    case FilterRuleType.Time:
      return 'time';
    case FilterRuleType.Datetime:
      return 'datetime-local';
    case FilterRuleType.Integer:
    case FilterRuleType.Float:
      return 'number';
    default:
      return 'text';
  }
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

const inputBgColor = useInputBackground();
</script>
