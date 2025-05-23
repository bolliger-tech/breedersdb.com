import {
  test,
  describe,
  expect,
  beforeAll,
  afterAll,
  afterEach,
} from 'bun:test';
import { post, postOrFail, postOrFailRaw } from '../fetch';
import { config } from '../config';

const UserFields = /* GraphQL */ `
  id
  email
  locale
  failed_signin_attempts
  first_failed_signin_attempt
  last_signin
  created
  modified
`;

const deleteAllUsersMutation = /* GraphQL */ `
  mutation DeleteAllUsers {
    delete_user_tokens(where: {}) {
      affected_rows
    }
    delete_users(where: {}) {
      affected_rows
    }
  }
`;

const insertUserMutation = /* GraphQL */ `
  mutation InsertUser($email: citext!, $password: String!) {
    InsertUser(object: { email: $email, password: $password }) {
      email
      last_signin
      failed_signin_attempts
    }
  }
`;

const usersQuery = /* GraphQL */ `
  query Users {
    users(order_by: { created: asc }) {
      ${UserFields}
      password_hash
      user_tokens_aggregate {
        aggregate {
          max {
            last_verify
          }
        }
      }
    }
  }
`;

const signinMutation = /* GraphQL */ `
  mutation SignIn($email: citext!, $password: String!) {
    SignIn(email: $email, password: $password) {
      ${UserFields}
    }
  }
`;

const meQuery = /* GraphQL */ `
  query Me {
    Me {
      id
      user {
        ${UserFields}
      }
    }
  }
`;

const signOutMutation = /* GraphQL */ `
  mutation SignOut {
    SignOut {
      user_id
    }
  }
`;

const changePasswordMutation = /* GraphQL */ `
  mutation ChangePassword($user_id: Int!, $password: String!) {
    ChangePassword(user_id: $user_id, password: $password) {
      id
      user {
        ${UserFields}
      }
    }
  }
`;

// from: 'breedersdb.user={"email":"testtest@breedersdb.com"}; SameSite=None; Max-Age=34473600; Path=/, breedersdb.id.token=10.b659a53895d7a2e66ca85abb64a05b0a55dbfd523faa62e2ed72cf55125f2f70; HttpOnly; SameSite=None; Max-Age=34473600; Path=/'
//   to: 'breedersdb.user={"email":"tester@breedersdb.com"}; breedersdb.id.token=9.d433bc46cf9629d9b351188ca113f0b0003811e781e207fa3542a5702d924183'
const cookieReqHeaderFromRespHeader = (cookies: string) =>
  cookies
    .split(',')
    .map((c) =>
      c
        .split(';')
        .map((c) => c.trim())
        .filter((c) => c.startsWith('breedersdb')),
    )
    .join('; ');

// ⚠️⚠️⚠️⚠️⚠️⚠️⚠️⚠️⚠️⚠️⚠️⚠️⚠️⚠️⚠️⚠️⚠️⚠️⚠️⚠️⚠️⚠️⚠️⚠️
// Warning: These tests are not independent but describe a sequence of actions
// that depend on each other. They should be run in the order they are defined.
// ⚠️⚠️⚠️⚠️⚠️⚠️⚠️⚠️⚠️⚠️⚠️⚠️⚠️⚠️⚠️⚠️⚠️⚠️⚠️⚠️⚠️⚠️⚠️⚠️

const user1 = {
  email: 'tester1@breedersdb.com',
  password: 'Asdfasdf1!',
  password2: 'Asdfasdf2!',
};
let user1Id: number;
let user1CookiesReqHeader: string;
const user2 = {
  email: 'tester2@breedersdb.com',
  password: 'Asdfasdf1?',
};
let user2CookiesReqHeader: string;

const adminHeaders = {
  'X-Hasura-Admin-Secret': config.HASURA_GRAPHQL_ADMIN_SECRET,
};

beforeAll(async () => {
  await postOrFail({ query: deleteAllUsersMutation }, adminHeaders);
});

afterAll(async () => {
  await postOrFail({ query: deleteAllUsersMutation }, adminHeaders);
});

test('insert users', async () => {
  const result = await postOrFail(
    {
      query: insertUserMutation,
      variables: { email: user1.email, password: user1.password },
    },
    adminHeaders,
  );
  expect(result.data.InsertUser.email).toBe(user1.email);
  expect(result.data.InsertUser.last_signin).toBe(null);
  expect(result.data.InsertUser.failed_signin_attempts).toBe(0);

  const result2 = await postOrFail(
    {
      query: insertUserMutation,
      variables: { email: user2.email, password: user2.password },
    },
    adminHeaders,
  );
  expect(result2.data.InsertUser.email).toBe(user2.email);
});

test('email uniqueness', async () => {
  const result = await post({
    query: insertUserMutation,
    variables: { email: user1.email, password: user1.password },
  });
  expect(result.errors).not.toBe(undefined);
  expect(result.errors[0].message).toContain('Uniqueness violation.');
  expect(result.data).toBe(undefined);
});

test('email uniqueness not case sensitive', async () => {
  const result = await post({
    query: insertUserMutation,
    variables: {
      email: [...user1.email]
        .map((c, i) => (i % 2 === 0 ? c.toUpperCase() : c))
        .join(''),
      password: user1.password,
    },
  });
  expect(result.errors).not.toBe(undefined);
  expect(result.errors[0].message).toContain('Uniqueness violation.');
  expect(result.data).toBe(undefined);
});

test('get users', async () => {
  const result = await postOrFail({ query: usersQuery }, adminHeaders);
  expect(result.data.users.length).toBe(2);

  user1Id = result.data.users[0].id;
  expect(user1Id).toBeGreaterThan(0);
  expect(result.data.users[0].email).toBe(user1.email);
  expect(result.data.users[0].failed_signin_attempts).toBe(0);
  expect(result.data.users[0].last_signin).toBe(null);
  expect(result.data.users[0].locale).not.toBe(null);
  expect(result.data.users[0].password_hash).not.toContain(user1.password);

  expect(result.data.users[1].email).toBe(user2.email);
  expect(result.data.users[1].failed_signin_attempts).toBe(0);
  expect(result.data.users[1].last_signin).toBe(null);
  expect(result.data.users[1].locale).not.toBe(null);
});

test('sign in with unknown email', async () => {
  const json = await post({
    query: signinMutation,
    variables: { email: 'wrong', password: user1.password },
  });
  expect(json.errors).not.toBe(undefined);
  expect(json.errors[0].message).toBe('Not Found: User not found');
  expect(json.data).toBe(undefined);
});

test('sign in', async () => {
  const { json, resp } = await postOrFailRaw({
    query: signinMutation,
    variables: { email: user1.email, password: user1.password },
  });
  expect(json.data.SignIn.id).toBe(user1Id);
  expect(json.data.SignIn.locale).toBe('de-CH');
  expect(json.data.SignIn.failed_signin_attempts).toBe(0);

  const respCookies = resp?.headers?.get('Set-Cookie');
  expect(respCookies).toMatch('breedersdb.id.token=');
  expect(respCookies).toMatch('breedersdb.user=');
  if (!respCookies) {
    throw new Error('No cookies');
  }
  user1CookiesReqHeader = cookieReqHeaderFromRespHeader(respCookies);
  expect(user1CookiesReqHeader).not.toContain(user1.password);
});

test('sign in user2', async () => {
  const { json, resp } = await postOrFailRaw({
    query: signinMutation,
    variables: { email: user2.email, password: user2.password },
  });
  expect(json.data.SignIn.id).toBeGreaterThan(0);

  const respCookies = resp?.headers?.get('Set-Cookie');
  expect(respCookies).toMatch('breedersdb.id.token=');
  expect(respCookies).toMatch('breedersdb.user=');
  if (!respCookies) {
    throw new Error('No cookies');
  }
  user2CookiesReqHeader = cookieReqHeaderFromRespHeader(respCookies);
});

test('me', async () => {
  if (!user1CookiesReqHeader) {
    throw new Error('No cookies');
  }
  const result = await postOrFail(
    { query: meQuery },
    { Cookie: user1CookiesReqHeader },
  );
  expect(result.data.Me.user.email).toBe(user1.email);
  expect(result.data.Me.user.locale).not.toBe(null);
  expect(result.data.Me.user.last_signin).not.toBe(null);
  expect(result.data.Me.user.failed_signin_attempts).toBe(0);
  expect(result.data.Me.user.first_failed_signin_attempt).toBe(null);
});

test('sign out', async () => {
  if (!user1CookiesReqHeader) {
    throw new Error('No cookies');
  }
  const result = await postOrFail(
    { query: signOutMutation },
    { Cookie: user1CookiesReqHeader },
  );
  expect(result.data.SignOut.user_id).toBe(user1Id);
});

test('me after sign out', async () => {
  if (!user1CookiesReqHeader) {
    throw new Error('No cookies');
  }
  const json = await post(
    { query: meQuery },
    { Cookie: user1CookiesReqHeader },
  );
  expect(json.errors).not.toBe(undefined);
  expect(json.errors[0]?.extensions?.code).toBe('access-denied');
  expect(json.errors[0]?.message).toBe(
    'Authentication hook unauthorized this request',
  );
  expect(json.data).toBe(undefined);
});

test('sign in with wrong password', async () => {
  const json = await post({
    query: signinMutation,
    variables: { email: user1.email, password: 'wrong' },
  });
  expect(json.errors).not.toBe(undefined);
  expect(json.errors[0].message).toStartWith('Unauthorized: Invalid password');
  expect(json.errors[0].extensions.nextPossibleSignIn).not.toBe(undefined);
  expect(json.data).toBe(undefined);
});

test('failed sign in attempts', async () => {
  const result = await postOrFail({ query: usersQuery }, adminHeaders);
  expect(result.data.users.length).toBe(2);
  expect(result.data.users[0].email).toBe(user1.email);
  expect(result.data.users[0].failed_signin_attempts).toBe(1);
  expect(result.data.users[0].last_signin).not.toBe(null);
  expect(result.data.users[0].locale).not.toBe(null);

  expect(result.data.users[1].email).toBe(user2.email);
  expect(result.data.users[1].failed_signin_attempts).toBe(0);
  expect(result.data.users[1].last_signin).not.toBe(null);
  expect(result.data.users[1].locale).not.toBe(null);
});

test('failed sign in attempts reset', async () => {
  const { json, resp } = await postOrFailRaw({
    query: signinMutation,
    variables: { email: user1.email, password: user1.password },
  });
  expect(json.data.SignIn.id).toBe(user1Id);

  const respCookies = resp?.headers?.get('Set-Cookie');
  expect(respCookies).toMatch('breedersdb.id.token=');
  expect(respCookies).toMatch('breedersdb.user=');
  if (!respCookies) {
    throw new Error('No cookies');
  }
  user1CookiesReqHeader = cookieReqHeaderFromRespHeader(respCookies);

  const result = await postOrFail(
    { query: meQuery },
    { Cookie: user1CookiesReqHeader },
  );
  expect(result.data.Me.user.email).toBe(user1.email);
  expect(result.data.Me.user.locale).not.toBe(null);
  expect(result.data.Me.user.last_signin).not.toBe(null);
  expect(result.data.Me.user.failed_signin_attempts).toBe(0);
});

test('change password', async () => {
  const result = await postOrFail({
    query: changePasswordMutation,
    variables: { user_id: user1Id, password: user1.password2 },
  });
  expect(result.data.ChangePassword.id).toBe(user1Id);
  expect(
    new Date(result.data.ChangePassword.user.modified).valueOf(),
  ).toBeGreaterThan(
    new Date(result.data.ChangePassword.user.created).valueOf(),
  );
});

test('signed out after password change', async () => {
  const json = await post(
    { query: meQuery },
    { Cookie: user1CookiesReqHeader },
  );
  expect(json.errors).not.toBe(undefined);
  expect(json.errors[0]?.extensions?.code).toBe('access-denied');
  expect(json.errors[0]?.message).toBe(
    'Authentication hook unauthorized this request',
  );
  expect(json.data).toBe(undefined);
});

test('user2 still signed in', async () => {
  const result = await postOrFail(
    { query: meQuery },
    { Cookie: user2CookiesReqHeader },
  );
  expect(result.data.Me.user.email).toBe(user2.email);
  expect(result.data.Me.user.locale).not.toBe(null);
  expect(result.data.Me.user.last_signin).not.toBe(null);
  expect(result.data.Me.user.failed_signin_attempts).toBe(0);
});

test('user token last verify', async () => {
  const result = await postOrFail({ query: usersQuery }, adminHeaders);
  expect(result.data.users.length).toBe(2);

  expect(result.data.users[0].email).toBe(user1.email);
  expect(result.data.users[0].failed_signin_attempts).toBe(0);
  expect(result.data.users[0].last_signin).not.toBe(null);
  expect(
    result.data.users[0].user_tokens_aggregate.aggregate.max.last_verify,
  ).toBe(null); // after sign out there is no token left

  expect(result.data.users[1].email).toBe(user2.email);
  expect(result.data.users[1].failed_signin_attempts).toBe(0);
  expect(result.data.users[1].last_signin).not.toBe(null);
  expect(
    result.data.users[1].user_tokens_aggregate.aggregate.max.last_verify,
  ).not.toBe(null); // still signed in
});

test('sign-in with new password', async () => {
  const { json, resp } = await postOrFailRaw({
    query: signinMutation,
    variables: { email: user1.email, password: user1.password2 },
  });
  expect(json.data.SignIn.id).toBe(user1Id);

  const respCookies = resp?.headers?.get('Set-Cookie');
  expect(respCookies).toMatch('breedersdb.id.token=');
  expect(respCookies).toMatch('breedersdb.user=');
  if (!respCookies) {
    throw new Error('No cookies');
  }
  user1CookiesReqHeader = cookieReqHeaderFromRespHeader(respCookies);

  const result = await postOrFail(
    { query: meQuery },
    { Cookie: user1CookiesReqHeader },
  );
  expect(result.data.Me.user.email).toBe(user1.email);
});

// rate limiting
test('sign in with wrong password rate limited', async () => {
  const date_start = new Date();
  for (let i = 0; i <= 3; i++) {
    const json = await post({
      query: signinMutation,
      variables: { email: user1.email, password: 'wrong' },
    });
    expect(json.errors).not.toBe(undefined);
    expect(json.data).toBe(undefined);

    switch (i) {
      case 0:
      case 1:
      case 2:
        expect(json.errors[0].message).toStartWith(
          'Unauthorized: Invalid password. Next possible sign in attempt is after',
        );
        break;
      case 3:
        expect(json.errors[0].message).toStartWith(
          'Forbidden: Too many failed sign in attempts, try again after',
        );
        break;
    }

    expect(json.errors[0].extensions.nextPossibleSignIn).not.toBe(undefined);
    const nextPossibleSignIn = new Date(
      json.errors[0].extensions.nextPossibleSignIn,
    );

    switch (i) {
      case 0:
      case 1:
        expect(nextPossibleSignIn.getTime()).toBeGreaterThan(
          date_start.getTime(),
        );
        expect(nextPossibleSignIn.getTime()).toBeLessThan(
          date_start.getTime() + 500,
        );
        break;
      case 2:
      case 3:
        expect(nextPossibleSignIn.getTime()).toBeGreaterThan(
          date_start.getTime() + 1500,
        );
        expect(nextPossibleSignIn.getTime()).toBeLessThan(
          date_start.getTime() + 2500,
        );
        break;
    }
  }
});

test('failed sign in attempts after rate limited', async () => {
  const result = await postOrFail({ query: usersQuery }, adminHeaders);
  expect(result.data.users.length).toBe(2);
  expect(result.data.users[0].email).toBe(user1.email);
  expect(result.data.users[0].failed_signin_attempts).toBe(3);
  expect(result.data.users[0].first_failed_signin_attempt).not.toBe(null);
  expect(result.data.users[0].last_signin).not.toBe(null);
  expect(result.data.users[0].locale).not.toBe(null);

  expect(result.data.users[1].email).toBe(user2.email);
  expect(result.data.users[1].failed_signin_attempts).toBe(0);
  expect(result.data.users[1].first_failed_signin_attempt).toBe(null);
  expect(result.data.users[1].last_signin).not.toBe(null);
  expect(result.data.users[1].locale).not.toBe(null);
});

test('change password resets failed sign in attempts', async () => {
  const result = await postOrFail({
    query: changePasswordMutation,
    variables: { user_id: user1Id, password: user1.password },
  });
  expect(result.data.ChangePassword.id).toBe(user1Id);
  expect(result.data.ChangePassword.user.failed_signin_attempts).toBe(0);
  expect(result.data.ChangePassword.user.first_failed_signin_attempt).toBe(
    null,
  );
});

// -----------------------------------------------------------------------------
// Password reset flow
// -----------------------------------------------------------------------------
describe('password reset flow', () => {
  const sendPasswordResetMailMutation = /* GraphQL */ `
    mutation SendPasswordResetMail($email: citext!) {
      SendPasswordResetMail(email: $email) {
        id
      }
    }
  `;
  const resetPasswordMutation = /* GraphQL */ `
    mutation ResetPassword($token: String!, $password: String!) {
      ResetPassword(token: $token, newPassword: $password) {
        id
      }
    }
  `;

  afterEach(async () => {
    // reset rate limiting
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

  describe('request password reset', () => {
    test('invalid email', async () => {
      const json = await post({
        query: sendPasswordResetMailMutation,
        variables: { email: 'invalid' },
      });
      expect(json.errors[0].extensions.code).toBe(400);
      expect(json.errors[0].message).toBe(
        'Bad Request: Enter a valid email address.',
      );
      expect(json.data).toBe(undefined);
    });

    test('rate limited', async () => {
      let json;
      for (let i = 0; i < 6; i++) {
        json = await post({
          query: sendPasswordResetMailMutation,
          variables: { email: 'tester@breedersdb.com' },
        });
      }
      expect(json.errors[0].extensions.code).toBe(429);
      expect(json.errors[0].message).toBe(
        'Too Many Requests: Too many password reset requests',
      );
      expect(json.data).toBe(undefined);
    });

    test('unknown email', async () => {
      const json = await post({
        query: sendPasswordResetMailMutation,
        variables: { email: 'tester@breedersdb.com' },
      });
      expect(json.errors[0].extensions.code).toBe(404);
      expect(json.errors[0].message).toBe('Not Found: User not found');
      expect(json.data).toBe(undefined);
    });

    test.skip('smtp error', async () => {
      // end-to-end testing is hard here
      // test feature in the cloud-function instead
    });
    test.skip('happy case', async () => {
      // end-to-end testing is hard here
      // test feature in the cloud-function instead
    });
  });

  describe('reset password', () => {
    test('missing token', async () => {
      const json = await post({
        query: resetPasswordMutation,
        variables: { password: 'Asdfasdf1!', token: '' },
      });
      expect(json.errors[0].extensions.code).toBe(400);
      expect(json.errors[0].message).toBe(
        'Bad Request: Missing or malformatted newPassword or token',
      );
      expect(json.data).toBe(undefined);
    });

    test('missing password', async () => {
      const json = await post({
        query: resetPasswordMutation,
        variables: { token: 'asdf', password: '' },
      });
      expect(json.errors[0].extensions.code).toBe(400);
      expect(json.errors[0].message).toBe(
        'Bad Request: Missing or malformatted newPassword or token',
      );
      expect(json.data).toBe(undefined);
    });

    test.skip('invalid token: invalid signature', async () => {
      // end-to-end testing is hard here
      // test feature in the cloud-function instead
    });
    test.skip('invalid token: invalid issuer', async () => {
      // end-to-end testing is hard here
      // test feature in the cloud-function instead
    });
    test.skip('invalid token: invalid audience', async () => {
      // end-to-end testing is hard here
      // test feature in the cloud-function instead
    });
    test.skip('invalid token: expired', async () => {
      // end-to-end testing is hard here
      // test feature in the cloud-function instead
    });
    test.skip('unknown email', async () => {
      // end-to-end testing is hard here
      // test feature in the cloud-function instead
    });
    test.skip('user modified after token creation', async () => {
      // end-to-end testing is hard here
      // test feature in the cloud-function instead
    });
    test.skip('invalid password', async () => {
      // end-to-end testing is hard here
      // test feature in the cloud-function instead
    });
    test.skip('happy case', async () => {
      // end-to-end testing is hard here
      // test feature in the cloud-function instead
    });
  });
});
