<template>
  <div>
    <q-select
      v-if="!error"
      :ref="selectRef"
      v-model="modelValue"
      :label="label"
      :bg-color="inputBgColor"
      :options="filteredOptions"
      :rules="rules"
      autocomplete="off"
      :option-value="optionValueKey"
      :option-label="optionLabelKey"
      dense
      outlined
      use-input
      fill-input
      hide-selected
      clearable
      :loading="loading"
      @filter="filterOptions"
    >
      <template #no-option>
        <q-item>
          <q-item-section class="text-grey">
            {{ t('base.noResults') }}
          </q-item-section>
        </q-item>
      </template>
    </q-select>

    <q-card v-else>
      <BaseGraphqlError :error="error" />
    </q-card>
  </div>
</template>

<script setup lang="ts" generic="T extends { [key: string]: any }">
import BaseGraphqlError from 'src/components/Base/BaseGraphqlError.vue';
import { QSelect } from 'quasar';
import { useI18n } from 'src/composables/useI18n';
import { VNodeRef, computed, ref } from 'vue';
import { useInputBackground } from 'src/composables/useInputBackground';
import {
  FilterSelectOptionsUpdateFn,
  filterSelectOptions,
} from 'src/utils/selectOptionFilter';
import { shallowRef } from 'vue';
import { CombinedError } from '@urql/vue';

export type EntitySelectInstance = VNodeRef & {
  // HACK: the way to do it properly doesn't seem to work with generics,
  // therefore it is manually typed. The proper way would be something like this:
  // export type EntitySelect = InstanceType<typeof EntitySelect>;
  validate: () => ReturnType<QSelect['validate']> | undefined;
};

interface EntitySelectPropsWithoutModel {
  label: string;
  required?: boolean;
  optionValue: keyof T;
  optionLabel: keyof T;
  options: T[];
  loading?: boolean;
  error?: CombinedError | null;
}

const props = withDefaults(defineProps<EntitySelectPropsWithoutModel>(), {
  required: false,
  loading: false,
  error: null,
});

const selectRef = ref<QSelect | null>(null);
defineExpose({
  validate: () => selectRef.value?.validate(),
});

const modelValue = defineModel<T>();

const filteredOptions = shallowRef([...props.options]);
function filterOptions(value: string, update: FilterSelectOptionsUpdateFn) {
  filterSelectOptions({
    value,
    update,
    allOptions: Object.freeze([...props.options]),
    filteredOptions,
    valueExtractorFn: (item) => item[props.optionLabel],
  });
}

const { t } = useI18n();
const { inputBgColor } = useInputBackground();

const rules = computed(() => {
  return props.required
    ? [
        (val: T) =>
          !!val ||
          t('base.validation.xIsRequired', {
            x: props.label,
          }),
      ]
    : [];
});

const optionValueKey = props.optionValue as string;
const optionLabelKey = props.optionLabel as string;
</script>
