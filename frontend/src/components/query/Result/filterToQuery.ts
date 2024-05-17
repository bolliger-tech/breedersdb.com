import type { FilterNode } from '../Filter/filterNode';
import { PropertySchemaOptionType } from '../Filter/filterOptionSchema';
import type { FilterRule } from '../Filter/filterRule';
import {
  type FilterComparatorOption,
  type FilterCriteria,
  FilterComparator,
} from '../Filter/filterTypes';
import type { BaseTable } from '../Filter/query';

type QueryVariable = {
  name: string;
  type: ReturnType<typeof propertySchemaOptionTypeToGraphQLType>; // GraphQL type
  value: string | number | boolean; // TODO: handle other types
};
type Comparison = {
  operator: GraphQLComparisonOperator;
  variable: QueryVariable;
};
type GraphQLWhereArgs = { conditions: string; variables: QueryVariable[] };

enum GraphQLComparisonOperator {
  Eq = '_eq',
  Neq = '_neq',
  Lt = '_lt',
  Lte = '_lte',
  Gt = '_gt',
  Gte = '_gte',
  Ilike = '_ilike',
  Nilike = '_nilike',
  IsNull = '_is_null',
}

let varCounter = 0;

export function filterToQuery({
  filter,
  baseTable,
}: {
  filter: FilterNode;
  baseTable: BaseTable;
}) {
  const where = filterToWhere(filter);
  const inputVarDefs =
    where.variables.length > 0
      ? `( ${where.variables.map((v) => `$${v.name}: ${v.type}!`).join(', ')} )`
      : '';

  const q = `
  query ${toCamelCase(baseTable)}FilterResults${inputVarDefs} {
    ${toSnakeCase(baseTable)}(where: ${where.conditions}) {
      id
      name
    }
  }
`;
  return {
    query: q,
    variables: Object.fromEntries(
      where.variables.map((v) => [v.name, v.value]),
    ),
  };
}

function filterToWhere(filter: FilterNode): GraphQLWhereArgs {
  const operand = filter.getChildrensOperand() === 'and' ? '_and' : '_or';

  const criteria = filter
    .getChildren()
    .map((node) => {
      const rule = node.getFilterRule();
      if (rule) {
        return ruleToCriterion(rule);
      }

      if (node.hasChildren()) {
        return filterToWhere(node);
      }
    })
    .filter(Boolean) as GraphQLWhereArgs[];

  const criteriaString = criteria.map((c) => c.conditions).join(', ');

  return {
    conditions: `{ ${operand}: [ ${criteriaString} ] }`,
    variables: criteria.map((c) => c.variables).flat(),
  };
}

function ruleToCriterion(rule: FilterRule): GraphQLWhereArgs | undefined {
  const field = rule.columnName;
  const dataType = rule.dataType;
  const comparator = rule.comparator;

  if (!(field && dataType && comparator && rule.isValid)) {
    return;
  }

  const comparison = toComparison({
    comparator,
    criteria: rule.criteria,
    type: dataType,
  });

  if (!comparison) {
    return;
  }

  if (rule.isAttribute) {
    const attributeId = parseInt(field);
    const attributeIdCondition = `{ attribute_id: { _eq: ${attributeId} } }`;
    const attributeValueCondition = toAttributeValueCondition({
      comparison,
      rule,
    });
    const attributionCondition = `{ attributions_views: { _and: [ ${attributeIdCondition}, ${attributeValueCondition} ] } }`;
    if (rule.includeEntitiesWithoutAttributions) {
      const noAttributionsCondition = `{ attributions_views_aggregate: { count: { predicate: { _eq: 0 }, filter: ${attributeIdCondition} } } }`;
      return {
        conditions: `{ _or: [ ${attributionCondition}, ${noAttributionsCondition} ] }`,
        variables: [comparison.variable],
      };
    }
    return {
      conditions: attributionCondition,
      variables: [comparison.variable],
    };
  } else {
    // if value can be null or empty string and it is one of both
    if (rule.compareNullAndEmpty) {
      const empty =
        (rule.comparator?.value === FilterComparator.Equal &&
          rule.criteria === '') ||
        rule.comparator?.value === FilterComparator.Empty;
      const conditions = empty
        ? `{ _or: [ { ${field}: { _is_null: true } }, { ${field}: { _eq: "" } } ] }`
        : `{ _and: [ { ${field}: { _is_null: false } }, { ${field}: { _neq: "" } } ] }`;
      return {
        conditions,
        variables: [],
      };
    }

    // otherwise
    return {
      conditions: `{ ${field}: { ${comparison.operator}: $${comparison.variable.name} } }`,
      variables: [comparison.variable],
    };
  }
}

function toComparison({
  comparator,
  criteria,
  type: propertySchemaOptionType,
}: {
  comparator: FilterComparatorOption;
  criteria?: FilterCriteria;
  type: PropertySchemaOptionType;
}): Comparison | undefined {
  const name = `v${varCounter++}`;
  const value = cast({ criteria, type: propertySchemaOptionType });
  const type = propertySchemaOptionTypeToGraphQLType(propertySchemaOptionType);

  if (undefined === value) {
    return;
  }

  switch (comparator.value) {
    case FilterComparator.Equal:
      return {
        operator: GraphQLComparisonOperator.Eq,
        variable: { name, type, value },
      };
    case FilterComparator.NotEqual:
      return {
        operator: GraphQLComparisonOperator.Neq,
        variable: { name, type, value },
      };
    case FilterComparator.Less:
      return {
        operator: GraphQLComparisonOperator.Lt,
        variable: { name, type, value },
      };
    case FilterComparator.LessOrEqual:
      return {
        operator: GraphQLComparisonOperator.Lte,
        variable: { name, type, value },
      };
    case FilterComparator.Greater:
      return {
        operator: GraphQLComparisonOperator.Gt,
        variable: { name, type, value },
      };
    case FilterComparator.GreaterOrEqual:
      return {
        operator: GraphQLComparisonOperator.Gte,
        variable: { name, type, value },
      };
    case FilterComparator.StartsWith:
      return {
        operator: GraphQLComparisonOperator.Ilike,
        variable: { name, type, value: `${value}%` },
      };
    case FilterComparator.StartsNotWith:
      return {
        operator: GraphQLComparisonOperator.Nilike,
        variable: { name, type, value: `${value}%` },
      };
    case FilterComparator.Contains:
      return {
        operator: GraphQLComparisonOperator.Ilike,
        variable: { name, type, value: `%${value}%` },
      };
    case FilterComparator.NotContains:
      return {
        operator: GraphQLComparisonOperator.Nilike,
        variable: { name, type, value: `%${value}%` },
      };
    case FilterComparator.EndsWith:
      return {
        operator: GraphQLComparisonOperator.Ilike,
        variable: { name, type, value: `%${value}` },
      };
    case FilterComparator.NotEndsWith:
      return {
        operator: GraphQLComparisonOperator.Nilike,
        variable: { name, type, value: `%${value}` },
      };
    case FilterComparator.Empty:
      return {
        operator: GraphQLComparisonOperator.IsNull,
        variable: { name, type: 'Boolean', value: true },
      };
    case FilterComparator.NotEmpty:
      return {
        operator: GraphQLComparisonOperator.IsNull,
        variable: { name, type: 'Boolean', value: false },
      };
    case FilterComparator.True:
      return {
        operator: GraphQLComparisonOperator.Eq,
        variable: { name, type: 'Boolean', value: true },
      };
    case FilterComparator.False:
      return {
        operator: GraphQLComparisonOperator.Eq,
        variable: { name, type: 'Boolean', value: false },
      };
    default:
      throw new Error(`Unknown comparator: ${comparator.value}`);
  }
}

function cast({
  criteria,
  type,
}: {
  criteria?: FilterCriteria;
  type: PropertySchemaOptionType;
}) {
  switch (type) {
    case PropertySchemaOptionType.String:
      return criteria?.toString() || '';
    case PropertySchemaOptionType.Integer:
      return criteria ? parseInt(criteria) : NaN;
    case PropertySchemaOptionType.Float:
      return criteria ? parseFloat(criteria) : NaN;
    case PropertySchemaOptionType.Boolean:
      return String(criteria).toLowerCase() === 'true';
    case PropertySchemaOptionType.Enum:
      // TODO: handle enum
      throw new Error('Not implemented');
    case PropertySchemaOptionType.Date:
      if (!criteria) return undefined;
      return new Date(criteria).toISOString().split('T')[0];
    case PropertySchemaOptionType.Datetime:
      if (!criteria) return undefined;
      return new Date(criteria).toISOString();
    case PropertySchemaOptionType.Time:
      // TODO: handle time
      throw new Error('Not implemented');
    case PropertySchemaOptionType.Photo:
      return true;
    default:
      throw new Error(`Unknown type: ${type}`);
  }
}

function propertySchemaOptionTypeToGraphQLType(type: PropertySchemaOptionType) {
  switch (type) {
    case PropertySchemaOptionType.String:
      return 'String';
    case PropertySchemaOptionType.Integer:
      return 'Int';
    case PropertySchemaOptionType.Float:
      return 'float8';
    case PropertySchemaOptionType.Boolean:
      return 'Boolean';
    case PropertySchemaOptionType.Enum:
      throw new Error('Not implemented');
    case PropertySchemaOptionType.Date:
      return 'date';
    case PropertySchemaOptionType.Datetime:
      return 'timestamptz';
    case PropertySchemaOptionType.Time:
      throw new Error('Not implemented');
    case PropertySchemaOptionType.Photo:
      return 'String';
    default:
      throw new Error(`Unknown type: ${type}`);
  }
}

function toAttributeValueCondition({
  comparison,
  rule,
}: {
  comparison: Comparison;
  rule: FilterRule;
}) {
  const attributeDataType = rule.dataType || PropertySchemaOptionType.String;
  const graphQLDataType =
    comparison.operator === GraphQLComparisonOperator.IsNull
      ? propertySchemaOptionTypeToGraphQLType(attributeDataType)
      : comparison.variable.type;

  switch (graphQLDataType) {
    case 'String':
      if (rule.compareNullAndEmpty) {
        const empty =
          (rule.comparator?.value === FilterComparator.Equal &&
            rule.criteria === '') ||
          rule.comparator?.value === FilterComparator.Empty;
        const textVar =
          comparison.variable.type === 'String'
            ? `$${comparison.variable.name}`
            : '""';
        const nullVar =
          comparison.variable.type === 'String'
            ? empty
            : `$${comparison.variable.name}`;
        return empty
          ? `{ _or: [ { text_value: { _is_null: ${nullVar} } }, { text_value: { _eq: ${textVar} } } ] }`
          : `{ _and: [ { text_value: { _is_null: ${nullVar} } }, { text_value: { _neq: ${textVar} } } ] }`;
      } else {
        // comparison is neither empty string nor null
        return `{ text_value: { ${comparison.operator}: $${comparison.variable.name} } }`;
      }
    case 'Int':
      return `{ integer_value: { ${comparison.operator}: $${comparison.variable.name} } }`;
    case 'float8':
      return `{ float_value: { ${comparison.operator}: $${comparison.variable.name} } }`;
    case 'Boolean':
      return `{ boolean_value: { ${comparison.operator}: $${comparison.variable.name} } }`;
    case 'date':
      return `{ date_value: { ${comparison.operator}: $${comparison.variable.name} } }`;
    default:
      throw new Error(`Unknown type: ${comparison.variable.type}`);
  }
}

function toSnakeCase(str: string) {
  return str.replace(/([a-z])([A-Z])/g, '$1_$2').toLowerCase();
}

function toCamelCase(str: string) {
  return str.replace(/([-_][a-z])/gi, ($1) =>
    $1.toUpperCase().replace('-', '').replace('_', ''),
  );
}
