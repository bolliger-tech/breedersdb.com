import { computed, ref } from 'vue';
import type { FilterRuleColumn } from '../filterRuleColumn';

export function useTreeColumns() {
  throw new Error('Not implemented');
  const columns = computed<FilterRuleColumn[]>(() => []);

  const fetching = ref(false);
  const error = ref(undefined);

  return {
    activate: () => {},
    data: columns,
    fetching,
    error,
  };
}
