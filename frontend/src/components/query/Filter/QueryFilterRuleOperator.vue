<template>
  <q-select
    :bg-color="disabled ? 'transparent' : inputBgColor"
    :disable="disabled"
    :error="modelValue?.isValid === false"
    :error-message="t('filter.error.operator')"
    :label="t('filter.operator')"
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
</template>
<script lang="ts" setup>
import { useI18n } from 'src/composables/useI18n';
import { computed, ref } from 'vue';
import { QSelect } from 'quasar';
import {
  filterSelectOptions,
  FilterSelectOptionsUpdateFn,
} from './selectOptionFilter';
import { useInputBackground } from './useQueryRule';
import { FilterRuleType, type FilterRuleTypeSchema } from './filterRule';

import { FilterRuleOperator, FilterOperatorValue } from './filterRuleOperator';

export interface QueryFilterRuleOperatorProps {
  schema?: FilterRuleTypeSchema;
  disabled: boolean;
  modelValue?: FilterRuleOperator;
}

const { t } = useI18n();

defineEmits<{
  (e: 'update:modelValue', value: FilterRuleOperator): void;
}>();

const props = defineProps<QueryFilterRuleOperatorProps>();

const allOptions = computed(() => [
  new FilterRuleOperator({
    label: t('filter.operators.equals'),
    value: FilterOperatorValue.Equal,
    suitableRuleTypes: [
      FilterRuleType.Integer,
      FilterRuleType.Float,
      FilterRuleType.String,
      FilterRuleType.Enum,
      FilterRuleType.Date,
      FilterRuleType.Datetime,
    ],
    schema: props.schema,
  }),
  new FilterRuleOperator({
    label: t('filter.operators.notEquals'),
    value: FilterOperatorValue.NotEqual,
    suitableRuleTypes: [
      FilterRuleType.Integer,
      FilterRuleType.Float,
      FilterRuleType.String,
      FilterRuleType.Enum,
      FilterRuleType.Date,
      FilterRuleType.Datetime,
    ],
    schema: props.schema,
  }),
  new FilterRuleOperator({
    label: t('filter.operators.less'),
    value: FilterOperatorValue.Less,
    suitableRuleTypes: [
      FilterRuleType.Integer,
      FilterRuleType.Float,
      FilterRuleType.Date,
      FilterRuleType.Datetime,
    ],
    schema: props.schema,
  }),
  new FilterRuleOperator({
    label: t('filter.operators.lessOrEqual'),
    value: FilterOperatorValue.LessOrEqual,
    suitableRuleTypes: [
      FilterRuleType.Integer,
      FilterRuleType.Float,
      FilterRuleType.Date,
      FilterRuleType.Datetime,
    ],
    schema: props.schema,
  }),
  new FilterRuleOperator({
    label: t('filter.operators.greater'),
    value: FilterOperatorValue.Greater,
    suitableRuleTypes: [
      FilterRuleType.Integer,
      FilterRuleType.Float,
      FilterRuleType.Date,
      FilterRuleType.Datetime,
    ],
    schema: props.schema,
  }),
  new FilterRuleOperator({
    label: t('filter.operators.greaterOrEqual'),
    value: FilterOperatorValue.GreaterOrEqual,
    suitableRuleTypes: [
      FilterRuleType.Integer,
      FilterRuleType.Float,
      FilterRuleType.Date,
      FilterRuleType.Datetime,
    ],
    schema: props.schema,
  }),
  new FilterRuleOperator({
    label: t('filter.operators.startsWith'),
    value: FilterOperatorValue.StartsWith,
    suitableRuleTypes: [FilterRuleType.String],
    schema: props.schema,
  }),
  new FilterRuleOperator({
    label: t('filter.operators.startsNotWith'),
    value: FilterOperatorValue.StartsNotWith,
    suitableRuleTypes: [FilterRuleType.String],
    schema: props.schema,
  }),
  new FilterRuleOperator({
    label: t('filter.operators.contains'),
    value: FilterOperatorValue.Contains,
    suitableRuleTypes: [FilterRuleType.String],
    schema: props.schema,
  }),
  new FilterRuleOperator({
    label: t('filter.operators.notContains'),
    value: FilterOperatorValue.NotContains,
    suitableRuleTypes: [FilterRuleType.String],
    schema: props.schema,
  }),
  new FilterRuleOperator({
    label: t('filter.operators.endsWith'),
    value: FilterOperatorValue.EndsWith,
    suitableRuleTypes: [FilterRuleType.String],
    schema: props.schema,
  }),
  new FilterRuleOperator({
    label: t('filter.operators.notEndsWith'),
    value: FilterOperatorValue.NotEndsWith,
    suitableRuleTypes: [FilterRuleType.String],
    schema: props.schema,
  }),
  new FilterRuleOperator({
    label: t('filter.operators.empty'),
    value: FilterOperatorValue.Empty,
    suitableRuleTypes: [FilterRuleType.String],
    schema: props.schema,
  }),
  new FilterRuleOperator({
    label: t('filter.operators.notEmpty'),
    value: FilterOperatorValue.NotEmpty,
    suitableRuleTypes: [FilterRuleType.String],
    schema: props.schema,
  }),
  new FilterRuleOperator({
    label: t('filter.operators.hasPhoto'),
    value: FilterOperatorValue.NotEmpty,
    suitableRuleTypes: [FilterRuleType.Photo],
    schema: props.schema,
  }),
  new FilterRuleOperator({
    label: t('filter.operators.isTrue'),
    value: FilterOperatorValue.True,
    suitableRuleTypes: [FilterRuleType.Boolean],
    schema: props.schema,
  }),
  new FilterRuleOperator({
    label: t('filter.operators.isFalse'),
    value: FilterOperatorValue.False,
    suitableRuleTypes: [FilterRuleType.Boolean],
    schema: props.schema,
  }),
]);

const applicableOptions = computed(() => {
  return allOptions.value
    .filter((option) =>
      option.suitableRuleTypes.find((type) => type === props.schema?.type),
    )
    .filter((option) => {
      if (props.schema?.allowEmpty) {
        return true;
      }
      return (
        option.value !== FilterOperatorValue.Empty &&
        option.value !== FilterOperatorValue.NotEmpty
      );
    });
});

const filteredOptions = ref(applicableOptions.value);

function filterOptions(value: string, update: FilterSelectOptionsUpdateFn) {
  filterSelectOptions<FilterRuleOperator>(
    value,
    update,
    applicableOptions.value,
    filteredOptions,
    (item) => item.label,
  );
}

const inputBgColor = useInputBackground();
</script>
./filterRuleOperator
