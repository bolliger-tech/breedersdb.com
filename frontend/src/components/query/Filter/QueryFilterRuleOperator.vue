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
import { FilterRuleSchema, FilterRuleType } from './filterRuleTypes';
import { FilterOperator, FilterOperatorValue } from './filterOperator';

export interface QueryFilterRuleOperatorProps {
  schema?: FilterRuleSchema;
  disabled: boolean;
  modelValue?: FilterOperator;
}

const { t } = useI18n();

defineEmits<{
  (e: 'update:modelValue', value: FilterOperator): void;
}>();

const props = defineProps<QueryFilterRuleOperatorProps>();

const allOptions = computed(() => [
  new FilterOperator(
    t('filter.operators.equals'),
    FilterOperatorValue.Equal,
    [
      FilterRuleType.Integer,
      FilterRuleType.Float,
      FilterRuleType.String,
      FilterRuleType.Enum,
      FilterRuleType.Date,
      FilterRuleType.Datetime,
    ],
    props.schema,
  ),
  new FilterOperator(
    t('filter.operators.notEquals'),
    FilterOperatorValue.NotEqual,
    [
      FilterRuleType.Integer,
      FilterRuleType.Float,
      FilterRuleType.String,
      FilterRuleType.Enum,
      FilterRuleType.Date,
      FilterRuleType.Datetime,
    ],
    props.schema,
  ),
  new FilterOperator(
    t('filter.operators.less'),
    FilterOperatorValue.Less,
    [
      FilterRuleType.Integer,
      FilterRuleType.Float,
      FilterRuleType.Date,
      FilterRuleType.Datetime,
    ],
    props.schema,
  ),
  new FilterOperator(
    t('filter.operators.lessOrEqual'),
    FilterOperatorValue.LessOrEqual,
    [
      FilterRuleType.Integer,
      FilterRuleType.Float,
      FilterRuleType.Date,
      FilterRuleType.Datetime,
    ],
    props.schema,
  ),
  new FilterOperator(
    t('filter.operators.greater'),
    FilterOperatorValue.Greater,
    [
      FilterRuleType.Integer,
      FilterRuleType.Float,
      FilterRuleType.Date,
      FilterRuleType.Datetime,
    ],
    props.schema,
  ),
  new FilterOperator(
    t('filter.operators.greaterOrEqual'),
    FilterOperatorValue.GreaterOrEqual,
    [
      FilterRuleType.Integer,
      FilterRuleType.Float,
      FilterRuleType.Date,
      FilterRuleType.Datetime,
    ],
    props.schema,
  ),
  new FilterOperator(
    t('filter.operators.startsWith'),
    FilterOperatorValue.StartsWith,
    [FilterRuleType.String],
    props.schema,
  ),
  new FilterOperator(
    t('filter.operators.startsNotWith'),
    FilterOperatorValue.StartsNotWith,
    [FilterRuleType.String],
    props.schema,
  ),
  new FilterOperator(
    t('filter.operators.contains'),
    FilterOperatorValue.Contains,
    [FilterRuleType.String],
    props.schema,
  ),
  new FilterOperator(
    t('filter.operators.notContains'),
    FilterOperatorValue.NotContains,
    [FilterRuleType.String],
    props.schema,
  ),
  new FilterOperator(
    t('filter.operators.endsWith'),
    FilterOperatorValue.EndsWith,
    [FilterRuleType.String],
    props.schema,
  ),
  new FilterOperator(
    t('filter.operators.notEndsWith'),
    FilterOperatorValue.NotEndsWith,
    [FilterRuleType.String],
    props.schema,
  ),
  new FilterOperator(
    t('filter.operators.empty'),
    FilterOperatorValue.Empty,
    [FilterRuleType.String],
    props.schema,
  ),
  new FilterOperator(
    t('filter.operators.notEmpty'),
    FilterOperatorValue.NotEmpty,
    [FilterRuleType.String],
    props.schema,
  ),
  new FilterOperator(
    t('filter.operators.hasPhoto'),
    FilterOperatorValue.NotEmpty,
    [FilterRuleType.Photo],
    props.schema,
  ),
  new FilterOperator(
    t('filter.operators.isTrue'),
    FilterOperatorValue.True,
    [FilterRuleType.Boolean],
    props.schema,
  ),
  new FilterOperator(
    t('filter.operators.isFalse'),
    FilterOperatorValue.False,
    [FilterRuleType.Boolean],
    props.schema,
  ),
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
  filterSelectOptions<FilterOperator>(
    value,
    update,
    applicableOptions.value,
    filteredOptions,
    (item) => item.label,
  );
}

const inputBgColor = useInputBackground();
</script>
