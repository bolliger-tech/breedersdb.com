import { hashAndSaltPassword } from '../lib/crypto';
import { ChangePasswordMutation } from '../queries';
import { ErrorWithStatus } from '../lib/errors';
import { fetchGraphQL } from '../lib/fetch';
import type { ActionProps, ActionResult } from '../types';
import { validatePassword } from '../lib/validation';
import type { UserOutput } from './types';
import { authenticateRequest } from './authenticateRequest';
import { createClearAuthCookies } from '../lib/cookies';

export async function ChangePassword({
  input,
  ctx,
}: ActionProps): Promise<ActionResult<UserOutput>> {
  if (!input || !input.user_id || !input.password) {
    throw new ErrorWithStatus(400, 'Bad Request: Missing user_id or password');
  }

  validatePassword(input.password);
  const passwordHash = await hashAndSaltPassword(input.password);

  // The trigger user_tokens_delete_on_password_change deletes all tokens
  // for this user. If the user changed their own password, we must
  // clear it's cookies so the frontend automatically does the right thing.
  // authenticateRequest needs to be called before the mutation
  // otherwise the token is already invalid
  const auth = await authenticateRequest(ctx.req.headers.cookie);
  const isMe = auth && auth.userId === input.user_id;
  const headers = isMe
    ? {
        'Set-Cookie': createClearAuthCookies(),
      }
    : undefined;

  const data = await fetchGraphQL({
    query: ChangePasswordMutation,
    variables: {
      user_id: input.user_id,
      password_hash: passwordHash,
    },
  });
  if (data.errors) {
    const firstError = data.errors[0];
    throw new ErrorWithStatus(400, firstError.message);
  }

  return {
    response: { id: data.data.update_users_by_pk.id },
    headers,
  };
}
