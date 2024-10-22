<template>
  <q-select
    :bg-color="disabled ? 'transparent' : inputBgColor"
    :disable="disabled"
    :error="modelValue?.isValid === false"
    :error-message="t('analyze.filter.error.operator')"
    :label="t('analyze.filter.operator')"
    :model-value="modelValue"
    :options="filteredOptions"
    :option-label="(operator) => t(operator.labelKey)"
    autocomplete="off"
    dense
    hide-bottom-space
    outlined
    use-input
    fill-input
    hide-selected
    @filter="filterOptions"
    @update:model-value="(value) => $emit('update:modelValue', value)"
  >
    <template #no-option>
      <q-item>
        <q-item-section class="text-grey">
          {{ t('base.noResults') }}
        </q-item-section>
      </q-item>
    </template>
  </q-select>
</template>

<script lang="ts" setup>
import { useI18n } from 'src/composables/useI18n';
import { ref } from 'vue';
import { QSelect } from 'quasar';
import {
  filterSelectOptions,
  FilterSelectOptionsUpdateFn,
} from 'src/utils/selectOptionFilter';
import { useInputBackground } from 'src/composables/useInputBackground';
import { createGetFilterRuleOperators } from './createFilterRuleOperators';
import { FilterRuleOperator } from './filterRuleOperator';
import { computed } from 'vue';
import { ColumnTypes } from 'src/utils/columnTypes';

export interface AnalyzeFilterRuleOperatorProps {
  disabled: boolean;
  modelValue?: FilterRuleOperator;
  columnType?: ColumnTypes;
}

const { t } = useI18n();

defineEmits<{
  'update:modelValue': [value: FilterRuleOperator];
}>();

const props = defineProps<AnalyzeFilterRuleOperatorProps>();

const getOperators = createGetFilterRuleOperators();
const applicableOptions = computed(() => {
  return typeof props.modelValue?.allowEmpty !== 'undefined' && props.columnType
    ? getOperators(props.columnType, props.modelValue.allowEmpty)
    : [];
});

const filteredOptions = ref(applicableOptions.value);
function filterOptions(
  searchValue: string,
  update: FilterSelectOptionsUpdateFn,
) {
  filterSelectOptions({
    searchValue,
    update,
    allOptions: applicableOptions.value,
    filteredOptions,
    valueExtractorFn: (item) => t(item.labelKey),
  });
}

const { inputBgColor } = useInputBackground();
</script>
