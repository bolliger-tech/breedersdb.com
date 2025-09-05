import {
  BaseTable,
  FilterConjunction,
  type FilterNode,
} from '../Filter/filterNode';
import type { FilterRuleOperator } from '../Filter/filterRuleOperator';
import { FilterOperatorValue } from '../Filter/filterRuleOperator';
import type { FilterRule } from '../Filter/filterRule';
import { ColumnTypes } from 'src/utils/columnTypes';
import type { FilterRuleTerm } from '../Filter/filterRuleTerm';
import { toPascalCase, toSnakeCase } from 'src/utils/stringUtils';
import type { AttributeDataTypes } from 'src/graphql';
import { singularize } from 'src/utils/stringUtils';

export type AnalyzeResultEntityField = null | number | string;

export type AnalyzeResultEntityRow = {
  [key: string]: AnalyzeResultEntityField;
} & { [key: `attributes__${number}`]: AnalyzeCachedAttributionsFields[] };

export type AnalyzeResult = {
  [K in BaseTable]: AnalyzeResultEntityRow[];
} & { [K in `${BaseTable}_aggregate`]: { aggregate: { count: number } } };

export type AnalyzeResultPagination = {
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
  pagination: AnalyzeResultPagination;
}) {
  const baseTable = baseFilter.getBaseTable();
  const where = filterToWhere(baseFilter);

  if (baseTable === BaseTable.Lots) {
    const conditions = [where.conditions, '{ is_variety: { _eq: false } }']
      .filter(Boolean)
      .join(', ');
    where.conditions = `{ _and: [ ${conditions} ] }`;
  }

  const whereString =
    where.conditions.length > 0 ? `where: ${where.conditions}` : '';

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

  const hasAttributionColumns = columns.some((column) =>
    column.startsWith('attributes.'),
  );
  const inputVars = hasAttributionColumns
    ? [...where.variables, ...attributionWhere.variables] // only add attribution variables if there are attribution columns, else we get an unexpected variables error
    : where.variables;
  inputVars.push({
    name: 'limit',
    type: 'Int',
    value: pagination.rowsPerPage || DEFAULT_PAGE_SIZE,
  });
  inputVars.push({
    name: 'offset',
    type: 'Int',
    value: pagination.page
      ? (pagination.page - 1) * (pagination.rowsPerPage || DEFAULT_PAGE_SIZE)
      : 0,
  });
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
  pagination: AnalyzeResultPagination;
  columns: string[];
}) {
  if (baseTable === BaseTable.Attributions) {
    throw new Error('Pagination not supported for attributions');
  }

  const order = pagination.descending ? 'desc' : 'asc';
  const orderByPath = pagination.sortBy || columns[0] || 'id';
  const orderByColumn = orderByPath.split('.').pop();
  const orderByUnstable = orderByPath
    .replace(`${baseTable}.`, '') // remove base table
    .split('.')
    .slice(0, -1) // remove column
    .map((table) => singularize(toSnakeCase(table)))
    .reduceRight(
      (acc, column) => `{ ${column}: ${acc} }`,
      `{ ${orderByColumn}: ${order} }`,
    );
  // append `{ id: asc }` as additional criteria to ensure stable ordering
  const orderBy =
    orderByUnstable === '{ id: asc }' || orderByUnstable === '{ id: desc }'
      ? orderByUnstable
      : `[ ${orderByUnstable}, { id: asc } ]`;

  return `limit: $limit, offset: $offset, order_by: ${orderBy}`;
}

function filterToWhere(filter: FilterNode): GraphQLWhereArgs {
  const conjunction =
    filter.getChildrensConjunction() === FilterConjunction.And ? '_and' : '_or';

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
    const attributionValueCondition = toAttributionValueCondition({
      comparison,
      rule,
    });
    comparison.negate = false; // negation was handled in toAttributionValueCondition
    const attributionCondition = `{ cached_attributions: { _and: [ ${attributeIdCondition}, ${attributionValueCondition} ] } }`;
    if (rule.includeEntitiesWithoutAttributions) {
      const noAttributionsCondition = `{ cached_attributions_aggregate: { count: { predicate: { _eq: 0 }, filter: ${attributeIdCondition} } } }`;
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
      (acc, t) => `{ ${singularize(t)}: ${acc} }`,
      criterion.conditions,
    );
  }

  if (comparison.negate) {
    // apply negation to the whole criterion so nested tables without relation
    // work as expected. e.g.
    // - `plant.plant_rows.name is null` will also return plants without a row
    // - `plant.plant_rows.name starts not with Z` will also return plants without a row
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
  term?: FilterRuleTerm | undefined;
  type: ColumnTypes;
}): Comparison | undefined {
  const name = `v${varCounter++}`;
  const value = cast({ term, type: columnType });
  const type = columnTypeToGraphQLType(columnType);

  const textType =
    columnType === ColumnTypes.String
      ? 'String'
      : columnType === ColumnTypes.Citext
        ? 'citext'
        : undefined;

  switch (operator.value) {
    case FilterOperatorValue.Equal:
      if (value === undefined) return;
      if (typeof value === 'number' && isNaN(value))
        // Integer, Rating, Float, Date, DateTime field with value ''
        return {
          // becuase it it easier to implement on nested tables
          // we use double negation. see ruleToCriterion()
          operator: GraphQLComparisonOperator.IsNull,
          variable: { name, type: 'Boolean', value: false },
          negate: true,
        };
      return {
        operator: GraphQLComparisonOperator.Eq,
        variable: { name, type, value },
        negate: false,
      };
    case FilterOperatorValue.NotEqual:
      if (value === undefined) return;
      if (typeof value === 'number' && isNaN(value))
        // Integer, Rating, Float, Date, DateTime field with value ''
        return {
          operator: GraphQLComparisonOperator.IsNull,
          variable: { name, type: 'Boolean', value: false },
          negate: false,
        };
      // becuase it it easier to implement on nested tables
      // we use double negation. see ruleToCriterion()
      return {
        operator: GraphQLComparisonOperator.Eq,
        variable: { name, type, value },
        negate: true,
      };
    case FilterOperatorValue.Less:
      if (value === undefined) return;
      return {
        operator: GraphQLComparisonOperator.Lt,
        variable: { name, type, value },
        negate: false,
      };
    case FilterOperatorValue.LessOrEqual:
      if (value === undefined) return;
      return {
        operator: GraphQLComparisonOperator.Lte,
        variable: { name, type, value },
        negate: false,
      };
    case FilterOperatorValue.Greater:
      if (value === undefined) return;
      return {
        operator: GraphQLComparisonOperator.Gt,
        variable: { name, type, value },
        negate: false,
      };
    case FilterOperatorValue.GreaterOrEqual:
      if (value === undefined) return;
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
      return textType
        ? {
            operator: GraphQLComparisonOperator.Neq,
            variable: { name, type: textType, value: '' },
            negate: true,
          }
        : {
            operator: GraphQLComparisonOperator.IsNull,
            variable: { name, type: 'Boolean', value: false },
            negate: true,
          };
    case FilterOperatorValue.NotEmpty:
      return textType
        ? {
            operator: GraphQLComparisonOperator.Neq,
            variable: { name, type: textType, value: '' },
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
      // eslint-disable-next-line @typescript-eslint/restrict-template-expressions
      throw new Error(`Unknown operator: ${operator.value}`);
  }
}

function cast({
  term,
  type,
}: {
  term?: FilterRuleTerm | undefined;
  type: ColumnTypes;
}) {
  switch (type) {
    case ColumnTypes.String:
    case ColumnTypes.Citext:
      return term?.value || '';
    case ColumnTypes.Integer:
      return term ? parseInt(term.value) : NaN;
    case ColumnTypes.Rating:
      return term ? parseInt(term.value) : NaN;
    case ColumnTypes.Float:
      return term ? parseFloat(term.value) : NaN;
    case ColumnTypes.Boolean:
      return String(term?.value).toLowerCase() === 'true';
    case ColumnTypes.Enum:
      return term?.value || '';
    case ColumnTypes.Date: {
      if (!term) return undefined;
      const date = new Date(term.value);
      return isNaN(date.getTime()) ? NaN : date.toISOString().split('T')[0];
    }
    case ColumnTypes.DateTime: {
      if (!term) return undefined;
      const datetime = new Date(term.value);
      return isNaN(datetime.getTime()) ? NaN : datetime.toISOString();
    }
    case ColumnTypes.Time:
      // TODO: handle time
      throw new Error('Not implemented');
    case ColumnTypes.Photo:
      return true;
    default:
      // eslint-disable-next-line @typescript-eslint/restrict-template-expressions
      throw new Error(`Unknown type: ${type}`);
  }
}

function columnTypeToGraphQLType(type: ColumnTypes) {
  switch (type) {
    case ColumnTypes.String:
      return 'String';
    case ColumnTypes.Citext:
      return 'citext';
    case ColumnTypes.Integer:
    case ColumnTypes.Rating:
      return 'Int';
    case ColumnTypes.Float:
      return 'float8';
    case ColumnTypes.Boolean:
      return 'Boolean';
    case ColumnTypes.Enum:
      return 'String';
    case ColumnTypes.Date:
      return 'date';
    case ColumnTypes.DateTime:
      return 'timestamptz';
    case ColumnTypes.Time:
      throw new Error('Not implemented');
    case ColumnTypes.Photo:
      return 'String';
    default:
      // eslint-disable-next-line @typescript-eslint/restrict-template-expressions
      throw new Error(`Unknown type: ${type}`);
  }
}

function toAttributionValueCondition({
  comparison,
  rule,
}: {
  comparison: Comparison;
  rule: FilterRule;
}) {
  const attributeDataType = rule.type || ColumnTypes.String;
  const graphQLDataType =
    comparison.operator === GraphQLComparisonOperator.IsNull
      ? columnTypeToGraphQLType(attributeDataType)
      : comparison.variable.type;

  let condition = '';

  switch (graphQLDataType) {
    case 'String':
    case 'citext':
      if (rule.canBeNullOrEmpty) {
        const empty =
          (rule.operator?.value === FilterOperatorValue.Equal &&
            rule.term?.value === '') ||
          rule.operator?.value === FilterOperatorValue.Empty;
        const textVar =
          comparison.variable.type === 'String' ||
          comparison.variable.type === 'citext'
            ? `$${comparison.variable.name}`
            : '""';
        const nullVar =
          comparison.variable.type === 'String' ||
          comparison.variable.type === 'citext'
            ? empty != comparison.negate
            : `$${comparison.variable.name}`;
        const emptyCondition = `{ _or: [ { text_value: { _is_null: ${nullVar} } }, { text_value: { _eq: ${textVar} } } ] }`;
        const notEmptyCondition = `{ _and: [ { text_value: { _is_null: ${nullVar} } }, { text_value: { _neq: ${textVar} } } ] }`;
        condition =
          empty != comparison.negate ? emptyCondition : notEmptyCondition;
      } else {
        // comparison is neither empty string nor null
        condition = `{ text_value: { ${comparison.operator}: $${comparison.variable.name} } }`;
      }
      break;
    case 'Int':
      condition = `{ integer_value: { ${comparison.operator}: $${comparison.variable.name} } }`;
      break;
    case 'float8':
      condition = `{ float_value: { ${comparison.operator}: $${comparison.variable.name} } }`;
      break;
    case 'Boolean':
      condition = `{ boolean_value: { ${comparison.operator}: $${comparison.variable.name} } }`;
      break;
    case 'date':
      condition = `{ date_value: { ${comparison.operator}: $${comparison.variable.name} } }`;
      break;
    default:
      throw new Error(`Unknown type: ${comparison.variable.type}`);
  }

  if (comparison.negate) {
    condition = `{ _not: ${condition} }`;
  }

  return condition;
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

  // un-nested columns. e.g. `plants.id`
  baseColumns
    .filter((column) => column.split('.').length === 2)
    .forEach((column) => {
      const field = column.split('.')[1];
      if (!field) throw new Error(`Invalid column. Missing segment: ${column}`);
      fields += `${indentation}${toSnakeCase(field)}\n`;
    });

  // nested columns. e.g. `plants.plant_rows.name`
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
      // e.g. plants.plant_rows.name -> plants__plant_rows__name
      const alias = column.replaceAll('.', '__');

      const query = tables.reduceRight(
        (acc, table) => `${singularize(toSnakeCase(table))} { id ${acc} }`,
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
${indentation}attributes__${attributeId}: cached_attributions(where: { _and: [ { attribute_id: { _eq: ${attributeId} } }${filterConditions} ] }, order_by: { date_attributed: desc }) {
${indentation}  ...AttributionFragment
${indentation}}
`;
    });

  return fields;
}

// IMPORTANT: adapt type `AnalyzeCachedAttributionsFields` if changing fragment
const attributionFragment = `
fragment AttributionFragment on cached_attributions {
  id
  integer_value
  float_value
  text_value
  boolean_value
  date_value
  plant_id
  plant_group_id
  cultivar_id
  lot_id
  data_type
  # only needed for export:
  attribution_form_id
  attribute_id
  attribute_name
  date_attributed
  created
  author
  exceptional_attribution
  text_note
  photo_note
  plant {
    id
    label_id
  }
  plant_group {
    id
    display_name
  }
  cultivar {
    id
    display_name
  }
  lot {
    id
    display_name
  }
}
`;

export type AnalyzeCachedAttributionsFields = {
  id: number;
  integer_value: number | null;
  float_value: number | null;
  text_value: string | null;
  boolean_value: boolean | null;
  date_value: string | null;
  plant_id: number | null;
  plant_group_id: number | null;
  cultivar_id: number | null;
  lot_id: number | null;
  data_type: AttributeDataTypes;
  // only needed for export:
  attribution_form_id: number;
  attribute_id: number;
  attribute_name: string;
  date_attributed: string;
  created: string;
  author: string;
  exceptional_attribution: boolean;
  text_note: string;
  photo_note: string;
  plant: { id: number; label_id: string } | null;
  plant_group: { id: number; display_name: string } | null;
  cultivar: { id: number; display_name: string } | null;
  lot: { id: number; display_name: string } | null;
};

export type AnalyzeCachedAttributionsValueFields = Pick<
  AnalyzeCachedAttributionsFields,
  | 'integer_value'
  | 'float_value'
  | 'text_value'
  | 'boolean_value'
  | 'date_value'
>;

export const attributionValueKeys: (keyof AnalyzeCachedAttributionsValueFields)[] =
  ['integer_value', 'float_value', 'text_value', 'boolean_value', 'date_value'];

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
