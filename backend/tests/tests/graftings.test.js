import { test, expect, afterEach } from 'bun:test';
import { post } from '../fetch';
import { iso8601dateRegex } from '../utils';

const insertMutation = /* GraphQL */ `
  mutation InsertGrafting($name: String) {
    insert_graftings_one(object: { name: $name }) {
      id
      name
      created
      modified
    }
  }
`;

afterEach(async () => {
  await post({
    query: /* GraphQL */ `
      mutation DeleteAllGraftings {
        delete_graftings(where: {}) {
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
      name: 'Grafting 1',
    },
  });

  expect(resp.data.insert_graftings_one.id).toBeGreaterThan(0);
  expect(resp.data.insert_graftings_one.name).toBe('Grafting 1');
  expect(resp.data.insert_graftings_one.created).toMatch(iso8601dateRegex);
  expect(resp.data.insert_graftings_one.modified).toBeNull();
});

test('name is unique', async () => {
  const resp1 = await post({
    query: insertMutation,
    variables: {
      name: 'Grafting 1',
    },
  });
  const resp2 = await post({
    query: insertMutation,
    variables: {
      name: 'grafting 1',
    },
  });

  expect(resp1.data.insert_graftings_one.id).toBeGreaterThan(0);
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
      name: 'Grafting 1',
    },
  });

  const updated = await post({
    query: /* GraphQL */ `
      mutation UpdateGrafting($id: Int!, $name: String) {
        update_graftings_by_pk(pk_columns: { id: $id }, _set: { name: $name }) {
          id
          name
          modified
        }
      }
    `,
    variables: { id: resp.data.insert_graftings_one.id, name: 'Grafting 999' },
  });

  expect(updated.data.update_graftings_by_pk.modified).toMatch(
    iso8601dateRegex,
  );
});
