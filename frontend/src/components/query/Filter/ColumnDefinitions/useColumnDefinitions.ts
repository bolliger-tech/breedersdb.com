import { BaseTable } from 'src/components/Query/queryTypes';
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

export function useColumnDefinitions({
  currentEntity,
}: {
  currentEntity: MaybeRef<BaseTable | null> | ComputedRef<BaseTable | null>;
}) {
  const entities: { [Property in BaseTable]: UseEntityColumns } = {
    [BaseTable.Lots]: useLotColumns(),
    [BaseTable.Cultivars]: useCultivarColumns(),
    [BaseTable.Trees]: useTreeColumns(),
  };

  const entityColumns = computed(() => {
    const entity = unref(currentEntity);
    if (!entity) {
      return undefined;
    }

    return entities[entity];
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
