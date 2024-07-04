<template>
  <BaseInputLabel :label="label">
    <q-select
      v-if="!error"
      ref="selectRef"
      v-model="modelValue"
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
      :hint="required ? t('base.required') : ''"
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
  </BaseInputLabel>
</template>

<script setup lang="ts" generic="T extends { [key: string]: any }">
import BaseGraphqlError from 'src/components/Base/BaseGraphqlError.vue';
import { QSelect } from 'quasar';
import { useI18n } from 'src/composables/useI18n';
import { ComponentPublicInstance, VNodeRef, computed, ref } from 'vue';
import { useInputBackground } from 'src/composables/useInputBackground';
import {
  FilterSelectOptionsUpdateFn,
  filterSelectOptions,
} from 'src/utils/selectOptionFilter';
import { shallowRef } from 'vue';
import { CombinedError } from '@urql/vue';
import BaseInputLabel from 'src/components/Base/BaseInputLabel.vue';

// it currently seems to be a bug with generic components. the currect type
// would be without the `& VNodeRef` part.
// but this throws an error. the workaround with `& VNodeRef` is not 100%
// accurate, but it works.
export type EntitySelectInstance<T> = {
  validate: () => ReturnType<QSelect['validate']> | undefined;
  focus: () => ReturnType<QSelect['focus']> | undefined;
} & ComponentPublicInstance<EntitySelectProps<T>> &
  VNodeRef;

// for generic components we have to export all interfaces or none. else it currently throws an error
export interface EntitySelectProps<T> extends EntitySelectPropsWithoutModel<T> {
  modelValue: T | null | undefined;
}

// for generic components we have to export all interfaces or none. else it currently throws an error
export interface EntitySelectPropsWithoutModel<T> {
  label: string;
  required?: boolean;
  optionValue: keyof T;
  optionLabel: keyof T;
  options: T[];
  loading?: boolean;
  error?: CombinedError | null;
}

const props = withDefaults(defineProps<EntitySelectPropsWithoutModel<T>>(), {
  required: false,
  loading: false,
  error: null,
});

const selectRef = ref<QSelect | null>(null);
defineExpose({
  validate: () => selectRef.value?.validate(),
  focus: () => selectRef.value?.focus(),
});

const modelValue = defineModel<T | null | undefined>();

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
