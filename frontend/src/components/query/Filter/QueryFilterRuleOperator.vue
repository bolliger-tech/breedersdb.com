<template>
  <q-select
    :bg-color="disabled ? 'transparent' : inputBgColor"
    :disable="disabled"
    :error="isInvalid"
    :error-message="t('filter.error.operator')"
    :label="t('filter.operator')"
    :model-value="modelValue"
    :options="filteredOperatorOptions"
    autocomplete="off"
    dense
    hide-bottom-space
    outlined
    use-input
    fill-input
    hide-selected
    clearable
    @filter="filterOperatorOptions"
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
import { computed, onMounted, ref, watch } from 'vue';
import { FilterOperator, FilterOperatorOption } from './filterTypes';
import { PropertySchema, PropertySchemaOptionType } from './filterOptionSchema';
import { QSelect } from 'quasar';
import { filterOptions, FilterUpdateFn } from './filterRuleSelectOptionFilter';
import { useInputBackground } from './useQueryRule';

export interface QueryFilterRuleOperatorProps {
  schema?: PropertySchema;
  disabled: boolean;
  modelValue?: FilterOperatorOption;
}

const { t } = useI18n();

const emit = defineEmits<{
  (e: 'update:modelValue', value: FilterOperatorOption): void;
  (e: 'valid'): void;
  (e: 'invalid'): void;
}>();

const props = defineProps<QueryFilterRuleOperatorProps>();

const allOperatorOptions: FilterOperatorOption[] = [
  {
    label: t('filter.operands.equals'),
    value: FilterOperator.Equal,
    type: [
      PropertySchemaOptionType.Integer,
      PropertySchemaOptionType.Float,
      PropertySchemaOptionType.String,
      PropertySchemaOptionType.Enum,
      PropertySchemaOptionType.Date,
      PropertySchemaOptionType.Datetime,
    ],
  },
  {
    label: t('filter.operands.notEquals'),
    value: FilterOperator.NotEqual,
    type: [
      PropertySchemaOptionType.Integer,
      PropertySchemaOptionType.Float,
      PropertySchemaOptionType.String,
      PropertySchemaOptionType.Enum,
      PropertySchemaOptionType.Date,
      PropertySchemaOptionType.Datetime,
    ],
  },
  {
    label: t('filter.operands.less'),
    value: FilterOperator.Less,
    type: [
      PropertySchemaOptionType.Integer,
      PropertySchemaOptionType.Float,
      PropertySchemaOptionType.Date,
      PropertySchemaOptionType.Datetime,
    ],
  },
  {
    label: t('filter.operands.lessOrEqual'),
    value: FilterOperator.LessOrEqual,
    type: [
      PropertySchemaOptionType.Integer,
      PropertySchemaOptionType.Float,
      PropertySchemaOptionType.Date,
      PropertySchemaOptionType.Datetime,
    ],
  },
  {
    label: t('filter.operands.greater'),
    value: FilterOperator.Greater,
    type: [
      PropertySchemaOptionType.Integer,
      PropertySchemaOptionType.Float,
      PropertySchemaOptionType.Date,
      PropertySchemaOptionType.Datetime,
    ],
  },
  {
    label: t('filter.operands.greaterOrEqual'),
    value: FilterOperator.GreaterOrEqual,
    type: [
      PropertySchemaOptionType.Integer,
      PropertySchemaOptionType.Float,
      PropertySchemaOptionType.Date,
      PropertySchemaOptionType.Datetime,
    ],
  },
  {
    label: t('filter.operands.startsWith'),
    value: FilterOperator.StartsWith,
    type: [PropertySchemaOptionType.String],
  },
  {
    label: t('filter.operands.startsNotWith'),
    value: FilterOperator.StartsNotWith,
    type: [PropertySchemaOptionType.String],
  },
  {
    label: t('filter.operands.contains'),
    value: FilterOperator.Contains,
    type: [PropertySchemaOptionType.String],
  },
  {
    label: t('filter.operands.notContains'),
    value: FilterOperator.NotContains,
    type: [PropertySchemaOptionType.String],
  },
  {
    label: t('filter.operands.endsWith'),
    value: FilterOperator.EndsWith,
    type: [PropertySchemaOptionType.String],
  },
  {
    label: t('filter.operands.notEndsWith'),
    value: FilterOperator.NotEndsWith,
    type: [PropertySchemaOptionType.String],
  },
  {
    label: t('filter.operands.empty'),
    value: FilterOperator.Empty,
    type: [PropertySchemaOptionType.String],
  },
  {
    label: t('filter.operands.notEmpty'),
    value: FilterOperator.NotEmpty,
    type: [PropertySchemaOptionType.String],
  },
  {
    label: t('filter.operands.hasPhoto'),
    value: FilterOperator.NotEmpty,
    type: [PropertySchemaOptionType.Photo],
  },
  {
    label: t('filter.operands.isTrue'),
    value: FilterOperator.True,
    type: [PropertySchemaOptionType.Boolean],
  },
  {
    label: t('filter.operands.isFalse'),
    value: FilterOperator.False,
    type: [PropertySchemaOptionType.Boolean],
  },
];

const availableOperatorOptions = computed<FilterOperatorOption[]>(() => {
  return allOperatorOptions
    .filter((option: FilterOperatorOption) =>
      option.type.find((type) => type === props.schema?.options.type),
    )
    .filter((option) => {
      if (props.schema?.options.allowEmpty) {
        return true;
      }
      return (
        option.value !== FilterOperator.Empty &&
        option.value !== FilterOperator.NotEmpty
      );
    });
});

const filteredOperatorOptions = ref(availableOperatorOptions.value);

function filterOperatorOptions(value: string, update: FilterUpdateFn) {
  filterOptions<FilterOperatorOption>(
    value,
    update,
    availableOperatorOptions.value,
    filteredOperatorOptions,
    (item) => item.label,
  );
}

const isValid = computed<boolean>(() => {
  if (!!props.modelValue && 'value' in props.modelValue) {
    const modelValue = props.modelValue;
    return (
      availableOperatorOptions.value.findIndex(
        (item) => item.value === modelValue.value,
      ) > -1
    );
  }

  return false;
});

const isInvalid = computed<boolean>(() => {
  return !isValid.value && props.modelValue !== undefined;
});

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
