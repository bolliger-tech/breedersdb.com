<template>
  <q-select
    :disable="possibleOptions.length === 0"
    :label="t('crud.list.addColumn')"
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
import { computed, ref } from 'vue';
import { QSelectSlots, QTableColumn } from 'quasar';
import { useI18n } from 'src/composables/useI18n';
import {
  FilterSelectOptionsUpdateFn,
  filterSelectOptions,
} from 'src/utils/selectOptionFilter';
import { useInputBackground } from 'src/composables/useInputBackground';

export interface CRUDListTableColumnSelectorProps
  extends CRUDListTableColumnSelectorPropsWithoutModel {
  visibleColumns: string[];
}

interface CRUDListTableColumnSelectorPropsWithoutModel {
  allColumns: QTableColumn[];
}

const props = defineProps<CRUDListTableColumnSelectorPropsWithoutModel>();
const visibleColumns = defineModel<string[]>({ required: true });

defineSlots<{
  option: QSelectSlots['option'];
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

function filterOptions(value: string, update: FilterSelectOptionsUpdateFn) {
  filterSelectOptions({
    value,
    update,
    allOptions: possibleOptions.value,
    filteredOptions,
    valueExtractorFn: (item) => item.label,
  });
}

const { inputBgColor } = useInputBackground();
</script>
