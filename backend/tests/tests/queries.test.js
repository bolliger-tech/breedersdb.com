import { test, expect, afterEach } from 'bun:test';
import { post } from '../fetch';
import { iso8601dateRegex } from '../utils';

const insertMutation = /* GraphQL */ `
  mutation InsertQuery(
    $name: String
    $my_query: jsonb
    $note: String
    $query_group_name: String
  ) {
    insert_queries_one(
      object: {
        name: $name
        my_query: $my_query
        note: $note
        query_group: { data: { name: $query_group_name, version: "1.0.0" } }
      }
    ) {
      id
      name
      my_query
      note
      query_group {
        name
      }
      created
      modified
    }
  }
`;

const my_query = {
  baseTable: 'Trees',
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
              column: 'TreesView.convar',
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
              column: 'TreesView.convar',
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
          column: 'TreesView.publicid',
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
  markFilter: {
    id: 29,
    level: 0,
    children: [
      {
        id: 30,
        level: 1,
        children: [],
        filterRule: {
          column: 'MarksView.name',
          isValid: true,
          criteria: 'D_1_Schorf Blatt',
          comparator: {
            type: ['integer', 'double', 'string', 'date', 'enum'],
            value: '===',
          },
        },
        filterType: 'mark',
        childrensOperand: null,
      },
    ],
    filterRule: null,
    filterType: 'mark',
    childrensOperand: 'and',
  },
  visibleColumns: [
    'TreesView.convar',
    'TreesView.publicid',
    'TreesView.row',
    'TreesView.offset',
    'Mark.5-none',
    'Mark.5-mean',
    'Mark.183-none',
    'Mark.40-none',
  ],
  showRowsWithoutMarks: false,
};

afterEach(async () => {
  await post({
    query: /* GraphQL */ `
      mutation DeleteAllQueries {
        delete_queries(where: {}) {
          affected_rows
        }
        delete_query_groups(where: {}) {
          affected_rows
        }
      }
    `,
  });
});

test('insert', async () => {
  const resp = await post({
    query: insertMutation,
    variables: {
      name: 'Query 1',
      my_query,
      note: 'Note 1',
      query_group_name: 'QueryGroup 1',
    },
  });

  expect(resp.data.insert_queries_one.id).toBeGreaterThan(0);
  expect(resp.data.insert_queries_one.name).toBe('Query 1');
  expect(resp.data.insert_queries_one.my_query).toEqual(my_query);
  expect(resp.data.insert_queries_one.note).toBe('Note 1');
  expect(resp.data.insert_queries_one.query_group.name).toBe('QueryGroup 1');
  expect(resp.data.insert_queries_one.created).toMatch(iso8601dateRegex);
  expect(resp.data.insert_queries_one.modified).toBeNull();
});

test('name is unique', async () => {
  const resp1 = await post({
    query: insertMutation,
    variables: {
      name: 'Query 1',
      my_query,
      query_group_name: 'QueryGroup 1',
    },
  });
  const resp2 = await post({
    query: insertMutation,
    variables: {
      name: 'Query 1',
      my_query,
      query_group_name: 'QueryGroup 1',
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
      my_query,
      query_group_name: 'QueryGroup 1',
    },
  });

  expect(resp.errors[0].message).toMatch(/Check constraint violation/);
});

test('modified', async () => {
  const resp = await post({
    query: insertMutation,
    variables: {
      name: 'Query 1',
      my_query,
      query_group_name: 'QueryGroup 1',
    },
  });

  const updated = await post({
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
  const resp = await post({
    query: insertMutation,
    variables: {
      name: 'Query 1',
      my_query,
      note: '   Note 1   ',
      query_group_name: 'QueryGroup 1',
    },
  });

  expect(resp.data.insert_queries_one.note).toBe('Note 1');
});

// TODO: test validation of my_query structure
