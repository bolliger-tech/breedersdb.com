import { ref } from 'vue';
import type { FilterColumnConstructorData } from './useFilterColumns';

export function usePlantColumnDefinitions() {
  const data = ref<FilterColumnConstructorData[]>([]);
  const fetching = ref(false);
  const error = ref(undefined);

  return {
    activate: () => {
      throw new Error('Not implemented');
    },
    data,
    fetching,
    error,
  };
}
