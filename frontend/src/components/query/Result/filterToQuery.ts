import type { BaseTable, FilterNode } from '../Filter/filterNode';
import {
  FilterRuleOperator,
  FilterOperatorValue,
} from '../Filter/filterRuleOperator';
import type { FilterRule } from '../Filter/filterRule';
import { ColumnType } from 'src/components/Query/ColumnDefinitions/columnTypes';
import type { FilterRuleTerm } from '../Filter/filterRuleTerm';
import { toPascalCase, toSnakeCase } from 'src/utils/stringUtils';
import type { AttributeDataTypes } from 'src/graphql';

export type QueryResult = {
  [K in BaseTable]: (
    | { [key: string]: null | number | string }
    | { [key: `attributes__${number}`]: QueryAttributionsViewFields[] }
  )[];
} & { [K in `${BaseTable}_aggregate`]: { aggregate: { count: number } } };

export type QueryResultPagination = {
  sortBy?: string | null | undefined;
  descending?: boolean | undefined;
  page?: number | undefined;
  rowsPerPage?: number | undefined;
};

const DEFAULT_PAGE_SIZE = 100;

let varCounter = 0;

export function filterToQuery({
  filter,
  columns,
  pagination,
}: {
  filter: FilterNode;
  columns: string[];
  pagination: QueryResultPagination;
}) {
  const where = filterToWhere(filter);
  const inputVarDefs =
    where.variables.length > 0
      ? `( ${where.variables.map((v) => `$${v.name}: ${v.type}!`).join(', ')} )`
      : '';

  const baseTable = filter.getBaseTable();
  const paginationString = toPaginationString({
    baseTable,
    pagination,
    columns,
  });
  const fields = columnsToFields({ columns, baseTable, indent: 4 });

  const q = `
query ${toPascalCase(baseTable)}FilterResults${inputVarDefs} {
  ${toSnakeCase(baseTable)}(where: ${where.conditions}, ${paginationString}) {
    ${fields.trim()}
  }
  ${toSnakeCase(baseTable)}_aggregate(where: ${where.conditions}) {
    aggregate {
      count
    }
  }
}

${attributeFragment}
`;

  return {
    query: q,
    variables: Object.fromEntries(
      where.variables.map((v) => [v.name, v.value]),
    ),
  };
}

function toPaginationString({
  baseTable,
  pagination,
  columns,
}: {
  baseTable: BaseTable;
  pagination: QueryResultPagination;
  columns: string[];
}) {
  const limit = pagination.rowsPerPage || DEFAULT_PAGE_SIZE;
  const page = pagination.page || 1; // 1 indexed
  const offset = (page - 1) * limit;

  const order = pagination.descending ? 'desc' : 'asc';
  const orderByColumn = pagination.sortBy || columns[0] || 'id';
  const orderBy = orderByColumn
    .replace(`${baseTable}.`, '')
    .split('.')
    .reduceRight((acc, column) => `{ ${column}: ${acc} }`, order);

  return `limit: ${limit}, offset: ${offset}, order_by: ${orderBy}`;
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
  const table = rule.tableName;
  const field = rule.columnName;
  const dataType = rule.type;
  const operator = rule.operator;

  if (!(table && field && dataType && operator && rule.isValid)) {
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

  let criterion: GraphQLWhereArgs;

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
      criterion = {
        conditions: `{ _or: [ ${attributionCondition}, ${noAttributionsCondition} ] }`,
        variables: [comparison.variable],
      };
    } else {
      criterion = {
        conditions: attributionCondition,
        variables: [comparison.variable],
      };
    }
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
      criterion = {
        conditions,
        variables: [],
      };
    } else {
      // otherwise
      criterion = {
        conditions: `{ ${field}: { ${comparison.operator}: $${comparison.variable.name} } }`,
        variables: [comparison.variable],
      };
    }
  }

  // if table is nested
  if (table.includes('.')) {
    const tables = table.split('.');
    tables.shift(); // remove base table
    criterion.conditions = tables.reduceRight(
      (acc, t) => `{ ${t}: ${acc} }`,
      criterion.conditions,
    );
  }

  if (comparison.negate) {
    // apply negation to the whole criterion so nested tables without relation
    // work as expected. e.g.
    // - `tree.row.name is null` will also return trees without a row
    // - `tree.row.name starts not with Z` will also return trees without a row
    criterion.conditions = `{ _not: ${criterion.conditions} }`;
  }

  return criterion;
}

function toComparison({
  operator,
  term,
  type: filterRuleType,
}: {
  operator: FilterRuleOperator;
  term?: FilterRuleTerm;
  type: ColumnType;
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
        negate: false,
      };
    case FilterOperatorValue.NotEqual:
      return {
        operator: GraphQLComparisonOperator.Eq,
        variable: { name, type, value },
        negate: true,
      };
    case FilterOperatorValue.Less:
      return {
        operator: GraphQLComparisonOperator.Lt,
        variable: { name, type, value },
        negate: false,
      };
    case FilterOperatorValue.LessOrEqual:
      return {
        operator: GraphQLComparisonOperator.Lte,
        variable: { name, type, value },
        negate: false,
      };
    case FilterOperatorValue.Greater:
      return {
        operator: GraphQLComparisonOperator.Gt,
        variable: { name, type, value },
        negate: false,
      };
    case FilterOperatorValue.GreaterOrEqual:
      return {
        operator: GraphQLComparisonOperator.Gte,
        variable: { name, type, value },
        negate: false,
      };
    case FilterOperatorValue.StartsWith:
      return {
        operator: GraphQLComparisonOperator.Ilike,
        variable: { name, type, value: `${value}%` },
        negate: false,
      };
    case FilterOperatorValue.StartsNotWith:
      return {
        operator: GraphQLComparisonOperator.Ilike,
        variable: { name, type, value: `${value}%` },
        negate: true,
      };
    case FilterOperatorValue.Contains:
      return {
        operator: GraphQLComparisonOperator.Ilike,
        variable: { name, type, value: `%${value}%` },
        negate: false,
      };
    case FilterOperatorValue.NotContains:
      return {
        operator: GraphQLComparisonOperator.Ilike,
        variable: { name, type, value: `%${value}%` },
        negate: true,
      };
    case FilterOperatorValue.EndsWith:
      return {
        operator: GraphQLComparisonOperator.Ilike,
        variable: { name, type, value: `%${value}` },
        negate: false,
      };
    case FilterOperatorValue.NotEndsWith:
      return {
        operator: GraphQLComparisonOperator.Ilike,
        variable: { name, type, value: `%${value}` },
        negate: true,
      };
    case FilterOperatorValue.Empty:
      // becuase it it easier to implement on nested tables
      // we use double negation. see ruleToCriterion()
      return {
        operator: GraphQLComparisonOperator.IsNull,
        variable: { name, type: 'Boolean', value: false },
        negate: true,
      };
    case FilterOperatorValue.NotEmpty:
      // becuase it it easier to implement on nested tables
      // we use double negation. see ruleToCriterion()
      return {
        operator: GraphQLComparisonOperator.IsNull,
        variable: { name, type: 'Boolean', value: false },
        negate: false,
      };
    case FilterOperatorValue.True:
      return {
        operator: GraphQLComparisonOperator.Eq,
        variable: { name, type: 'Boolean', value: true },
        negate: false,
      };
    case FilterOperatorValue.False:
      return {
        operator: GraphQLComparisonOperator.Eq,
        variable: { name, type: 'Boolean', value: true },
        negate: true,
      };
    default:
      throw new Error(`Unknown operator: ${operator.value}`);
  }
}

function cast({ term, type }: { term?: FilterRuleTerm; type: ColumnType }) {
  switch (type) {
    case ColumnType.String:
      return term?.value || '';
    case ColumnType.Integer:
      return term ? parseInt(term.value) : NaN;
    case ColumnType.Float:
      return term ? parseFloat(term.value) : NaN;
    case ColumnType.Boolean:
      return String(term?.value).toLowerCase() === 'true';
    case ColumnType.Enum:
      return term?.value || '';
    case ColumnType.Date:
      if (!term) return undefined;
      return new Date(term.value).toISOString().split('T')[0];
    case ColumnType.DateTime:
      if (!term) return undefined;
      return new Date(term.value).toISOString();
    case ColumnType.Time:
      // TODO: handle time
      throw new Error('Not implemented');
    case ColumnType.Photo:
      return true;
    default:
      throw new Error(`Unknown type: ${type}`);
  }
}

function filterRuleTypeToGraphQLType(type: ColumnType) {
  switch (type) {
    case ColumnType.String:
      return 'String';
    case ColumnType.Integer:
      return 'Int';
    case ColumnType.Float:
      return 'float8';
    case ColumnType.Boolean:
      return 'Boolean';
    case ColumnType.Enum:
      return 'String';
    case ColumnType.Date:
      return 'date';
    case ColumnType.DateTime:
      return 'timestamptz';
    case ColumnType.Time:
      throw new Error('Not implemented');
    case ColumnType.Photo:
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
  const attributeDataType = rule.type || ColumnType.String;
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

function columnsToFields({
  columns,
  baseTable,
  indent,
}: {
  columns: string[];
  baseTable: BaseTable | string;
  indent: number;
}) {
  let fields = '';
  const indentation = ' '.repeat(indent);

  const baseColumns = columns.filter((column) =>
    column.startsWith(`${baseTable}.`),
  );

  if (!baseColumns.find((column) => column === `${baseTable}.id`)) {
    fields += `${indentation}id\n`;
  }

  // un-nested columns. e.g. `trees.id`
  baseColumns
    .filter((column) => column.split('.').length === 2)
    .forEach((column) => {
      const field = column.split('.')[1];
      fields += `${indentation}${toSnakeCase(field)}\n`;
    });

  // nested columns. e.g. `trees.rows.name`
  baseColumns
    .filter((column) => column.split('.').length > 2)
    .forEach((column) => {
      const segments = column.split('.');
      const field = segments.pop();
      segments.shift(); // remove base table
      const tables = segments;

      if (!field || !tables.length) {
        throw new Error(
          `Invalid column. At least 3 segments expected: ${column}`,
        );
      }

      // replace dots with double underscores for graphql compatibility
      // e.g. trees.rows.name -> trees__rows__name
      const alias = column.replaceAll('.', '__');

      const query = tables.reduceRight(
        (acc, table) => `${toSnakeCase(table)} { ${acc} }`,
        toSnakeCase(field),
      );

      fields += `${indentation}${alias}: ${query}`;
    });

  // const nestedTables = baseColumns
  //   .filter((column) => column.split('.').length > 2)
  //   .reduce(
  //     (acc, column) => {
  //       const table = column.split('.')[1];
  //       const field = column.replace(`${baseTable}.${table}.`, '');
  //       if (!acc[table]) {
  //         acc[table] = [];
  //       }
  //       acc[table].push(field);
  //       return acc;
  //     },
  //     {} as { [key: string]: string[] },
  //   );

  // Object.entries(nestedTables).forEach(([nestedTable, nestedColumns]) => {
  //   fields += `${indentation}${nestedTable} {\n  ${columnsToFields({ columns: nestedColumns, baseTable: nestedTable, indent: indent + 2 })}\n}`;
  // });

  // attributes
  columns
    .filter((column) => column.startsWith('attributes.'))
    .map((column) => column.split('.')[1])
    .forEach((attributeId) => {
      fields += `
${indentation}attributes__${attributeId}: attributions_views(where: { attribute_id: { _eq: ${attributeId} } }, order_by: { date_attributed: desc }) {
${indentation}  ...AttributeFragment
${indentation}}
`;
    });

  return fields;
}

// IMPORTANT: adapt type `QueryAttributionsViewFields` if changing fragment
const attributeFragment = `
fragment AttributeFragment on attributions_view {
  id
  integer_value
  float_value
  text_value
  boolean_value
  date_value
  tree_id
  cultivar_id
  lot_id
  data_type
}
`;

export type QueryAttributionsViewFields = {
  id: number;
  integer_value: number | null;
  float_value: number | null;
  text_value: string | null;
  boolean_value: boolean | null;
  date_value: string | null;
  tree_id: number | null;
  cultivar_id: number | null;
  lot_id: number | null;
  data_type: AttributeDataTypes;
};

type QueryVariable = {
  name: string;
  type: ReturnType<typeof filterRuleTypeToGraphQLType>; // GraphQL type
  value: string | number | boolean;
};
type Comparison = {
  operator: GraphQLComparisonOperator;
  variable: QueryVariable;
  negate: boolean;
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
