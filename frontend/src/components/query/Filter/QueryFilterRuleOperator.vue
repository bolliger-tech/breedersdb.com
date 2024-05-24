<template>
  <q-select
    :bg-color="disabled ? 'transparent' : inputBgColor"
    :disable="disabled"
    :error="modelValue?.isValid === false"
    :error-message="t('filter.error.operator')"
    :label="t('filter.operator')"
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
import { ref } from 'vue';
import { QSelect } from 'quasar';
import {
  filterSelectOptions,
  FilterSelectOptionsUpdateFn,
} from './selectOptionFilter';
import { useInputBackground } from './useQueryRule';
import { createGetFilterRuleOperators } from './createFilterRuleOperators';
import { FilterRuleOperator } from './filterRuleOperator';
import { computed } from 'vue';
import { FilterRuleType } from './filterRule';

export interface QueryFilterRuleOperatorProps {
  disabled: boolean;
  modelValue?: FilterRuleOperator;
  ruleType?: FilterRuleType;
}

const { t } = useI18n();

defineEmits<{
  'update:modelValue': [value: FilterRuleOperator];
}>();

const props = defineProps<QueryFilterRuleOperatorProps>();

const getOperators = createGetFilterRuleOperators();
const applicableOptions = computed(() => {
  return typeof props.modelValue?.allowEmpty !== 'undefined' && props.ruleType
    ? getOperators(props.ruleType, props.modelValue.allowEmpty)
    : [];
});

const filteredOptions = ref(applicableOptions.value);
function filterOptions(value: string, update: FilterSelectOptionsUpdateFn) {
  filterSelectOptions(
    value,
    update,
    applicableOptions.value,
    filteredOptions,
    (item) => t(item.labelKey),
  );
}

const inputBgColor = useInputBackground();
</script>
