import { test, expect, afterEach } from 'bun:test';
import { post } from '../fetch';
import { iso8601dateRegex } from '../utils';

const insertMutation = /* GraphQL */ `
  mutation InsertQueryGroup($name: String, $version: String) {
    insert_query_groups_one(object: { name: $name, version: $version }) {
      id
      name
      version
      created
      modified
    }
  }
`;

afterEach(async () => {
  await post({
    query: /* GraphQL */ `
      mutation DeleteAllQueryGroups {
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
      name: 'QueryGroup 1',
      version: '1.0.0',
    },
  });

  expect(resp.data.insert_query_groups_one.id).toBeGreaterThan(0);
  expect(resp.data.insert_query_groups_one.name).toBe('QueryGroup 1');
  expect(resp.data.insert_query_groups_one.version).toBe('1.0.0');
  expect(resp.data.insert_query_groups_one.created).toMatch(iso8601dateRegex);
  expect(resp.data.insert_query_groups_one.modified).toBeNull();
});

test('name is unique', async () => {
  const resp1 = await post({
    query: insertMutation,
    variables: {
      name: 'QueryGroup 1',
      version: '1.0.0',
    },
  });
  const resp2 = await post({
    query: insertMutation,
    variables: {
      name: 'QueryGroup 1',
      version: '1.0.0',
    },
  });

  expect(resp1.data.insert_query_groups_one.id).toBeGreaterThan(0);
  expect(resp2.errors[0].message).toMatch(/Uniqueness violation/);
});

test('name is required', async () => {
  const resp = await post({
    query: insertMutation,
    variables: {
      name: '',
      version: '1.0.0',
    },
  });

  expect(resp.errors[0].message).toMatch(/Check constraint violation/);
});

test('modified', async () => {
  const resp = await post({
    query: insertMutation,
    variables: {
      name: 'QueryGroup 1',
      version: '1.0.0',
    },
  });

  const updated = await post({
    query: /* GraphQL */ `
      mutation UpdateQueryGroup($id: Int!, $name: String) {
        update_query_groups_by_pk(
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
      id: resp.data.insert_query_groups_one.id,
      name: 'QueryGroup 999',
    },
  });

  expect(updated.data.update_query_groups_by_pk.modified).toMatch(
    iso8601dateRegex,
  );
});
