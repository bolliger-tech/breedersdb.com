import { test, expect, afterEach } from 'bun:test';
import { post, postOrFail } from '../fetch';
import { iso8601dateRegex } from '../utils';
import { config } from '../config';

const insertMutation = /* GraphQL */ `
  mutation InsertLoggedAction(
    $name: String!
    $subject: String!
    $context: jsonb = null
  ) {
    insert_logged_actions_one(
      object: { name: $name, subject: $subject, context: $context }
    ) {
      id
      name
      subject
      context
      created
    }
  }
`;

const adminHeaders = {
  'X-Hasura-Admin-Secret': config.HASURA_GRAPHQL_ADMIN_SECRET,
};

afterEach(async () => {
  await postOrFail(
    {
      query: /* GraphQL */ `
        mutation DeleteAllLoggedActions {
          delete_logged_actions(where: {}) {
            affected_rows
          }
        }
      `,
    },
    adminHeaders,
  );
});

test('insert: admin can insert', async () => {
  const resp = await postOrFail(
    {
      query: insertMutation,
      variables: {
        name: 'Logged Action 1',
        subject: 'Subject 1',
        context: { key: 'value' },
      },
    },
    adminHeaders,
  );

  expect(resp.data.insert_logged_actions_one.id).toBeGreaterThan(0);
  expect(resp.data.insert_logged_actions_one.name).toBe('Logged Action 1');
  expect(resp.data.insert_logged_actions_one.subject).toBe('Subject 1');
  expect(resp.data.insert_logged_actions_one.context).toEqual({
    key: 'value',
  });
  expect(resp.data.insert_logged_actions_one.created).toMatch(iso8601dateRegex);
});

test('insert: user can NOT insert', async () => {
  const resp = await post({
    query: insertMutation,
    variables: {
      name: 'Logged Action 1',
      subject: 'Subject 1',
      context: { key: 'value' },
    },
  });

  expect(resp.errors[0]).toBeDefined();
  expect(resp.errors[0].message).toMatch(
    "field 'insert_logged_actions_one' not found in type: 'mutation_root'",
  );
  expect(resp.data).toBeUndefined();
});

test('name is required', async () => {
  const resp = await post(
    {
      query: insertMutation,
      variables: {
        name: '',
        subject: 'Subject 1',
        context: { key: 'value' },
      },
    },
    adminHeaders,
  );

  expect(resp.errors[0].message).toMatch(/Check constraint violation/);
});

test('subject is required', async () => {
  const resp = await post(
    {
      query: insertMutation,
      variables: {
        name: 'Action 1',
        subject: '',
        context: { key: 'value' },
      },
    },
    adminHeaders,
  );

  expect(resp.errors[0].message).toMatch(/Check constraint violation/);
});

test('context is optional', async () => {
  const resp = await postOrFail(
    {
      query: insertMutation,
      variables: {
        name: 'Action 1',
        subject: 'Subject 1',
      },
    },
    adminHeaders,
  );

  expect(resp.data.insert_logged_actions_one.id).toBeGreaterThan(0);
});

test('updates are not allowed', async () => {
  const resp = await postOrFail(
    {
      query: insertMutation,
      variables: {
        name: 'Action 1',
        subject: 'Subject 1',
        context: { key: 'value' },
      },
    },
    adminHeaders,
  );

  const updated = await post(
    {
      query: /* GraphQL */ `
        mutation UpdateLoggedAction($id: Int!, $name: String!) {
          update_logged_actions_by_pk(
            pk_columns: { id: $id }
            _set: { name: $name }
          ) {
            id
            name
          }
        }
      `,
      variables: {
        id: resp.data.insert_logged_actions_one.id,
        name: 'modified',
      },
    },
    adminHeaders,
  );

  expect(updated.errors[0]).toBeDefined();
  expect(updated.errors[0].message).toMatch('database query error');
  expect(updated.data).toBeUndefined();
});

test('admin can read', async () => {
  await postOrFail(
    {
      query: insertMutation,
      variables: {
        name: 'Logged Action 1',
        subject: 'Subject 1',
        context: { key: 'value' },
      },
    },
    adminHeaders,
  );

  const resp = await postOrFail(
    {
      query: /* GraphQL */ `
        query GetLoggedActions {
          logged_actions {
            id
            name
            subject
            context
            created
          }
        }
      `,
    },
    adminHeaders,
  );

  expect(resp.data.logged_actions.length).toBe(1);
  expect(resp.data.logged_actions[0].id).toBeGreaterThan(0);
  expect(resp.data.logged_actions[0].name).toBe('Logged Action 1');
  expect(resp.data.logged_actions[0].subject).toBe('Subject 1');
  expect(resp.data.logged_actions[0].context).toEqual({
    key: 'value',
  });
  expect(resp.data.logged_actions[0].created).toMatch(iso8601dateRegex);
});

test('user can NOT read', async () => {
  await postOrFail(
    {
      query: insertMutation,
      variables: {
        name: 'Logged Action 1',
        subject: 'Subject 1',
        context: { key: 'value' },
      },
    },
    adminHeaders,
  );

  const resp = await post({
    query: /* GraphQL */ `
      query GetLoggedActions {
        logged_actions {
          id
          name
          subject
          context
          created
        }
      }
    `,
  });

  expect(resp.errors[0]).toBeDefined();
  expect(resp.errors[0].message).toMatch(
    "field 'logged_actions' not found in type: 'query_root'",
  );
  expect(resp.data).toBeUndefined();
});

test('admin can delete', async () => {
  const insert = await postOrFail(
    {
      query: insertMutation,
      variables: {
        name: 'Logged Action 1',
        subject: 'Subject 1',
        context: { key: 'value' },
      },
    },
    adminHeaders,
  );

  const resp = await postOrFail(
    {
      query: /* GraphQL */ `
        mutation DeleteLoggedAction($id: Int!) {
          delete_logged_actions_by_pk(id: $id) {
            id
          }
        }
      `,
      variables: {
        id: insert.data.insert_logged_actions_one.id,
      },
    },
    adminHeaders,
  );

  expect(resp.data.delete_logged_actions_by_pk.id).toBe(
    insert.data.insert_logged_actions_one.id,
  );
});

test('user can NOT delete', async () => {
  const insert = await postOrFail(
    {
      query: insertMutation,
      variables: {
        name: 'Logged Action 1',
        subject: 'Subject 1',
        context: { key: 'value' },
      },
    },
    adminHeaders,
  );

  const resp = await post({
    query: /* GraphQL */ `
      mutation DeleteLoggedAction($id: Int!) {
        delete_logged_actions_by_pk(id: $id) {
          id
        }
      }
    `,
    variables: {
      id: insert.data.insert_logged_actions_one.id,
    },
  });

  expect(resp.errors[0]).toBeDefined();
  expect(resp.errors[0].message).toMatch(
    "field 'delete_logged_actions_by_pk' not found in type: 'mutation_root'",
  );
  expect(resp.data).toBeUndefined();
});
