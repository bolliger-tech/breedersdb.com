import { ErrorWithStatus } from '../lib/errors';
import type { ActionProps, ActionResult } from '../types';
import type { UserOutput } from './types';
import { validateFrontendAuth } from './validateFrontendAuth';
import { createClearAuthCookies } from '../lib/cookies';
import { updateUserPassword } from '../lib/user';

export async function ChangePassword({
  input,
  ctx,
}: ActionProps): Promise<ActionResult<UserOutput>> {
  if (!input || !input.user_id || !input.password) {
    throw new ErrorWithStatus(400, 'Bad Request: Missing user_id or password');
  }

  // The trigger user_tokens_delete_on_password_change deletes all tokens
  // for this user. If the user changed their own password, we must
  // clear it's cookies so the frontend automatically does the right thing.
  // validateFrontendAuth needs to be called before the mutation
  // otherwise the token is already invalid
  const auth = await validateFrontendAuth(ctx.req.headers.cookie);
  const isMe = auth && auth.userId === input.user_id;
  const headers = isMe
    ? {
        'Set-Cookie': createClearAuthCookies(),
      }
    : undefined;

  const userId = await updateUserPassword({
    userId: parseInt(input.user_id),
    password: input.password,
  });

  return {
    response: { id: userId },
    headers,
  };
}
