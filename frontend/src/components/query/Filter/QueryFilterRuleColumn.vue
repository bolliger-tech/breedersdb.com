<template>
  <q-select
    :error="modelValue?.isValid === false"
    :error-message="t('filter.error.column')"
    :label="t('filter.column')"
    :model-value="modelValue"
    :options="filteredOptions"
    autocomplete="off"
    :bg-color="inputBgColor"
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
import {
  filterSelectOptions,
  FilterSelectOptionsUpdateFn,
} from './selectOptionFilter';
import { useInputBackground } from './useQueryRule';
import { FilterRuleColumn } from './filterRuleColumn';

export interface QueryFilterRuleColumnProps {
  modelValue?: FilterRuleColumn;
  options: FilterRuleColumn[];
}

const { t } = useI18n();

defineEmits<{
  (e: 'update:modelValue', value: FilterRuleColumn): void;
}>();

const props = defineProps<QueryFilterRuleColumnProps>();

const filteredOptions = ref(props.options);

function filterOptions(value: string, update: FilterSelectOptionsUpdateFn) {
  filterSelectOptions<FilterRuleColumn>(
    value,
    update,
    props.options,
    filteredOptions,
    (item) => item.label,
  );
}

const inputBgColor = useInputBackground();
</script>
./filterRuleColumn
