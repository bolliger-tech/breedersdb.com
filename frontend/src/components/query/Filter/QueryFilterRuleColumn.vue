<template>
  <q-select
    :error="isInvalid"
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
import { computed, onMounted, ref, watch } from 'vue';
import { AttributeSchema } from './filterOptionSchema';
import { FilterOption } from './filterTypes';
import {
  filterSelectOptions,
  FilterSelectOptionsUpdateFn,
} from './selectOptionFilter';
import { useInputBackground } from './useQueryRule';

export interface QueryFilterRuleColumnProps {
  modelValue?: FilterOption;
  options: AttributeSchema[];
}

const { t } = useI18n();

const emit = defineEmits<{
  (e: 'update:modelValue', value: FilterOption): void;
  (e: 'valid'): void;
  (e: 'invalid'): void;
}>();

const props = defineProps<QueryFilterRuleColumnProps>();

const options = computed<FilterOption[]>(() => {
  return props.options.map((option: AttributeSchema) => {
    return {
      label: option.label,
      value: option.name,
      schema: option,
    } as FilterOption;
  });
});

const filteredOptions = ref(options.value);

function filterOptions(value: string, update: FilterSelectOptionsUpdateFn) {
  filterSelectOptions<FilterOption>(
    value,
    update,
    options.value,
    filteredOptions,
    (item) => item.label,
  );
}

const isValid = computed<boolean>(() => {
  return (
    options.value.findIndex((item) => item.value === props.modelValue?.value) >
    -1
  );
});

const isInvalid = computed<boolean>(() => {
  return !isValid.value && typeof props.modelValue !== 'undefined';
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
