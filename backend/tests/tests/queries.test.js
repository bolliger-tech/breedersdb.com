import { test, expect, afterEach } from 'bun:test';
import { post, postOrFail } from '../fetch';
import { iso8601dateRegex } from '../utils';

const insertMutation = /* GraphQL */ `
  mutation InsertQuery($name: String, $filters: jsonb, $note: String) {
    insert_queries_one(
      object: { name: $name, filters: $filters, note: $note }
    ) {
      id
      name
      filters
      note
      created
      modified
    }
  }
`;

const filters = {
  baseTable: 'Plants',
  baseFilter: {
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
  },
  attributionFilter: {
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
  },
  visibleColumns: [
    'PlantsView.convar',
    'PlantsView.label_id',
    'PlantsView.row',
    'PlantsView.offset',
    'Attribution.5-none',
    'Attribution.5-mean',
    'Attribution.183-none',
    'Attribution.40-none',
  ],
  showRowsWithoutAttributions: false,
};

afterEach(async () => {
  await postOrFail({
    query: /* GraphQL */ `
      mutation DeleteAllQueries {
        delete_queries(where: {}) {
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
      filters,
      note: 'Note 1',
    },
  });

  expect(resp.data.insert_queries_one.id).toBeGreaterThan(0);
  expect(resp.data.insert_queries_one.name).toBe('Query 1');
  expect(resp.data.insert_queries_one.filters).toEqual(filters);
  expect(resp.data.insert_queries_one.note).toBe('Note 1');
  expect(resp.data.insert_queries_one.created).toMatch(iso8601dateRegex);
  expect(resp.data.insert_queries_one.modified).toBeNull();
});

test('name is unique', async () => {
  const resp1 = await postOrFail({
    query: insertMutation,
    variables: {
      name: 'Query 1',
      filters,
    },
  });
  const resp2 = await post({
    query: insertMutation,
    variables: {
      name: 'Query 1',
      filters,
    },
  });

  expect(resp1.data.insert_queries_one.id).toBeGreaterThan(0);
  expect(resp2.errors[0].message).toMatch(/Uniqueness violation/);
});

test('name is required', async () => {
  const resp = await post({
    query: insertMutation,
    variables: {
      name: '',
      filters,
    },
  });

  expect(resp.errors[0].message).toMatch(/Check constraint violation/);
});

test('modified', async () => {
  const resp = await postOrFail({
    query: insertMutation,
    variables: {
      name: 'Query 1',
      filters,
    },
  });

  const updated = await postOrFail({
    query: /* GraphQL */ `
      mutation UpdateQuery($id: Int!, $name: String) {
        update_queries_by_pk(pk_columns: { id: $id }, _set: { name: $name }) {
          id
          name
          modified
        }
      }
    `,
    variables: { id: resp.data.insert_queries_one.id, name: 'Query 999' },
  });

  expect(updated.data.update_queries_by_pk.modified).toMatch(iso8601dateRegex);
});

test('note is trimmed', async () => {
  const resp = await postOrFail({
    query: insertMutation,
    variables: {
      name: 'Query 1',
      filters,
      note: '   Note 1   ',
    },
  });

  expect(resp.data.insert_queries_one.note).toBe('Note 1');
});
