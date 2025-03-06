<template>
  <BaseInputLabel :label="label" :explainer="explainer">
    <template v-if="$slots.explainer" #explainer>
      <slot name="explainer"></slot>
    </template>

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
      :option-disable="optionDisable"
      dense
      outlined
      use-input
      fill-input
      hide-selected
      :clearable="clearable"
      :loading="loading"
      :hint="hint ? hint : required ? t('base.required') : ''"
      :label="inlineLabel"
      bottom-slots
      :readonly="readonly"
      :disable="disable"
      @popup-show="() => (inlineLabel = label)"
      @popup-hide="() => (inlineLabel = undefined)"
      @filter="filterOptions"
      @input-value="($event) => $emit('input-value', $event)"
      @keydown="$emit('keydown', $event)"
    >
      <template #no-option="noOptionProps">
        <slot name="no-option" v-bind="noOptionProps">
          <q-item>
            <q-item-section class="text-grey">
              {{ noOptionText || t('base.noResults') }}
            </q-item-section>
          </q-item>
        </slot>
      </template>

      <template v-if="$slots.option" #option="option">
        <slot name="option" v-bind="option"></slot>
      </template>

      <template v-if="$slots['after-options']" #after-options>
        <slot name="after-options"></slot>
      </template>
    </q-select>

    <q-card v-else>
      <BaseGraphqlError :error="error" />
    </q-card>
  </BaseInputLabel>
</template>

<script setup lang="ts" generic="T extends { [key: string]: any }">
import BaseGraphqlError from 'src/components/Base/BaseGraphqlError.vue';
import type { QSelectProps, QSelectSlots } from 'quasar';
import { QSelect } from 'quasar';
import { useI18n } from 'src/composables/useI18n';
import type { ShallowUnwrapRef } from 'vue';
import {
  type ComponentPublicInstance,
  type VNodeRef,
  computed,
  ref,
  type Slot,
  type ShallowRef,
} from 'vue';
import { useInputBackground } from 'src/composables/useInputBackground';
import type { FilterSelectOptionsUpdateFn } from 'src/utils/selectOptionFilter';
import { filterSelectOptions } from 'src/utils/selectOptionFilter';
import { shallowRef } from 'vue';
import type { CombinedError } from '@urql/vue';
import BaseInputLabel from 'src/components/Base/BaseInputLabel.vue';
import { focusInView } from 'src/utils/focusInView';
import { useLocalizedSort } from 'src/composables/useLocalizedSort';

// it currently seems to be a bug with generic components. the currect type
// would be without the `& VNodeRef` part.
// but this throws an error. the workaround with `& VNodeRef` is not 100%
// accurate, but it works.
export type EntitySelectInstance<T> = {
  validate: () => ReturnType<QSelect['validate']> | undefined;
  focus: () => ReturnType<QSelect['focus']> | undefined;
  filteredOptions: ShallowUnwrapRef<T[]>;
} & ComponentPublicInstance<EntitySelectProps<T>> &
  VNodeRef;

// for generic components we have to export all interfaces or none. else it currently throws an error
export interface EntitySelectProps<T> extends EntitySelectPropsWithoutModel<T> {
  modelValue: T | null | undefined;
}

// for generic components we have to export all interfaces or none. else it currently throws an error
export interface EntitySelectPropsWithoutModel<T> {
  label: string | undefined;
  required?: boolean | undefined;
  optionValue: keyof T;
  optionLabel: keyof T;
  options: T[];
  loading?: boolean | undefined;
  error?: CombinedError | null | undefined;
  clearable?: boolean | undefined;
  optionDisable?: QSelectProps['optionDisable'] | undefined;
  noSort?: boolean | undefined;
  explainer?: string | undefined;
  rules?: QSelectProps['rules'] | undefined;
  filterFn?:
    | ((
        value: string,
        update: FilterSelectOptionsUpdateFn,
        filteredOptions: ShallowRef<T[]>,
      ) => void)
    | undefined;
  noOptionText?: string | undefined;
  readonly?: QSelectProps['readonly'] | undefined;
  disable?: QSelectProps['disable'] | undefined;
  hint?: string | undefined;
  filterWithWildcardsAroundDots?: boolean;
}

const props = withDefaults(defineProps<EntitySelectPropsWithoutModel<T>>(), {
  required: false,
  loading: false,
  error: null,
  clearable: true,
  noSort: false,
  readonly: false,
  disable: false,
  filterWithWildcardsAroundDots: false,
});

defineSlots<{
  option: QSelectSlots['option'];
  explainer: Slot;
  hint: Slot;
  'after-options': QSelectSlots['after-options'];
  'no-option': QSelectSlots['no-option'];
}>();

const modelValue = defineModel<T | null | undefined>();

defineEmits<{
  'input-value': [value: string];
  keydown: [event: KeyboardEvent];
}>();

// see below for exposed methods

const { t } = useI18n();
const { localizedSortPredicate } = useLocalizedSort();

const options = computed(() => {
  return props.noSort
    ? props.options
    : props.options
        .slice()
        .sort((a: T, b: T) =>
          localizedSortPredicate(a[props.optionLabel], b[props.optionLabel]),
        );
});

const filteredOptions = shallowRef([...options.value]);
function filterOptions(
  searchValue: string,
  update: FilterSelectOptionsUpdateFn,
) {
  if (props.filterFn) {
    props.filterFn(searchValue, update, filteredOptions);
  } else {
    filterSelectOptions({
      searchValue,
      update,
      allOptions: Object.freeze([...options.value]),
      filteredOptions,
      valueExtractorFn: (item) => item[props.optionLabel],
      withWildcardsAroundDots: props.filterWithWildcardsAroundDots,
    });
  }
}

const selectRef = ref<QSelect | null>(null);
defineExpose({
  validate: () => selectRef.value?.validate(),
  focus: () => selectRef.value && focusInView(selectRef.value),
  filteredOptions,
  updateInputValue: (value: string, noFilter?: boolean) =>
    selectRef.value?.updateInputValue(value, noFilter),
  hidePopup: () => selectRef.value?.hidePopup(),
  blur: () => selectRef.value?.blur(),
});

const { inputBgColor } = useInputBackground();

const rules = computed(() => {
  const r = props.rules || [];
  if (props.required) {
    r.unshift(
      (val: T) => !!val || t('base.validation.xIsRequired', { x: props.label }),
    );
  }
  return r;
});

const optionValueKey = props.optionValue as string;
const optionLabelKey = props.optionLabel as string;

const inlineLabel = ref<string | undefined>(undefined);
</script>
