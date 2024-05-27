import { computed, ref } from 'vue';
import type { FilterRuleColumn } from '../filterRuleColumn';

export function useLotColumns() {
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
