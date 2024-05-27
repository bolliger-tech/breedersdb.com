<template>
  <q-space v-if="hide" class="col-12 col-md-4" />

  <template v-else>
    <q-select
      v-if="isEnum"
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
} from './selectOptionFilter';
import { useInputBackground } from './useQueryRule';
import { FilterRuleType } from './filterRule';

import { FilterRuleTerm } from './filterRuleTerm';
import { QSelect } from 'quasar';

export interface QueryFilterRuleTermProps {
  disabled: boolean;
  hide: boolean;
  modelValue?: FilterRuleTerm;
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

const type = computed<null | FilterRuleType>(
  () => props.modelValue?.type || null,
);

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
  return type.value === FilterRuleType.DateTime;
});

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

const filteredOptions = ref(options.value);

const inputType = computed(() => {
  switch (type.value) {
    case FilterRuleType.Integer:
    case FilterRuleType.Float:
      return 'number';
    case FilterRuleType.Boolean:
    case FilterRuleType.Photo:
      throw new Error('Boolean type is not supported');
    case FilterRuleType.Date:
      return 'date';
    case FilterRuleType.DateTime:
      return 'datetime-local';
    case FilterRuleType.Time:
      return 'time';
    case FilterRuleType.String:
    case FilterRuleType.Enum:
    case null:
      return 'text';
    default:
      throw new Error(`Unknown type: ${type.value}`);
  }
});

function filterOptions(value: string, update: FilterSelectOptionsUpdateFn) {
  filterSelectOptions(
    value,
    update,
    options.value,
    filteredOptions,
    (item) => item,
  );
}

const enumSelect = ref<QSelect | undefined>();

const { inputBgColor } = useInputBackground();
</script>
