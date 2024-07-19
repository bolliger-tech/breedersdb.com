import { useQuery } from '@urql/vue';
import { graphql, type ResultOf } from 'src/graphql';
import { FilterRuleColumn } from '../Filter/filterRuleColumn';
import { type FilterRuleSchema } from '../Filter/filterRule';
import { dataTypeToColumnTypes } from 'src/utils/attributeUtils';
import { computed, ref } from 'vue';
import { useI18n } from 'src/composables/useI18n';
import { useLocalizedSort } from 'src/composables/useLocalizedSort';
import { ColumnTypes } from 'src/utils/columnTypes';

const query = graphql(`
  query Attributes {
    attributes(where: { disabled: { _eq: false } }, order_by: { name: asc }) {
      id
      name
      validation_rule
      data_type
    }
  }
`);

type Attribute = Omit<
  ResultOf<typeof query>['attributes'][0],
  'validation_rule'
> & {
  validation_rule: {
    min: number;
    max: number;
    step: number;
  } | null;
};

export function useAttributesAsColumns() {
  const { t } = useI18n();
  const { localizedSortPredicate } = useLocalizedSort();
  const pause = ref(true);

  const { data, fetching, error, executeQuery } = useQuery({
    query,
    variables: undefined,
    pause,
  });

  const columns = computed(() => {
    if (error.value || !data.value) {
      return [];
    }

    const tableLabel = t('analyze.filter.attribute');

    return data.value.attributes
      .map((attribute) =>
        getFilterColumnFromAttribute(attribute as Attribute, tableLabel),
      )
      .sort((a, b) => localizedSortPredicate(a.label, b.label));
  });

  return {
    activate: () => {
      pause.value = false;
      executeQuery();
    },
    data: columns,
    fetching,
    error,
  };
}

function getFilterColumnFromAttribute(
  attribute: Attribute,
  tableLabel: string,
): FilterRuleColumn {
  return new FilterRuleColumn({
    tableName: 'attributes',
    tableColumnName: attribute.id.toString(),
    tableLabel: tableLabel,
    tableColumnLabel: attribute.name,
    schema: getSchemaFromAttribute(attribute),
  });
}

function getSchemaFromAttribute(attribute: Attribute): FilterRuleSchema {
  const type = dataTypeToColumnTypes(attribute.data_type);

  switch (type) {
    case ColumnTypes.String:
      return {
        type,
        allowEmpty: false,
        validation: {
          maxLen: 2047,
          pattern: null,
        },
      };
    case ColumnTypes.Integer:
    case ColumnTypes.Float:
      return {
        type,
        allowEmpty: false,
        validation: attribute.validation_rule as NonNullable<
          Attribute['validation_rule']
        >,
      };
    case ColumnTypes.Rating:
      return {
        type,
        allowEmpty: false,
        validation: {
          ...(attribute.validation_rule as NonNullable<
            Attribute['validation_rule']
          >),
          step: 1 as const,
        },
      };
    case ColumnTypes.Photo:
      return {
        type,
        allowEmpty: true,
      };
    case ColumnTypes.Enum:
      throw Error('Enum is not supported yet');
    default:
      return {
        type,
        allowEmpty: false,
      };
  }
}
