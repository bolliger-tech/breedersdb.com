<template>
  <q-select
    :error="isInvalid"
    :label="t('filter.column')"
    :model-value="modelValue"
    :options="filteredFilterOptions"
    autocomplete="off"
    bg-color="white"
    class="col-12 col-md-4"
    dense
    hide-bottom-space
    outlined
    use-input
    @filter="filterFilterOptions"
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
import { PropertySchema } from './filterOptionSchema';
import { FilterOption } from './filterTypes';
import {
  filterOptions as filterSelectOptions,
  FilterUpdateFn,
} from './filterRuleSelectOptionFilter';

export interface QueryFilterRuleColumnProps {
  modelValue?: FilterOption;
  options: PropertySchema[];
}

const { t } = useI18n();

const emit = defineEmits<{
  (e: 'update:modelValue', value: FilterOption): void;
  (e: 'valid'): void;
  (e: 'invalid'): void;
}>();

const props = defineProps<QueryFilterRuleColumnProps>();

const filterOptions = computed<FilterOption[]>(() => {
  return props.options.map((option: PropertySchema) => {
    return {
      label: option.label,
      value: option.name,
      schema: option,
    } as FilterOption;
  });
});

const filteredFilterOptions = ref(filterOptions.value);

function filterFilterOptions(value: string, update: FilterUpdateFn) {
  filterSelectOptions<FilterOption>(
    value,
    update,
    filterOptions.value,
    filteredFilterOptions,
    (item) => item.label,
  );
}

const isValid = computed<boolean>(() => {
  return (
    filterOptions.value.findIndex(
      (item) => item.value === props.modelValue?.value,
    ) > -1
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
</script>
