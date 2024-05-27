import { useQuery } from '@urql/vue';
import { FilterRuleType } from '../filterRule';
import type { FilterColumnConstructorData } from './useColumnDefinitions';
import { graphql } from 'src/graphql';
import { FilterRuleColumn } from '../filterRuleColumn';
import { uppercaseFirstLetter } from 'src/utils/stringUtils';
import { useI18n } from 'src/composables/useI18n';
import { computed, ref } from 'vue';

const query = graphql(`
  query Attributes {
    attributes(where: { disabled: { _eq: false } }, order_by: { name: asc }) {
      id
      name
    }
  }
`);

export function useAttributionViewColumns() {
  const { t } = useI18n();
  const pause = ref(true);

  const { data, fetching, error } = useQuery({
    query,
    variables: undefined,
    pause,
  });

  const columns = computed(() => {
    if (error.value || !data.value) {
      return [];
    }

    const attributeNames = data.value.attributes.map((a) => a.name);
    const columnData = getColumnConstrutorData(attributeNames);
    const tableLabel = t('filter.attribute');

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
  attributeNames: string[],
): FilterColumnConstructorData[] {
  return [
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
      column: 'attribute_name',
      labelKey: 'entity.name',
      schema: {
        type: FilterRuleType.Enum,
        allowEmpty: false,
        validation: {
          options: attributeNames,
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
}
