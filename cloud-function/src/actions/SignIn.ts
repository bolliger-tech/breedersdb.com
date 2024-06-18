import { authenticateRequest } from '..';
import { createAuthCookies } from '../lib/cookies';
import { generateToken, hashToken, verifyPassword } from '../lib/crypto';
import { ErrorWithStatus } from '../lib/errors';
import { fetchGraphQL } from '../lib/fetch';
import { InsertUserTokenMutation, UserQuery } from '../queries';
import type { ActionProps, ActionResult } from './types';

// checking if the user is already signed in is not necessary
// because this action is protected by hasura permissions
export async function SignIn({
  input,
  ctx,
}: ActionProps): Promise<ActionResult> {
  // admin in hasura console is not allowed to signIn/SignOut
  if (ctx.sessionVariables?.['x-hasura-role'] === 'admin') {
    throw new ErrorWithStatus(403, 'Forbidden');
  }

  const auth = await authenticateRequest(ctx.req.headers.cookie);
  if (auth) {
    // user is already signed in
    return {
      response: {
        user_id: auth.userId,
      },
    };
  }

  if (!input || !input.email || !input.password) {
    throw new ErrorWithStatus(400, 'Bad Request');
  }

  // get user
  const user = await fetchGraphQL({
    query: UserQuery,
    variables: {
      email: input.email,
    },
  }).then((data) => data?.data?.users?.[0]);
  if (!user) {
    throw new ErrorWithStatus(404, 'Not Found');
  }

  // verify password
  const verified = await verifyPassword(input.password, user.password_hash);
  if (!verified) {
    throw new ErrorWithStatus(401, 'Unauthorized');
  }

  // token
  const token = generateToken();
  const tokenHash = hashToken(token);

  const dbToken = await fetchGraphQL({
    query: InsertUserTokenMutation,
    variables: {
      user_id: user.id,
      token_hash: tokenHash,
      type: 'cookie',
    },
  }).then((data) => data?.data?.insert_user_tokens_one);
  if (!dbToken?.id) {
    throw new ErrorWithStatus(401, 'Unauthorized');
  }

  // create cookies
  const cookieHeader = createAuthCookies(dbToken.id, token, user.email);

  return {
    response: {
      user_id: user.id,
    },
    headers: {
      'Set-Cookie': cookieHeader,
    },
  };
}
