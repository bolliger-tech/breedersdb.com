import { test, expect, afterEach } from 'bun:test';
import { post } from '../fetch';
import { iso8601dateRegex } from '../utils';

const insertMutation = /* GraphQL */ `
  mutation InsertAttributionForm($name: String, $description: String) {
    insert_attribution_forms_one(
      object: { name: $name, description: $description, disabled: false }
    ) {
      id
      name
      description
      disabled
      created
      modified
    }
  }
`;

afterEach(async () => {
  await post({
    query: /* GraphQL */ `
      mutation DeleteAllAttributionForms {
        delete_attribution_forms(where: {}) {
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
      name: 'AttributionForm 1',
      description: 'Description 1',
    },
  });

  expect(resp.data.insert_attribution_forms_one.id).toBeGreaterThan(0);
  expect(resp.data.insert_attribution_forms_one.name).toBe('AttributionForm 1');
  expect(resp.data.insert_attribution_forms_one.description).toBe(
    'Description 1',
  );
  expect(resp.data.insert_attribution_forms_one.disabled).toBe(false);
  expect(resp.data.insert_attribution_forms_one.created).toMatch(
    iso8601dateRegex,
  );
  expect(resp.data.insert_attribution_forms_one.modified).toBeNull();
});

test('name is unique', async () => {
  const resp1 = await post({
    query: insertMutation,
    variables: {
      name: 'AttributionForm 1',
    },
  });
  const resp2 = await post({
    query: insertMutation,
    variables: {
      name: 'AttributionForm 1',
    },
  });

  expect(resp1.data.insert_attribution_forms_one.id).toBeGreaterThan(0);
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
      name: 'AttributionForm 1',
    },
  });

  const updated = await post({
    query: /* GraphQL */ `
      mutation UpdateAttributionForm($id: Int!, $name: String) {
        update_attribution_forms_by_pk(
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
      id: resp.data.insert_attribution_forms_one.id,
      name: 'AttributionForm 999',
    },
  });

  expect(updated.data.update_attribution_forms_by_pk.modified).toMatch(
    iso8601dateRegex,
  );
});
