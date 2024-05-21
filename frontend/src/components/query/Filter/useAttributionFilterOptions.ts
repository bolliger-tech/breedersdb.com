import { useQuery } from '@urql/vue';
import { graphql, type ResultOf } from 'src/graphql';
import { FilterRuleColumn } from './filterRuleColumn';
import { FilterRuleSchema, FilterRuleType } from './filterRuleTypes';

// warning about unused fields is wrong. ignore it.
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

export function useAttributionFilterOptions({
  tableLabel,
}: {
  tableLabel: string;
}) {
  return { fetchOptions: () => fetchOptions(tableLabel) };
}

async function fetchOptions(tableLabel: string) {
  const { data, fetching, error } = await useQuery({
    query,
  });

  const attributionOptions: FilterRuleColumn[] =
    data.value?.attributes.map((attribute) =>
      getFilterColumnFromAttribute(attribute as Attribute, tableLabel),
    ) || [];

  return { data: attributionOptions, fetching, error };
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

function getFilterRuleTypeFromDataType(dataType: string): FilterRuleType {
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

function getSchemaFromAttribute(attribute: Attribute): FilterRuleSchema {
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
