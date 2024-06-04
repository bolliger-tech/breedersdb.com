<template>
  <q-space v-if="hide" class="col-12 col-md-4" />

  <template v-else>
    <q-select
      v-if="isEnum && !forceStringInputForEnum"
      ref="enumSelect"
      :bg-color="disabled ? 'transparent' : inputBgColor"
      :disable="disabled"
      :error="modelValue?.isValid === false && enumUpdated"
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
      option-label="value"
      @filter="filterOptions"
      @update:model-value="
        (value) => {
          updateTerm(value);
          enumUpdated = true;
        }
      "
      @clear="enumSelect?.updateInputValue('', true)"
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
} from 'src/utils/selectOptionFilter';
import { useInputBackground } from 'src/composables/useInputBackground';
import { ColumnType } from 'src/components/Query/ColumnDefinitions/columnTypes';

import { FilterRuleTerm } from './filterRuleTerm';
import { QSelect } from 'quasar';
import { FilterOperatorValue } from './filterRuleOperator';

export interface QueryFilterRuleTermProps {
  disabled: boolean;
  hide: boolean;
  modelValue?: FilterRuleTerm;
  operatorValue?: FilterOperatorValue;
}

const { t } = useI18n();

const emit = defineEmits<{
  'update:modelValue': [value: FilterRuleTerm];
}>();

const props = defineProps<QueryFilterRuleTermProps>();

const enumUpdated = ref(false);

function updateTerm(value: string | number | null) {
  const term = props.modelValue ?? new FilterRuleTerm({ value: '' });
  term.value = (value || '').toString().trim();
  emit('update:modelValue', term);
}

const type = computed<null | ColumnType>(() => props.modelValue?.type || null);

const isEnum = computed<boolean>(() => type.value === ColumnType.Enum);
const isDate = computed<boolean>(() => type.value === ColumnType.Date);
const isTime = computed<boolean>(() => type.value === ColumnType.Time);
const isDateTime = computed<boolean>(() => type.value === ColumnType.DateTime);

const validationOptions = computed(() => {
  return props.modelValue?.validation;
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
const options = computed(() => {
  return validationOptions.value && 'options' in validationOptions.value
    ? localizedSort(validationOptions.value.options)
    : [];
});

const forceStringInputForEnum = computed(() => {
  return !!(
    props.operatorValue &&
    [
      FilterOperatorValue.StartsWith,
      FilterOperatorValue.StartsNotWith,
      FilterOperatorValue.Contains,
      FilterOperatorValue.NotContains,
      FilterOperatorValue.EndsWith,
      FilterOperatorValue.NotEndsWith,
    ].includes(props.operatorValue)
  );
});

const filteredOptions = ref(options.value);

const inputType = computed(() => {
  switch (type.value) {
    case ColumnType.Integer:
    case ColumnType.Float:
      return 'number';
    case ColumnType.Boolean:
    case ColumnType.Photo:
      throw new Error('Boolean type is not supported');
    case ColumnType.Date:
      return 'date';
    case ColumnType.DateTime:
      return 'datetime-local';
    case ColumnType.Time:
      return 'time';
    case ColumnType.String:
    case ColumnType.Enum:
    case null:
      return 'text';
    default:
      throw new Error(`Unknown type: ${type.value}`);
  }
});

function filterOptions(value: string, update: FilterSelectOptionsUpdateFn) {
  filterSelectOptions({
    value,
    update,
    allOptions: options.value,
    filteredOptions,
    valueExtractorFn: (item) => item,
  });
}

const enumSelect = ref<QSelect | undefined>();

const { inputBgColor } = useInputBackground();
</script>
