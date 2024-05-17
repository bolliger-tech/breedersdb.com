import type { FilterNode } from '../Filter/filterNode';
import { AttributeSchemaOptionType } from '../Filter/filterOptionSchemaTypes';
import type { FilterRule } from '../Filter/filterRule';
import {
  type FilterOperatorOption,
  type FilterTerm,
  FilterOperator,
} from '../Filter/filterTypes';
import type { BaseTable } from '../Filter/queryTypes';

type QueryVariable = {
  name: string;
  type: ReturnType<typeof attributeSchemaOptionTypeToGraphQLType>; // GraphQL type
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

  const term = filter
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

  const termString = term.map((c) => c.conditions).join(', ');

  return {
    conditions: `{ ${operand}: [ ${termString} ] }`,
    variables: term.map((c) => c.variables).flat(),
  };
}

function ruleToCriterion(rule: FilterRule): GraphQLWhereArgs | undefined {
  const field = rule.columnName;
  const dataType = rule.dataType;
  const operator = rule.operator;

  if (!(field && dataType && operator && rule.isValid)) {
    return;
  }

  const comparison = toComparison({
    operator,
    term: rule.term,
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
        (rule.operator?.value === FilterOperator.Equal && rule.term === '') ||
        rule.operator?.value === FilterOperator.Empty;
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
  operator,
  term,
  type: attributeSchemaOptionType,
}: {
  operator: FilterOperatorOption;
  term?: FilterTerm;
  type: AttributeSchemaOptionType;
}): Comparison | undefined {
  const name = `v${varCounter++}`;
  const value = cast({ term, type: attributeSchemaOptionType });
  const type = attributeSchemaOptionTypeToGraphQLType(
    attributeSchemaOptionType,
  );

  if (undefined === value) {
    return;
  }

  switch (operator.value) {
    case FilterOperator.Equal:
      return {
        operator: GraphQLComparisonOperator.Eq,
        variable: { name, type, value },
      };
    case FilterOperator.NotEqual:
      return {
        operator: GraphQLComparisonOperator.Neq,
        variable: { name, type, value },
      };
    case FilterOperator.Less:
      return {
        operator: GraphQLComparisonOperator.Lt,
        variable: { name, type, value },
      };
    case FilterOperator.LessOrEqual:
      return {
        operator: GraphQLComparisonOperator.Lte,
        variable: { name, type, value },
      };
    case FilterOperator.Greater:
      return {
        operator: GraphQLComparisonOperator.Gt,
        variable: { name, type, value },
      };
    case FilterOperator.GreaterOrEqual:
      return {
        operator: GraphQLComparisonOperator.Gte,
        variable: { name, type, value },
      };
    case FilterOperator.StartsWith:
      return {
        operator: GraphQLComparisonOperator.Ilike,
        variable: { name, type, value: `${value}%` },
      };
    case FilterOperator.StartsNotWith:
      return {
        operator: GraphQLComparisonOperator.Nilike,
        variable: { name, type, value: `${value}%` },
      };
    case FilterOperator.Contains:
      return {
        operator: GraphQLComparisonOperator.Ilike,
        variable: { name, type, value: `%${value}%` },
      };
    case FilterOperator.NotContains:
      return {
        operator: GraphQLComparisonOperator.Nilike,
        variable: { name, type, value: `%${value}%` },
      };
    case FilterOperator.EndsWith:
      return {
        operator: GraphQLComparisonOperator.Ilike,
        variable: { name, type, value: `%${value}` },
      };
    case FilterOperator.NotEndsWith:
      return {
        operator: GraphQLComparisonOperator.Nilike,
        variable: { name, type, value: `%${value}` },
      };
    case FilterOperator.Empty:
      return {
        operator: GraphQLComparisonOperator.IsNull,
        variable: { name, type: 'Boolean', value: true },
      };
    case FilterOperator.NotEmpty:
      return {
        operator: GraphQLComparisonOperator.IsNull,
        variable: { name, type: 'Boolean', value: false },
      };
    case FilterOperator.True:
      return {
        operator: GraphQLComparisonOperator.Eq,
        variable: { name, type: 'Boolean', value: true },
      };
    case FilterOperator.False:
      return {
        operator: GraphQLComparisonOperator.Eq,
        variable: { name, type: 'Boolean', value: false },
      };
    default:
      throw new Error(`Unknown operator: ${operator.value}`);
  }
}

function cast({
  term,
  type,
}: {
  term?: FilterTerm;
  type: AttributeSchemaOptionType;
}) {
  switch (type) {
    case AttributeSchemaOptionType.String:
      return term?.toString() || '';
    case AttributeSchemaOptionType.Integer:
      return term ? parseInt(term) : NaN;
    case AttributeSchemaOptionType.Float:
      return term ? parseFloat(term) : NaN;
    case AttributeSchemaOptionType.Boolean:
      return String(term).toLowerCase() === 'true';
    case AttributeSchemaOptionType.Enum:
      // TODO: handle enum
      throw new Error('Not implemented');
    case AttributeSchemaOptionType.Date:
      if (!term) return undefined;
      return new Date(term).toISOString().split('T')[0];
    case AttributeSchemaOptionType.Datetime:
      if (!term) return undefined;
      return new Date(term).toISOString();
    case AttributeSchemaOptionType.Time:
      // TODO: handle time
      throw new Error('Not implemented');
    case AttributeSchemaOptionType.Photo:
      return true;
    default:
      throw new Error(`Unknown type: ${type}`);
  }
}

function attributeSchemaOptionTypeToGraphQLType(
  type: AttributeSchemaOptionType,
) {
  switch (type) {
    case AttributeSchemaOptionType.String:
      return 'String';
    case AttributeSchemaOptionType.Integer:
      return 'Int';
    case AttributeSchemaOptionType.Float:
      return 'float8';
    case AttributeSchemaOptionType.Boolean:
      return 'Boolean';
    case AttributeSchemaOptionType.Enum:
      throw new Error('Not implemented');
    case AttributeSchemaOptionType.Date:
      return 'date';
    case AttributeSchemaOptionType.Datetime:
      return 'timestamptz';
    case AttributeSchemaOptionType.Time:
      throw new Error('Not implemented');
    case AttributeSchemaOptionType.Photo:
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
  const attributeDataType = rule.dataType || AttributeSchemaOptionType.String;
  const graphQLDataType =
    comparison.operator === GraphQLComparisonOperator.IsNull
      ? attributeSchemaOptionTypeToGraphQLType(attributeDataType)
      : comparison.variable.type;

  switch (graphQLDataType) {
    case 'String':
      if (rule.compareNullAndEmpty) {
        const empty =
          (rule.operator?.value === FilterOperator.Equal && rule.term === '') ||
          rule.operator?.value === FilterOperator.Empty;
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
