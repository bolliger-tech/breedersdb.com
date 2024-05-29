import { useQuery } from '@urql/vue';
import { graphql, type AttributeDataTypes, type ResultOf } from 'src/graphql';
import { FilterRuleColumn } from '../Filter/filterRuleColumn';
import {
  FilterRuleType,
  type FilterRuleTypeSchema,
} from '../Filter/filterRule';
import { computed, ref } from 'vue';
import { useI18n } from 'src/composables/useI18n';
import { useLocalizedSort } from 'src/composables/useLocalizedSort';

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

  const { data, fetching, error } = useQuery({
    query,
    variables: undefined,
    pause,
  });

  const columns = computed(() => {
    if (error.value || !data.value) {
      return [];
    }

    const tableLabel = t('filter.attribute');

    return data.value.attributes
      .map((attribute) =>
        getFilterColumnFromAttribute(attribute as Attribute, tableLabel),
      )
      .sort((a, b) => localizedSortPredicate(a.label, b.label));
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

function getFilterRuleTypeFromDataType(
  dataType: AttributeDataTypes,
): FilterRuleType {
  const type = {
    TEXT: FilterRuleType.String,
    INTEGER: FilterRuleType.Integer,
    FLOAT: FilterRuleType.Float,
    BOOLEAN: FilterRuleType.Boolean,
    DATE: FilterRuleType.Date,
    PHOTO: FilterRuleType.Photo,
  }[dataType];

  if (typeof type === 'undefined') {
    throw Error(`Unknown attribute.data_type: ${dataType}`);
  }

  return type;
}

function getSchemaFromAttribute(attribute: Attribute): FilterRuleTypeSchema {
  const type = getFilterRuleTypeFromDataType(attribute.data_type);

  switch (type) {
    case FilterRuleType.String:
      return {
        type,
        allowEmpty: false,
        validation: {
          maxLen: 2047,
          pattern: null,
        },
      };
    case FilterRuleType.Integer:
    case FilterRuleType.Float:
      return {
        type,
        allowEmpty: false,
        validation: attribute.validation_rule as NonNullable<
          Attribute['validation_rule']
        >,
      };
    case FilterRuleType.Photo:
      return {
        type,
        allowEmpty: true,
      };
    case FilterRuleType.Enum:
      throw Error('Enum is not supported yet');
    default:
      return {
        type,
        allowEmpty: false,
      };
  }
}
