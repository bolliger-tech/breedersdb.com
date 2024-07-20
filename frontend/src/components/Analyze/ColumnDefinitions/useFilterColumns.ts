import { useI18n, type TFunc } from 'src/composables/useI18n';
import { type FilterRuleSchema } from '../Filter/filterRule';
import { useCultivarColumnDefinitions } from './useCultivarColumnDefinitions';
import {
  computed,
  unref,
  type ComputedRef,
  type Ref,
  type MaybeRef,
} from 'vue';
import { useLotColumnDefinitions } from './useLotColumnDefinitions';
import { usePlantColumnDefinitions } from './usePlantColumnDefinitions';
import { FilterRuleColumn } from '../Filter/filterRuleColumn';
import type { CombinedError } from '@urql/vue';
import { BaseTable } from '../Filter/filterNode';
import { useAttributionViewColumnDefinitions } from './useAttributionViewColumnDefinitions';
import { useEntityName } from 'src/composables/useEntityName';
import { uppercaseFirstLetter } from 'src/utils/stringUtils';
import { useCrossingsColumnDefinitions } from './useCrossingsColumnDefinitions';
import { usePlantGroupsColumnDefinitions } from './usePlantGroupsColumnDefinitions';

export function useFilterColumns({
  table,
}: {
  table: MaybeRef<BaseTable> | ComputedRef<BaseTable>;
}) {
  const tableKey = unref(table);

  const entities: {
    [Property in BaseTable]: {
      activate: () => void;
      data:
        | ComputedRef<FilterColumnConstructorData[]>
        | Ref<FilterColumnConstructorData[]>;
      fetching: Ref<boolean>;
      error: Ref<CombinedError | undefined>;
    };
  } = {
    [BaseTable.Crossings]: useCrossingsColumnDefinitions(),
    [BaseTable.Lots]: useLotColumnDefinitions(),
    [BaseTable.Cultivars]: useCultivarColumnDefinitions(),
    [BaseTable.PlantGroups]: usePlantGroupsColumnDefinitions(),
    [BaseTable.Plants]: usePlantColumnDefinitions(),
    [BaseTable.Attributions]: useAttributionViewColumnDefinitions(),
  };

  const { getEntityName } = useEntityName();
  const { t } = useI18n();

  const data = computed(() => {
    const tableLabel = getEntityName({
      table: tableKey,
      capitalize: true,
    });

    return entities[tableKey].data.value.map((data) => {
      return new FilterRuleColumn({
        tableName: data.table,
        tableColumnName: data.column,
        tableLabel,
        tableColumnLabel: uppercaseFirstLetter(t(data.labelKey)),
        schema: data.schema,
      });
    });
  });

  return {
    loadData: () => {
      entities[tableKey].activate();
    },
    data,
    fetching: entities[tableKey].fetching,
    error: entities[tableKey].error,
  };
}

export type FilterColumnConstructorData = {
  table: string;
  column: string;
  labelKey: Parameters<TFunc>[0];
  schema: FilterRuleSchema;
};
