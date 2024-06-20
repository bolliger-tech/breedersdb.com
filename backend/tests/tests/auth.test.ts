import { test, expect, beforeAll } from 'bun:test';
import { postOrFail } from '../fetch';

const deleteAllUsersMutation = /* GraphQL */ `
  mutation DeleteAllUsers {
    delete_user_tokens(where: { id: { _is_null: false } }) {
      affected_rows
    }
    delete_users(where: { id: { _is_null: false } }) {
      affected_rows
    }
  }
`;

const insertUserMutation = /* GraphQL */ `
  mutation InsertUser($email: citext!, $password: String!) {
    InsertUser(email: $email, password: $password) {
      email
    }
  }
`;

const signinMutation = /* GraphQL */ `
  mutation SignIn($email: citext!, $password: String!) {
    SignIn(email: $email, password: $password) {
      user_id
    }
  }
`;

const user1 = {
  email: 'testtest@breedersdb.com',
  password: 'Asdfasdf1!',
};

const adminHeaders = {
  'X-Hasura-Admin-Secret': process.env.HASURA_GRAPHQL_ADMIN_SECRET,
};

beforeAll(async () => {
  await postOrFail({ query: deleteAllUsersMutation }, adminHeaders);
});

test('insert user', async () => {
  const result = await postOrFail(
    {
      query: insertUserMutation,
      variables: user1,
    },
    adminHeaders,
  );
  console.log(result);
  expect(result.data.InsertUser.email).toBe(user1.email);
});

test('sign in', async () => {
  const result = await postOrFail({
    query: signinMutation,
    variables: user1,
  });
  console.log(result);
  expect(result.data.SignIn.user_id).toBeGreaterThan(0);
});
