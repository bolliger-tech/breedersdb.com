import type { TFunc } from 'src/composables/useI18n';
import { type FilterRuleTypeSchema } from '../filterRule';
import { useCultivarColumns } from './useCultivarColumns';
import {
  computed,
  unref,
  type ComputedRef,
  type Ref,
  type MaybeRef,
} from 'vue';
import { useLotColumns } from './useLotColumns';
import { useTreeColumns } from './useTreeColumns';
import type { FilterRuleColumn } from '../filterRuleColumn';
import type { CombinedError } from '@urql/vue';
import { BaseTable } from '../filterNode';
import { useAttributionViewColumns } from './useAttributionViewColumns';

export function useColumnDefinitions({
  table,
}: {
  table: MaybeRef<BaseTable> | ComputedRef<BaseTable>;
}) {
  const entities: { [Property in BaseTable]: UseEntityColumns } = {
    [BaseTable.Lots]: useLotColumns(),
    [BaseTable.Cultivars]: useCultivarColumns(),
    [BaseTable.Trees]: useTreeColumns(),
    [BaseTable.Attributions]: useAttributionViewColumns(),
  };

  const entityColumns = computed(() => {
    return entities[unref(table)];
  });

  return entityColumns;
}

export type FilterColumnConstructorData = {
  table: string;
  column: string;
  labelKey: Parameters<TFunc>[0];
  schema: FilterRuleTypeSchema;
};

export type UseEntityColumns = {
  activate: () => void;
  data: ComputedRef<FilterRuleColumn[]>;
  fetching: Ref<boolean>;
  error: Ref<CombinedError | undefined>;
};
