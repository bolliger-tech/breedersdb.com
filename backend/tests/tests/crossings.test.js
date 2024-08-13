import { test, expect, afterEach } from 'bun:test';
import { post, postOrFail } from '../fetch';
import { iso8601dateRegex } from '../utils';

const insertMutation = /* GraphQL */ `
  mutation InsertCrossing($name: String, $note: String) {
    insert_crossings_one(object: { name: $name, note: $note }) {
      id
      name
      mother_cultivar_id
      father_cultivar_id
      note
      created
      modified
      is_variety
    }
  }
`;

afterEach(async () => {
  await postOrFail({
    query: /* GraphQL */ `
      mutation DeleteAllCrossings {
        delete_crossings(where: {}) {
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
      name: 'Abcd',
      note: 'Some note',
    },
  });

  expect(resp.data.insert_crossings_one.id).toBeGreaterThan(0);
  expect(resp.data.insert_crossings_one.name).toBe('Abcd');
  expect(resp.data.insert_crossings_one.mother_cultivar_id).toBeNull();
  expect(resp.data.insert_crossings_one.father_cultivar_id).toBeNull();
  expect(resp.data.insert_crossings_one.note).toBe('Some note');
  expect(resp.data.insert_crossings_one.created).toMatch(iso8601dateRegex);
  expect(resp.data.insert_crossings_one.modified).toBeNull();
  expect(resp.data.insert_crossings_one.is_variety).toBe(false);
});

test('name is unique', async () => {
  const resp1 = await postOrFail({
    query: insertMutation,
    variables: {
      name: 'Abcd',
    },
  });
  const resp2 = await post({
    query: insertMutation,
    variables: {
      name: 'Abcd',
    },
  });

  expect(resp1.data.insert_crossings_one.id).toBeGreaterThan(0);
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
  const resp = await postOrFail({
    query: insertMutation,
    variables: {
      name: 'modified',
    },
  });

  const updated = await postOrFail({
    query: /* GraphQL */ `
      mutation UpdateCrossing($id: Int!, $name: String) {
        update_crossings_by_pk(pk_columns: { id: $id }, _set: { name: $name }) {
          id
          name
          modified
        }
      }
    `,
    variables: { id: resp.data.insert_crossings_one.id, name: 'EFGH' },
  });

  expect(updated.data.update_crossings_by_pk.modified).toMatch(
    iso8601dateRegex,
  );
});
