<template>
  <q-space v-if="hide" class="col-12 col-md-4" />

  <template v-else>
    <q-select
      v-if="isEnum && !forceStringInputForEnum"
      ref="enumSelect"
      :bg-color="disabled ? 'transparent' : inputBgColor"
      :disable="disabled"
      :error="modelValue?.isValid === false && enumUpdated"
      :error-message="t('analyze.filter.error.term')"
      :label="t('analyze.filter.term')"
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
            {{ t('base.noResults') }}
          </q-item-section>
        </q-item>
      </template>
    </q-select>

    <q-input
      v-else
      :bg-color="disabled ? 'transparent' : inputBgColor"
      :disable="disabled"
      :error="modelValue?.isValid === false && inputUpdated"
      :error-message="t('analyze.filter.error.term')"
      :label="t('analyze.filter.term')"
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
import type { FilterSelectOptionsUpdateFn } from 'src/utils/selectOptionFilter';
import { filterSelectOptions } from 'src/utils/selectOptionFilter';
import { useInputBackground } from 'src/composables/useInputBackground';
import { ColumnTypes } from 'src/utils/columnTypes';

import { FilterRuleTerm } from './filterRuleTerm';
import { QSelect } from 'quasar';
import { FilterOperatorValue } from './filterRuleOperator';

export interface AnalyzeFilterRuleTermProps {
  disabled: boolean;
  hide: boolean;
  modelValue?: FilterRuleTerm | undefined;
  operatorValue?: FilterOperatorValue | undefined;
}

const { t } = useI18n();

const emit = defineEmits<{
  'update:modelValue': [value: FilterRuleTerm];
}>();

const props = defineProps<AnalyzeFilterRuleTermProps>();

const enumUpdated = ref(false);
const inputUpdated = ref(false);

function updateTerm(value: string | number | null) {
  const term = props.modelValue ?? new FilterRuleTerm({ value: '' });
  term.value = (value || '').toString().trim();
  emit('update:modelValue', term);
  inputUpdated.value = true;
}

const type = computed<null | ColumnTypes>(() => props.modelValue?.type || null);

const isEnum = computed<boolean>(() => type.value === ColumnTypes.Enum);
const isDate = computed<boolean>(() => type.value === ColumnTypes.Date);
const isTime = computed<boolean>(() => type.value === ColumnTypes.Time);
const isDateTime = computed<boolean>(() => type.value === ColumnTypes.DateTime);

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
    ? (validationOptions.value.maxLen ?? undefined)
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
    case ColumnTypes.Integer:
    case ColumnTypes.Rating:
    case ColumnTypes.Float:
      return 'number';
    case ColumnTypes.Boolean:
    case ColumnTypes.Photo:
      throw new Error('Boolean type is not supported');
    case ColumnTypes.Date:
      return 'date';
    case ColumnTypes.DateTime:
      return 'datetime-local';
    case ColumnTypes.Time:
      return 'time';
    case ColumnTypes.String:
    case ColumnTypes.Citext:
    case ColumnTypes.Enum:
    case null:
      return 'text';
    default:
      // eslint-disable-next-line @typescript-eslint/restrict-template-expressions
      throw new Error(`Unknown type: ${type.value}`);
  }
});

function filterOptions(
  searchValue: string,
  update: FilterSelectOptionsUpdateFn,
) {
  filterSelectOptions({
    searchValue,
    update,
    allOptions: options.value,
    filteredOptions,
    valueExtractorFn: (item) => item,
  });
}

const enumSelect = ref<QSelect | undefined>();

const { inputBgColor } = useInputBackground();
</script>
