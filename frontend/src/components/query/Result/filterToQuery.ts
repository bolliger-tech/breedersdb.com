import { BaseTable, type FilterNode } from '../Filter/filterNode';
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
  baseFilter,
  attributionFilter,
  columns,
  pagination,
}: {
  baseFilter: FilterNode;
  attributionFilter: FilterNode;
  columns: string[];
  pagination: QueryResultPagination;
}) {
  const where = filterToWhere(baseFilter);
  const whereString =
    where.conditions.length > 0 ? `where: ${where.conditions}` : '';

  const baseTable = baseFilter.getBaseTable();
  const paginationString = toPaginationString({
    baseTable,
    pagination,
    columns,
  });

  const queryArgs = [whereString, paginationString].filter(Boolean).join(', ');
  const queryArgsString = queryArgs.length > 0 ? `(${queryArgs})` : '';
  const aggQueryArgsString =
    where.conditions.length > 0 ? `(where: ${where.conditions})` : '';

  const attributionWhere = filterToWhere(attributionFilter);
  const fields = columnsToFields({
    baseTable,
    columns,
    attributionWhere,
    indent: 4,
  });

  const inputVars = [...where.variables, ...attributionWhere.variables];
  const inputVarDefs =
    inputVars.length > 0
      ? `( ${inputVars.map((v) => `$${v.name}: ${v.type}!`).join(', ')} )`
      : '';

  const q = `
query ${toPascalCase(baseTable)}FilterResults${inputVarDefs} {
  ${toSnakeCase(baseTable)}${queryArgsString} {
    ${fields.trim()}
  }
  ${toSnakeCase(baseTable)}_aggregate${aggQueryArgsString} {
    aggregate {
      count
    }
  }
}

${attributionFragment}
`;

  return {
    query: q,
    variables: Object.fromEntries(inputVars.map((v) => [v.name, v.value])),
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
  if (baseTable === BaseTable.Attributions) {
    throw new Error('Pagination not supported for attributions');
  }

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

  const where = filter
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
    .filter((c) => c && c.conditions.length > 0) as GraphQLWhereArgs[];

  const whereString = where.map((c) => c.conditions).join(', ');

  return {
    conditions:
      whereString.length > 0 ? `{ ${conjunction}: [ ${whereString} ] }` : '',
    variables: where.map((c) => c.variables).flat(),
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
    comparison.negate = false; // negation is handled in toAttributeValueCondition
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
      const isEmpty =
        (rule.operator?.value === FilterOperatorValue.Equal &&
          rule.term?.value === '') ||
        rule.operator?.value === FilterOperatorValue.Empty;
      const emptyCondition = `{ _or: [ { ${field}: { _is_null: true } }, { ${field}: { _eq: "" } } ] }`;
      const notEmptyCondition = `{ _and: [ { ${field}: { _is_null: false } }, { ${field}: { _neq: "" } } ] }`;
      const conditions =
        isEmpty != comparison.negate ? emptyCondition : notEmptyCondition;
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
  type: columnType,
}: {
  operator: FilterRuleOperator;
  term?: FilterRuleTerm;
  type: ColumnType;
}): Comparison | undefined {
  const name = `v${varCounter++}`;
  const value = cast({ term, type: columnType });
  const type = columnTypeToGraphQLType(columnType);

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
      // becuase it it easier to implement on nested tables
      // we use double negation. see ruleToCriterion()
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
      // becuase it it easier to implement on nested tables
      // we use double negation. see ruleToCriterion()
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
      // becuase it it easier to implement on nested tables
      // we use double negation. see ruleToCriterion()
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
      // becuase it it easier to implement on nested tables
      // we use double negation. see ruleToCriterion()
      return {
        operator: GraphQLComparisonOperator.Ilike,
        variable: { name, type, value: `%${value}` },
        negate: true,
      };
    case FilterOperatorValue.Empty:
      // becuase it it easier to implement on nested tables
      // we use double negation. see ruleToCriterion()
      return columnType === ColumnType.String
        ? {
            operator: GraphQLComparisonOperator.Neq,
            variable: { name, type: 'String', value: '' },
            negate: true,
          }
        : {
            operator: GraphQLComparisonOperator.IsNull,
            variable: { name, type: 'Boolean', value: false },
            negate: true,
          };
    case FilterOperatorValue.NotEmpty:
      return columnType === ColumnType.String
        ? {
            operator: GraphQLComparisonOperator.Neq,
            variable: { name, type: 'String', value: '' },
            negate: false,
          }
        : {
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
      // becuase it it easier to implement on nested tables
      // we use double negation. see ruleToCriterion()
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

function columnTypeToGraphQLType(type: ColumnType) {
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
      ? columnTypeToGraphQLType(attributeDataType)
      : comparison.variable.type;

  if (comparison.negate)
    throw new Error('Negation not supported for attributes');

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
  baseTable,
  columns,
  attributionWhere,
  indent,
}: {
  baseTable: BaseTable | string;
  columns: string[];
  attributionWhere: GraphQLWhereArgs;
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
        (acc, table) => `${toSnakeCase(table)} { id ${acc} }`,
        toSnakeCase(field),
      );

      fields += `${indentation}${alias}: ${query}`;
    });

  // attributes
  columns
    .filter((column) => column.startsWith('attributes.'))
    .map((column) => column.split('.')[1])
    .forEach((attributeId) => {
      const filterConditions = attributionWhere.conditions
        ? `, ${attributionWhere.conditions}`
        : '';
      fields += `
${indentation}attributes__${attributeId}: attributions_views(where: { _and: [ { attribute_id: { _eq: ${attributeId} } }${filterConditions} ] }, order_by: { date_attributed: desc }) {
${indentation}  ...AttributionFragment
${indentation}}
`;
    });

  return fields;
}

// IMPORTANT: adapt type `QueryAttributionsViewFields` if changing fragment
const attributionFragment = `
fragment AttributionFragment on attributions_view {
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
  type: ReturnType<typeof columnTypeToGraphQLType>; // GraphQL type
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
