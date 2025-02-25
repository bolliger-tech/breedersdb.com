<template>
  <q-select
    v-if="possibleOptions.length > 0"
    ref="selectRef"
    :label="t('entity.list.addColumn')"
    :model-value="null"
    :options="filteredOptions"
    use-input
    dense
    :bg-color="inputBgColor"
    autocomplete="off"
    hide-bottom-space
    outlined
    @filter="filterOptions"
    @update:model-value="(option) => addColumn(option.value)"
  >
    <template v-if="$slots['before-options']" #[`before-options`]>
      <slot name="before-options"></slot>
    </template>
    <template #option="optionProps">
      <slot name="option" v-bind="optionProps">
        <q-item v-bind="optionProps.itemProps">
          <q-item-section>
            <q-item-label class="row align-center no-wrap">
              {{ optionProps.opt.label }}
            </q-item-label>
          </q-item-section>
        </q-item>
      </slot>
    </template>
  </q-select>
</template>

<script lang="ts" setup>
import { computed, ref, watch } from 'vue';
import { QSelect, QSelectSlots, QTableColumn } from 'quasar';
import { useI18n } from 'src/composables/useI18n';
import {
  FilterSelectOptionsUpdateFn,
  filterSelectOptions,
} from 'src/utils/selectOptionFilter';
import { useInputBackground } from 'src/composables/useInputBackground';

export interface EntityListTableColumnSelectorProps
  extends EntityListTableColumnSelectorPropsWithoutModel {
  visibleColumns: string[];
}

interface EntityListTableColumnSelectorPropsWithoutModel {
  allColumns: QTableColumn[];
}

const props = defineProps<EntityListTableColumnSelectorPropsWithoutModel>();
const visibleColumns = defineModel<string[]>({ required: true });

defineSlots<{
  option: QSelectSlots['option'];
  'before-options': QSelectSlots['before-options'];
}>();

const { t } = useI18n();

function addColumn(name: string) {
  if (!visibleColumns.value.find((c) => c === name)) {
    visibleColumns.value = [...visibleColumns.value, name];
  }
}

const possibleOptions = computed(() => {
  return props.allColumns
    .filter((column) => !visibleColumns.value.find((vc) => vc === column.name))
    .map((column) => {
      return { label: column.label, value: column.name };
    });
});

const filteredOptions = ref(possibleOptions.value);

function filterOptions(
  searchValue: string,
  update: FilterSelectOptionsUpdateFn,
) {
  filterSelectOptions({
    searchValue,
    update,
    allOptions: possibleOptions.value,
    filteredOptions,
    valueExtractorFn: (item) => item.label,
  });
}

// close select when columns are changed
// e.g. by selecting columns of form (AnalyzeResultTableAddColumnsFromForm.vue)
const selectRef = ref<QSelect | null>(null);
watch(visibleColumns, () => selectRef.value?.hidePopup());

const { inputBgColor } = useInputBackground();
</script>
