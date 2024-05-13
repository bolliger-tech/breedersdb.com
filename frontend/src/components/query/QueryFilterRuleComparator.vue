<template>
  <q-select
    :bg-color="disabled ? 'transparent' : inputBgColor"
    :disable="disabled"
    :error="isInvalid"
    :label="t('filter.comparator')"
    :model-value="modelValue"
    :options="filteredComparatorOptions"
    autocomplete="off"
    class="col-12 col-md-4"
    dense
    hide-bottom-space
    outlined
    use-input
    @filter="filterComparatorOptions"
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
import { FilterComparator, FilterComparatorOption } from './filterTypes';
import { PropertySchema, PropertySchemaOptionType } from './filterOptionSchema';
import { QSelect } from 'quasar';
import { filterOptions, FilterUpdateFn } from './filterRuleSelectOptionFilter';
import { useInputBackground } from './useQueryRule';

export interface QueryFilterRuleComparatorProps {
  schema?: PropertySchema;
  disabled: boolean;
  modelValue?: FilterComparatorOption;
}

const { t } = useI18n();

const emit = defineEmits<{
  (e: 'update:modelValue', value: FilterComparatorOption): void;
  (e: 'valid'): void;
  (e: 'invalid'): void;
}>();

const props = defineProps<QueryFilterRuleComparatorProps>();

const allComparatorOptions: FilterComparatorOption[] = [
  {
    label: t('filter.operands.equals'),
    value: FilterComparator.Equal,
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
    value: FilterComparator.NotEqual,
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
    value: FilterComparator.Less,
    type: [
      PropertySchemaOptionType.Integer,
      PropertySchemaOptionType.Float,
      PropertySchemaOptionType.Date,
      PropertySchemaOptionType.Datetime,
    ],
  },
  {
    label: t('filter.operands.lessOrEqual'),
    value: FilterComparator.LessOrEqual,
    type: [
      PropertySchemaOptionType.Integer,
      PropertySchemaOptionType.Float,
      PropertySchemaOptionType.Date,
      PropertySchemaOptionType.Datetime,
    ],
  },
  {
    label: t('filter.operands.greater'),
    value: FilterComparator.Greater,
    type: [
      PropertySchemaOptionType.Integer,
      PropertySchemaOptionType.Float,
      PropertySchemaOptionType.Date,
      PropertySchemaOptionType.Datetime,
    ],
  },
  {
    label: t('filter.operands.greaterOrEqual'),
    value: FilterComparator.GreaterOrEqual,
    type: [
      PropertySchemaOptionType.Integer,
      PropertySchemaOptionType.Float,
      PropertySchemaOptionType.Date,
      PropertySchemaOptionType.Datetime,
    ],
  },
  {
    label: t('filter.operands.startsWith'),
    value: FilterComparator.StartsWith,
    type: [PropertySchemaOptionType.String],
  },
  {
    label: t('filter.operands.startsNotWith'),
    value: FilterComparator.StartsNotWith,
    type: [PropertySchemaOptionType.String],
  },
  {
    label: t('filter.operands.contains'),
    value: FilterComparator.Contains,
    type: [PropertySchemaOptionType.String],
  },
  {
    label: t('filter.operands.notContains'),
    value: FilterComparator.NotContains,
    type: [PropertySchemaOptionType.String],
  },
  {
    label: t('filter.operands.endsWith'),
    value: FilterComparator.EndsWith,
    type: [PropertySchemaOptionType.String],
  },
  {
    label: t('filter.operands.notEndsWith'),
    value: FilterComparator.NotEndsWith,
    type: [PropertySchemaOptionType.String],
  },
  {
    label: t('filter.operands.empty'),
    value: FilterComparator.Empty,
    type: [PropertySchemaOptionType.String],
  },
  {
    label: t('filter.operands.notEmpty'),
    value: FilterComparator.NotEmpty,
    type: [PropertySchemaOptionType.String],
  },
  {
    label: t('filter.operands.hasPhoto'),
    value: FilterComparator.NotEmpty,
    type: [PropertySchemaOptionType.Photo],
  },
  {
    label: t('filter.operands.isTrue'),
    value: FilterComparator.True,
    type: [PropertySchemaOptionType.Boolean],
  },
  {
    label: t('filter.operands.isFalse'),
    value: FilterComparator.False,
    type: [PropertySchemaOptionType.Boolean],
  },
];

const availableComparatorOptions = computed<FilterComparatorOption[]>(() => {
  return allComparatorOptions
    .filter((option: FilterComparatorOption) =>
      option.type.find((type) => type === props.schema?.options.type),
    )
    .filter((option) => {
      if (props.schema?.options.allowEmpty) {
        return true;
      }
      return (
        option.value !== FilterComparator.Empty &&
        option.value !== FilterComparator.NotEmpty
      );
    });
});

const filteredComparatorOptions = ref(availableComparatorOptions.value);

function filterComparatorOptions(value: string, update: FilterUpdateFn) {
  filterOptions<FilterComparatorOption>(
    value,
    update,
    availableComparatorOptions.value,
    filteredComparatorOptions,
    (item) => item.label,
  );
}

const isValid = computed<boolean>(() => {
  if (!!props.modelValue && 'value' in props.modelValue) {
    const modelValue = props.modelValue;
    return (
      availableComparatorOptions.value.findIndex(
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
