import type { FilterNode } from '../Filter/filterNode';
import {
  FilterRuleOperator,
  FilterOperatorValue,
} from '../Filter/filterRuleOperator';
import type { FilterRule } from '../Filter/filterRule';
import { FilterRuleType } from '../Filter/filterRule';
import type { FilterRuleTerm } from '../Filter/filterRuleTerm';
import type { BaseTable } from '../Filter/queryTypes';

type QueryVariable = {
  name: string;
  type: ReturnType<typeof filterRuleTypeToGraphQLType>; // GraphQL type
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
  const conjunction =
    filter.getChildrensConjunction() === 'and' ? '_and' : '_or';

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
    conditions: `{ ${conjunction}: [ ${termString} ] }`,
    variables: term.map((c) => c.variables).flat(),
  };
}

function ruleToCriterion(rule: FilterRule): GraphQLWhereArgs | undefined {
  const field = rule.columnName;
  const dataType = rule.type;
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
    if (rule.canBeNullOrEmpty) {
      const empty =
        (rule.operator?.value === FilterOperatorValue.Equal &&
          rule.term?.value === '') ||
        rule.operator?.value === FilterOperatorValue.Empty;
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
  type: filterRuleType,
}: {
  operator: FilterRuleOperator;
  term?: FilterRuleTerm;
  type: FilterRuleType;
}): Comparison | undefined {
  const name = `v${varCounter++}`;
  const value = cast({ term, type: filterRuleType });
  const type = filterRuleTypeToGraphQLType(filterRuleType);

  if (undefined === value) {
    return;
  }

  switch (operator.value) {
    case FilterOperatorValue.Equal:
      return {
        operator: GraphQLComparisonOperator.Eq,
        variable: { name, type, value },
      };
    case FilterOperatorValue.NotEqual:
      return {
        operator: GraphQLComparisonOperator.Neq,
        variable: { name, type, value },
      };
    case FilterOperatorValue.Less:
      return {
        operator: GraphQLComparisonOperator.Lt,
        variable: { name, type, value },
      };
    case FilterOperatorValue.LessOrEqual:
      return {
        operator: GraphQLComparisonOperator.Lte,
        variable: { name, type, value },
      };
    case FilterOperatorValue.Greater:
      return {
        operator: GraphQLComparisonOperator.Gt,
        variable: { name, type, value },
      };
    case FilterOperatorValue.GreaterOrEqual:
      return {
        operator: GraphQLComparisonOperator.Gte,
        variable: { name, type, value },
      };
    case FilterOperatorValue.StartsWith:
      return {
        operator: GraphQLComparisonOperator.Ilike,
        variable: { name, type, value: `${value}%` },
      };
    case FilterOperatorValue.StartsNotWith:
      return {
        operator: GraphQLComparisonOperator.Nilike,
        variable: { name, type, value: `${value}%` },
      };
    case FilterOperatorValue.Contains:
      return {
        operator: GraphQLComparisonOperator.Ilike,
        variable: { name, type, value: `%${value}%` },
      };
    case FilterOperatorValue.NotContains:
      return {
        operator: GraphQLComparisonOperator.Nilike,
        variable: { name, type, value: `%${value}%` },
      };
    case FilterOperatorValue.EndsWith:
      return {
        operator: GraphQLComparisonOperator.Ilike,
        variable: { name, type, value: `%${value}` },
      };
    case FilterOperatorValue.NotEndsWith:
      return {
        operator: GraphQLComparisonOperator.Nilike,
        variable: { name, type, value: `%${value}` },
      };
    case FilterOperatorValue.Empty:
      return {
        operator: GraphQLComparisonOperator.IsNull,
        variable: { name, type: 'Boolean', value: true },
      };
    case FilterOperatorValue.NotEmpty:
      return {
        operator: GraphQLComparisonOperator.IsNull,
        variable: { name, type: 'Boolean', value: false },
      };
    case FilterOperatorValue.True:
      return {
        operator: GraphQLComparisonOperator.Eq,
        variable: { name, type: 'Boolean', value: true },
      };
    case FilterOperatorValue.False:
      return {
        operator: GraphQLComparisonOperator.Eq,
        variable: { name, type: 'Boolean', value: false },
      };
    default:
      throw new Error(`Unknown operator: ${operator.value}`);
  }
}

function cast({ term, type }: { term?: FilterRuleTerm; type: FilterRuleType }) {
  switch (type) {
    case FilterRuleType.String:
      return term?.value || '';
    case FilterRuleType.Integer:
      return term ? parseInt(term.value) : NaN;
    case FilterRuleType.Float:
      return term ? parseFloat(term.value) : NaN;
    case FilterRuleType.Boolean:
      return String(term?.value).toLowerCase() === 'true';
    case FilterRuleType.Enum:
      // TODO: handle enum
      throw new Error('Not implemented');
    case FilterRuleType.Date:
      if (!term) return undefined;
      return new Date(term.value).toISOString().split('T')[0];
    case FilterRuleType.DateTime:
      if (!term) return undefined;
      return new Date(term.value).toISOString();
    case FilterRuleType.Time:
      // TODO: handle time
      throw new Error('Not implemented');
    case FilterRuleType.Photo:
      return true;
    default:
      throw new Error(`Unknown type: ${type}`);
  }
}

function filterRuleTypeToGraphQLType(type: FilterRuleType) {
  switch (type) {
    case FilterRuleType.String:
      return 'String';
    case FilterRuleType.Integer:
      return 'Int';
    case FilterRuleType.Float:
      return 'float8';
    case FilterRuleType.Boolean:
      return 'Boolean';
    case FilterRuleType.Enum:
      throw new Error('Not implemented');
    case FilterRuleType.Date:
      return 'date';
    case FilterRuleType.DateTime:
      return 'timestamptz';
    case FilterRuleType.Time:
      throw new Error('Not implemented');
    case FilterRuleType.Photo:
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
  const attributeDataType = rule.type || FilterRuleType.String;
  const graphQLDataType =
    comparison.operator === GraphQLComparisonOperator.IsNull
      ? filterRuleTypeToGraphQLType(attributeDataType)
      : comparison.variable.type;

  switch (graphQLDataType) {
    case 'String':
      if (rule.canBeNullOrEmpty) {
        const empty =
          (rule.operator?.value === FilterOperatorValue.Equal &&
            rule.term?.value === '') ||
          rule.operator?.value === FilterOperatorValue.Empty;
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
