import { authenticateRequest } from './authenticateRequest';
import { createAuthCookies } from '../lib/cookies';
import { generateToken, hashToken, verifyPassword } from '../lib/crypto';
import { ErrorWithStatus } from '../lib/errors';
import { fetchGraphQL } from '../lib/fetch';
import {
  IncUserSigninAttemptsMutation,
  InsertUserTokenMutations,
  UserQueryByEmail,
} from '../queries';
import type { ActionProps, ActionResult } from '../types';

type SignInInput = {
  user_id: number;
  locale: string;
};

// checking if the user is already signed in is not necessary
// because this action is protected by hasura permissions
export async function SignIn({
  input,
  ctx,
}: ActionProps): Promise<ActionResult<SignInInput>> {
  // admin in hasura console is not allowed to signIn/SignOut
  if (ctx.sessionVariables?.['x-hasura-role'] === 'admin') {
    throw new ErrorWithStatus(
      403,
      'Forbidden: Admins are not allowed to sign in',
    );
  }

  if (!input || !input.email || !input.password) {
    throw new ErrorWithStatus(400, 'Bad Request: Missing email or password');
  }

  // get user
  const user = await fetchGraphQL({
    query: UserQueryByEmail,
    variables: {
      email: input.email,
    },
  }).then((data) => data?.data?.users?.[0]);
  if (!user) {
    throw new ErrorWithStatus(404, 'Not Found: User not found');
  }

  // check if user is already signed in
  const auth = await authenticateRequest(ctx.req.headers.cookie);
  if (auth) {
    if (auth.userId !== user.id) {
      throw new ErrorWithStatus(
        403,
        'Forbidden: Already signed in as another user, sign out first',
      );
    }
    // user is already signed in
    return {
      response: {
        user_id: user.id,
        locale: user.locale,
      },
    };
  }

  // verify password
  const verified = await verifyPassword(input.password, user.password_hash);
  if (!verified) {
    // increment signin attempts
    await fetchGraphQL({
      query: IncUserSigninAttemptsMutation,
      variables: {
        user_id: user.id,
      },
    });
    throw new ErrorWithStatus(401, 'Unauthorized: Invalid password');
  }

  // token
  const token = generateToken();
  const tokenHash = hashToken(token);

  const dbToken = await fetchGraphQL({
    query: InsertUserTokenMutations,
    variables: {
      user_id: user.id,
      token_hash: tokenHash,
      type: 'cookie',
    },
  }).then((data) => data?.data?.insert_user_tokens_one);
  if (!dbToken?.id) {
    throw new ErrorWithStatus(
      500,
      'Internal Server Error: Token creation failed',
    );
  }

  // create cookies
  const cookieHeader = createAuthCookies(dbToken.id, token, user.email);

  return {
    response: {
      user_id: user.id,
      locale: user.locale,
    },
    headers: {
      'Set-Cookie': cookieHeader,
    },
  };
}
