import { defineStore } from 'pinia';
import { FilterNode } from './Filter/filterNode';
import { LocalStorage } from 'quasar';
import { computed, ref } from 'vue';

const LOCAL_STORAGE_EXPLAIN_KEY = 'breedersdb-query-explain';

export const useQueryStore = defineStore('query', () => {
  const filterDragNode = ref<FilterNode | undefined>(undefined);

  const _explain = ref<boolean>(
    LocalStorage.getItem(LOCAL_STORAGE_EXPLAIN_KEY) ?? true,
  );
  const explain = computed({
    get: () => _explain.value,
    set: (value: boolean) => {
      _explain.value = value;
      LocalStorage.set(LOCAL_STORAGE_EXPLAIN_KEY, value);
    },
  });

  return {
    filterDragNode,
    explain,
  };
});
