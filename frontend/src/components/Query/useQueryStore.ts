import { defineStore } from 'pinia';
import { FilterNode, BaseTable } from './Filter/filterNode';
import { LocalStorage } from 'quasar';
import { computed, ref } from 'vue';

export const useQueryStore = defineStore('query', () => {
  const baseFilter = ref<FilterNode | undefined>();
  const attributionFilter = ref<FilterNode | undefined>();

  const baseTable = computed(
    () => baseFilter.value?.getBaseTable() || BaseTable.Cultivars,
  );

  const filterDragNode = ref<FilterNode | undefined>(undefined);

  const _explainKey = computed(
    () => `breedersdb-query-explain--${baseTable.value}`,
  );
  const _explain = ref<boolean>(
    LocalStorage.getItem(_explainKey.value) ?? true,
  );
  const explain = computed({
    get: () => _explain.value,
    set: (value: boolean) => {
      _explain.value = value;
      LocalStorage.set(_explainKey.value, value);
    },
  });

  return {
    baseFilter,
    baseTable,
    attributionFilter,
    filterDragNode,
    explain,
  };
});
