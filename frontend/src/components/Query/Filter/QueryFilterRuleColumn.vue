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

    <template #option="{ opt, itemProps }">
      <q-item v-bind="itemProps">
        <q-item-section>
          <q-item-label>
            <span class="text-muted"
              >{{ opt.tableLabel }}&nbsp;&nbsp;>&nbsp;&nbsp;</span
            >{{ opt.tableColumnLabel }}</q-item-label
          >
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
} from 'src/utils/selectOptionFilter';
import { useInputBackground } from 'src/composables/useInputBackground';
import { FilterRuleColumn } from './filterRuleColumn';

export interface QueryFilterRuleColumnProps {
  modelValue?: FilterRuleColumn;
  options: FilterRuleColumn[];
}

const { t } = useI18n();

defineEmits<{
  'update:modelValue': [value: FilterRuleColumn];
}>();

const props = defineProps<QueryFilterRuleColumnProps>();

const filteredOptions = ref(props.options);

function filterOptions(value: string, update: FilterSelectOptionsUpdateFn) {
  filterSelectOptions<FilterRuleColumn>({
    value,
    update,
    allOptions: props.options,
    filteredOptions,
    valueExtractorFn: (item) => item.label,
  });
}

const { inputBgColor } = useInputBackground();
</script>
