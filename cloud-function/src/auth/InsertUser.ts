import { hashAndSaltPassword } from '../lib/crypto';
import { InsertUserMutation } from '../queries';
import { ErrorWithStatus } from '../lib/errors';
import { fetchGraphQL } from '../lib/fetch';
import type { ActionProps, ActionResult } from '../types';
import { validateEmail, validatePassword } from '../lib/validation';
import type { FullUserOutput } from './types';

export async function InsertUserAction({
  input,
}: ActionProps): Promise<ActionResult<FullUserOutput>> {
  if (!input?.object || !input.object.email || !input.object.password) {
    throw new ErrorWithStatus(400, 'Bad Request: Missing email or password');
  }
  const inputObj = input.object;

  validateEmail(inputObj.email);
  validatePassword(inputObj.password);

  const passwordHash = await hashAndSaltPassword(inputObj.password);

  // save user to db
  const data = await fetchGraphQL({
    query: InsertUserMutation,
    variables: {
      user_object: {
        email: inputObj.email,
        password_hash: passwordHash,
        ...(inputObj.locale && { locale: inputObj.locale }),
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
