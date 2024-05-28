import { FilterRuleType } from '../filterRule';
import type { FilterColumnConstructorData } from './useColumnDefinitions';
import { FilterRuleColumn } from '../filterRuleColumn';
import { uppercaseFirstLetter } from 'src/utils/stringUtils';
import { useI18n } from 'src/composables/useI18n';
import { computed, ref } from 'vue';
import { BaseTable } from '../filterNode';
import { useEntityName } from 'src/composables/useEntityName';

export function useAttributionViewColumns() {
  const { t } = useI18n();
  const { getEntityName } = useEntityName();

  const data = ref<FilterColumnConstructorData[] | undefined>(undefined);

  const columns = computed(() => {
    if (!data.value) {
      return [];
    }

    const tableLabel = getEntityName({
      table: BaseTable.Attributions,
      capitalize: true,
    });

    return data.value.map((data) => {
      return new FilterRuleColumn({
        tableName: data.table,
        tableColumnName: data.column,
        tableLabel,
        tableColumnLabel: uppercaseFirstLetter(t(data.labelKey)),
        schema: data.schema,
      });
    });
  });

  const fetching = ref(false);
  const error = ref(undefined);

  return {
    activate: () => {
      data.value = columnData;
    },
    data: columns,
    fetching,
    error,
  };
}

const columnData: FilterColumnConstructorData[] = [
  {
    table: 'attributions_view',
    column: 'id',
    labelKey: 'entity.id',
    schema: {
      type: FilterRuleType.Integer,
      allowEmpty: false,
      validation: {
        min: 1,
        max: Number.MAX_SAFE_INTEGER,
        step: 1,
      },
    },
  },
  {
    table: 'attributions_view',
    column: 'note',
    labelKey: 'entity.note',
    schema: {
      type: FilterRuleType.String,
      allowEmpty: true,
      validation: {
        maxLen: 2047,
        pattern: null,
      },
    },
  },
  {
    table: 'attributions_view',
    column: 'exceptional_attribution',
    labelKey: 'attributions.columns.exceptional_attribution',
    schema: {
      type: FilterRuleType.Boolean,
      allowEmpty: false,
    },
  },
];
