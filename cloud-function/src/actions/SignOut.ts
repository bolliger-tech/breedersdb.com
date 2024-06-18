import { authenticateRequest } from '..';
import { createClearAuthCookies } from '../lib/cookies';
import { ErrorWithStatus } from '../lib/errors';
import { fetchGraphQL } from '../lib/fetch';
import { DeleteUserTokenMutation } from '../queries';
import type { ActionProps, ActionResult } from './types';

export async function SignOut({ ctx }: ActionProps): Promise<ActionResult> {
  // admin in hasura console is not allowed to signIn/SignOut
  if (ctx.sessionVariables?.['x-hasura-role'] === 'admin') {
    throw new ErrorWithStatus(403, 'Forbidden');
  }

  const auth = await authenticateRequest(ctx.req.headers.cookie);
  // should not happen, as this graphql mutation is protected by hasura
  if (!auth) {
    throw new ErrorWithStatus(401, 'Unauthorized');
  }

  const result = await fetchGraphQL({
    query: DeleteUserTokenMutation,
    variables: {
      token_id: auth.tokenId,
    },
  });
  if (result.errors) {
    throw new ErrorWithStatus(
      500,
      'Internal Server Error: Token deletion failed',
    );
  }

  // create clear cookies
  const cookieHeader = createClearAuthCookies();

  return {
    response: { user_id: auth.userId },
    headers: {
      'Set-Cookie': cookieHeader,
    },
  };
}
