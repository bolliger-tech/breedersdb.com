import { computed, ref } from 'vue';
import { FilterRuleColumn } from '../filterRuleColumn';
import { graphql } from 'src/graphql';
import { useI18n } from 'src/composables/useI18n';
import { useQuery } from '@urql/vue';
import { uppercaseFirstLetter } from 'src/utils/stringUtils';
import type { FilterColumnConstructorData } from './useColumnDefinitions';
import { FilterRuleType } from '../filterRule';
import { BaseTable } from '../queryTypes';
import { useEntityName } from 'src/composables/useEntityName';

const cultivarsQuery = graphql(`
  query Cultivars {
    cultivars(order_by: { name: asc }) {
      id
      name
    }
  }
`);

export function useCrossingColumns() {
  const { t } = useI18n();
  const { getEntityName } = useEntityName();
  const pause = ref(true);

  const { data, fetching, error } = useQuery({
    query: cultivarsQuery,
    variables: undefined,
    pause,
  });

  const columns = computed(() => {
    if (error.value || !data.value) {
      return [];
    }

    const cultivarNames = data.value.cultivars.map((a) => a.name);
    const columnData = getColumnConstrutorData(cultivarNames);
    const tableLabel = getEntityName({
      table: BaseTable.Crossings,
      capitalize: true,
    });

    return columnData.map((data) => {
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
    activate: () => {
      pause.value = false;
    },
    data: columns,
    fetching,
    error,
  };
}

function getColumnConstrutorData(
  cultivarNames: string[],
): FilterColumnConstructorData[] {
  return [
    {
      table: 'crossings',
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
      table: 'crossings',
      column: 'name',
      labelKey: 'entity.name',
      schema: {
        type: FilterRuleType.String,
        allowEmpty: false,
        validation: {
          maxLen: 8,
          pattern: null,
        },
      },
    },
    {
      table: 'crossings.mother_cultivar',
      column: 'name',
      labelKey: 'crossings.columns.motherCultivar',
      schema: {
        type: FilterRuleType.Enum,
        allowEmpty: false,
        validation: {
          options: cultivarNames,
        },
      },
    },
    {
      table: 'crossings.father_cultivar',
      column: 'name',
      labelKey: 'crossings.columns.fatherCultivar',
      schema: {
        type: FilterRuleType.Enum,
        allowEmpty: true,
        validation: {
          options: cultivarNames,
        },
      },
    },
    {
      table: 'crossings',
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
      table: 'crossings',
      column: 'created',
      labelKey: 'entity.created',
      schema: {
        type: FilterRuleType.DateTime,
        allowEmpty: true,
      },
    },
  ];
}
