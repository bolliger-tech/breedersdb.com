import { hashAndSaltPassword } from '../lib/crypto';
import { ChangePasswordMutation } from '../queries';
import { ErrorWithStatus } from '../lib/errors';
import { fetchGraphQL } from '../lib/fetch';
import type { ActionProps, ActionResult } from '../types';
import { validatePassword } from '../lib/validation';
import type { UserOutput } from './types';

export async function ChangePassword({
  input,
}: ActionProps): Promise<ActionResult<UserOutput>> {
  if (!input || !input.user_id || !input.password) {
    throw new ErrorWithStatus(400, 'Bad Request: Missing user_id or password');
  }

  validatePassword(input.password);

  const passwordHash = await hashAndSaltPassword(input.password);

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
  };
}
