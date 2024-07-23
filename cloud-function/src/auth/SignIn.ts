import { authenticateRequest } from './authenticateRequest';
import { createAuthCookies } from '../lib/cookies';
import { generateToken, hashToken, verifyPassword } from '../lib/crypto';
import { ErrorWithStatus } from '../lib/errors';
import { fetchGraphQL } from '../lib/fetch';
import {
  SetUserSigninAttemptsMutation,
  InsertUserTokenMutations,
  UserQueryByEmail,
} from '../queries';
import type { ActionProps, ActionResult } from '../types';
import type { FullUserOutput } from './types';

// get exponential backoff seconds
// T = 2 * 2^max(N-1,0) - 2
// attempt 1: 0
// attempt 2: 0
// attempt 3: 2
// attempt 4: 6
// attempt 5: 14
// attempt 6: 30
function getExponentialBackoffSeconds(attempt: number) {
  return 2 * 2 ** Math.max(attempt - 2, 0) - 2;
}

function getNextPossibleSignIn(
  firstFailedSigninAttempt: Date,
  attempts: number,
) {
  return new Date(
    firstFailedSigninAttempt.getTime() +
      getExponentialBackoffSeconds(attempts) * 1000,
  );
}

// checking if the user is already signed in is not necessary
// because this action is protected by hasura permissions
export async function SignIn({
  input,
  ctx,
}: ActionProps): Promise<ActionResult<FullUserOutput>> {
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
      response: user,
    };
  }

  // check signin attempts
  const now = new Date();
  const nextPossibleSignIn = !!user.first_failed_signin_attempt
    ? getNextPossibleSignIn(
        new Date(user.first_failed_signin_attempt),
        user.failed_signin_attempts,
      )
    : now;
  if (now < nextPossibleSignIn) {
    throw new ErrorWithStatus(
      429,
      `Forbidden: Too many failed sign in attempts, try again after ${nextPossibleSignIn.toISOString()}`,
      { nextPossibleSignIn: nextPossibleSignIn.toISOString() },
    );
  }

  // verify password
  const verified = await verifyPassword(input.password, user.password_hash);
  if (!verified) {
    // increment signin attempts
    const firstFailedSigninAttempt = user.first_failed_signin_attempt
      ? new Date(user.first_failed_signin_attempt)
      : new Date();
    await fetchGraphQL({
      query: SetUserSigninAttemptsMutation,
      variables: {
        user_id: user.id,
        first_failed_signin_attempt: firstFailedSigninAttempt,
      },
    });
    const newNextPossibleSignIn = getNextPossibleSignIn(
      firstFailedSigninAttempt,
      user.failed_signin_attempts + 1,
    );
    throw new ErrorWithStatus(
      401,
      'Unauthorized: Invalid password. Next possible sign in attempt is after ' +
        newNextPossibleSignIn.toISOString(),
      { nextPossibleSignIn: newNextPossibleSignIn.toISOString() },
    );
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
  const cookieHeader = createAuthCookies(
    dbToken.id,
    token,
    user.id,
    user.email,
  );

  return {
    response: user,
    headers: {
      'Set-Cookie': cookieHeader,
    },
  };
}
