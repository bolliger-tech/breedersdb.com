import { hashAndSaltPassword } from '../lib/crypto';
import { InsertUserMutation } from '../queries';
import { ErrorWithStatus } from '../lib/errors';
import { fetchGraphQL } from '../lib/fetch';
import type { ActionProps, ActionResult } from '../types';
import { validatePassword } from '../lib/validation';

type InsertUserOutput = any;

export async function InsertUserAction({
  input,
}: ActionProps): Promise<ActionResult<InsertUserOutput>> {
  if (!input || !input.email || !input.password) {
    throw new ErrorWithStatus(400, 'Bad Request: Missing email or password');
  }

  validatePassword(input.password);

  const passwordHash = await hashAndSaltPassword(input.password);

  // save user to db
  const data = await fetchGraphQL({
    query: InsertUserMutation,
    variables: {
      user_object: {
        email: input.email,
        password_hash: passwordHash,
        ...(input.locale && { locale: input.locale }),
      },
    },
  });
  if (data.errors) {
    const firstError = data.errors[0];
    throw new ErrorWithStatus(400, firstError.message);
  }

  return {
    response: data.data.insert_users_one,
  };
}
