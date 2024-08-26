import { test, expect, afterEach } from 'bun:test';
import { post, postOrFail } from '../fetch';
import { iso8601dateRegex } from '../utils';

const insertMutation = /* GraphQL */ `
  mutation InsertQuery(
    $name: citext!
    $note: String
    $baseTable: analyze_filter_base_tables_enum!
    $baseFilter: jsonb
    $attributionFilter: jsonb
    $visibleColumns: [String!]
  ) {
    insert_analyze_filters_one(
      object: {
        name: $name
        note: $note
        base_table: $baseTable
        base_filter: $baseFilter
        attribution_filter: $attributionFilter
        visible_columns: $visibleColumns
      }
    ) {
      id
      name
      note
      base_table
      base_filter
      attribution_filter
      visible_columns
      created
      modified
    }
  }
`;

const baseTable = 'PLANTS';
const baseFilter = {
  id: 23,
  level: 0,
  children: [
    {
      id: 24,
      level: 1,
      children: [
        {
          id: 25,
          level: 2,
          children: [],
          filterRule: {
            column: 'PlantsView.convar',
            isValid: true,
            criteria: '18A',
            comparator: {
              type: ['string'],
              value: 'contains',
            },
          },
          childrensOperand: null,
        },
        {
          id: 26,
          level: 2,
          children: [],
          filterRule: {
            column: 'PlantsView.convar',
            isValid: true,
            criteria: '18B',
            comparator: {
              type: ['string'],
              value: 'contains',
            },
          },
          childrensOperand: null,
        },
      ],
      filterRule: null,
      filterType: 'base',
      childrensOperand: 'or',
    },
    {
      id: 28,
      level: 1,
      children: [],
      filterRule: {
        column: 'PlantsView.label_id',
        isValid: true,
        criteria: '#',
        comparator: {
          type: ['string'],
          value: 'startsNotWith',
        },
      },
      filterType: 'base',
      childrensOperand: null,
    },
  ],
  filterRule: null,
  filterType: 'base',
  childrensOperand: 'and',
};
const attributionFilter = {
  id: 29,
  level: 0,
  children: [
    {
      id: 30,
      level: 1,
      children: [],
      filterRule: {
        column: 'AttributionsView.name',
        isValid: true,
        criteria: 'D_1_Schorf Blatt',
        comparator: {
          type: ['integer', 'double', 'string', 'date', 'enum'],
          value: '===',
        },
      },
      filterType: 'attribution',
      childrensOperand: null,
    },
  ],
  filterRule: null,
  filterType: 'attribution',
  childrensOperand: 'and',
};
const visibleColumns = [
  'PlantsView.convar',
  'PlantsView.label_id',
  'PlantsView.row',
  'PlantsView.offset',
  'Attribution.5-none',
  'Attribution.5-mean',
  'Attribution.183-none',
  'Attribution.40-none',
];

afterEach(async () => {
  await postOrFail({
    query: /* GraphQL */ `
      mutation DeleteAllAnalyzeFilters {
        delete_analyze_filters(where: {}) {
          affected_rows
        }
      }
    `,
  });
});

test('insert', async () => {
  const resp = await postOrFail({
    query: insertMutation,
    variables: {
      name: 'Query 1',
      baseTable,
      baseFilter,
      attributionFilter,
      visibleColumns,
      note: 'Note 1',
    },
  });

  expect(resp.data.insert_analyze_filters_one.id).toBeGreaterThan(0);
  expect(resp.data.insert_analyze_filters_one.name).toBe('Query 1');
  expect(resp.data.insert_analyze_filters_one.note).toBe('Note 1');
  expect(resp.data.insert_analyze_filters_one.base_table).toEqual(baseTable);
  expect(resp.data.insert_analyze_filters_one.base_filter).toEqual(baseFilter);
  expect(resp.data.insert_analyze_filters_one.attribution_filter).toEqual(
    attributionFilter,
  );
  expect(resp.data.insert_analyze_filters_one.visible_columns).toEqual(
    visibleColumns,
  );
  expect(resp.data.insert_analyze_filters_one.created).toMatch(
    iso8601dateRegex,
  );
  expect(resp.data.insert_analyze_filters_one.modified).toBeNull();
});

test('name is unique', async () => {
  const resp1 = await postOrFail({
    query: insertMutation,
    variables: {
      name: 'Query 1',
      baseTable,
      baseFilter,
      visibleColumns,
    },
  });
  const resp2 = await post({
    query: insertMutation,
    variables: {
      name: 'query 1',
      baseTable,
      baseFilter,
      visibleColumns,
    },
  });

  expect(resp1.data.insert_analyze_filters_one.id).toBeGreaterThan(0);
  expect(resp2.errors[0].message).toMatch(/Uniqueness violation/);
});

test('name is required', async () => {
  const resp = await post({
    query: insertMutation,
    variables: {
      name: '',
      baseTable,
      baseFilter,
      visibleColumns,
    },
  });

  expect(resp.errors[0].message).toMatch(/Check constraint violation/);
});

test('base_table is required', async () => {
  const resp = await post({
    query: insertMutation,
    variables: {
      name: 'Query 1',
      baseTable: null,
      baseFilter,
      visibleColumns,
    },
  });

  expect(resp.errors[0].message).toMatch(
    /null value found for non-nullable type/,
  );
});

test('modified', async () => {
  const resp = await postOrFail({
    query: insertMutation,
    variables: {
      name: 'Query 1',
      baseTable,
      baseFilter,
      visibleColumns,
    },
  });

  const updated = await postOrFail({
    query: /* GraphQL */ `
      mutation UpdateQuery($id: Int!, $name: citext) {
        update_analyze_filters_by_pk(
          pk_columns: { id: $id }
          _set: { name: $name }
        ) {
          id
          name
          modified
        }
      }
    `,
    variables: {
      id: resp.data.insert_analyze_filters_one.id,
      name: 'Query 999',
    },
  });

  expect(updated.data.update_analyze_filters_by_pk.modified).toMatch(
    iso8601dateRegex,
  );
});

test('note is trimmed', async () => {
  const resp = await postOrFail({
    query: insertMutation,
    variables: {
      name: 'Query 1',
      baseTable,
      baseFilter,
      visibleColumns,
      note: '   Note 1   ',
    },
  });

  expect(resp.data.insert_analyze_filters_one.note).toBe('Note 1');
});
