import { test, expect, afterEach } from 'bun:test';
import { post } from '../fetch';
import { iso8601dateRegex } from '../utils';

const insertMutation = /* GraphQL */ `
  mutation InsertOrchard($name: String) {
    insert_orchards_one(object: { name: $name, disabled: false }) {
      id
      name
      disabled
      created
      modified
    }
  }
`;

afterEach(async () => {
  await post({
    query: /* GraphQL */ `
      mutation DeleteAllOrchards {
        delete_orchards(where: {}) {
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
      name: 'Orchard 1',
    },
  });

  expect(resp.data.insert_orchards_one.id).toBeGreaterThan(0);
  expect(resp.data.insert_orchards_one.name).toBe('Orchard 1');
  expect(resp.data.insert_orchards_one.disabled).toBe(false);
  expect(resp.data.insert_orchards_one.created).toMatch(iso8601dateRegex);
  expect(resp.data.insert_orchards_one.modified).toBeNull();
});

test('name is unique', async () => {
  const resp1 = await post({
    query: insertMutation,
    variables: {
      name: 'Orchard 1',
    },
  });
  const resp2 = await post({
    query: insertMutation,
    variables: {
      name: 'orchard 1',
    },
  });

  expect(resp1.data.insert_orchards_one.id).toBeGreaterThan(0);
  expect(resp2.errors[0].message).toMatch(/Uniqueness violation/);
});

test('name is required', async () => {
  const resp = await post({
    query: insertMutation,
    variables: {
      name: '',
    },
  });

  expect(resp.errors[0].message).toMatch(/Check constraint violation/);
});

test('modified', async () => {
  const resp = await post({
    query: insertMutation,
    variables: {
      name: 'Orchard 1',
    },
  });

  const updated = await post({
    query: /* GraphQL */ `
      mutation UpdateOrchard($id: Int!, $name: String) {
        update_orchards_by_pk(pk_columns: { id: $id }, _set: { name: $name }) {
          id
          name
          modified
        }
      }
    `,
    variables: { id: resp.data.insert_orchards_one.id, name: 'Orchard 999' },
  });

  expect(updated.data.update_orchards_by_pk.modified).toMatch(iso8601dateRegex);
});
