<template>
  <q-select
    :disable="possibleOptions.length === 0"
    :label="t('result.addColumn')"
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
    <template #option="{ opt, itemProps }">
      <q-item v-bind="itemProps">
        <q-item-section>
          <q-item-label class="row align-center no-wrap">
            <span class="text-muted"
              >{{ opt.label.split(' > ')[0] }}&nbsp;&nbsp;>&nbsp;&nbsp;</span
            >{{ opt.label.split(' > ')[1] }}
            <AggregationLabelChip
              v-if="opt.label.split(' > ').length > 2"
              class="q-ml-sm"
              >{{ opt.label.split(' > ')[2] }}</AggregationLabelChip
            >
          </q-item-label>
        </q-item-section>
      </q-item>
    </template>
  </q-select>
</template>
<script lang="ts" setup>
import { computed, ref } from 'vue';
import { QTableColumn } from 'quasar';
import { useI18n } from 'src/composables/useI18n';
import {
  FilterSelectOptionsUpdateFn,
  filterSelectOptions,
} from 'src/utils/selectOptionFilter';
import { useInputBackground } from 'src/composables/useInputBackground';
import AggregationLabelChip from 'src/components/Query/Result/AggregationLabelChip.vue';

export interface QueryResultTableColumnSelectorProps {
  allColumns: QTableColumn[];
}

const props = defineProps<QueryResultTableColumnSelectorProps>();
const visibleColumns = defineModel<string[]>({ required: true });

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
