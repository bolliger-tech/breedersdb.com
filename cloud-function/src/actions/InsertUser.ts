import { hashAndSaltPassword } from '../crypto';
import { InsertUserMutation } from '../queries';
import { ErrorWithStatus } from '../errors';
import { fetchGraphQL } from '../fetch';
import type { ActionProps, ActionResult } from './types';

//export async function InsertUserAction(body: any) {
export async function InsertUserAction({
  input,
}: ActionProps): Promise<ActionResult> {
  if (!input || !input.email || !input.password) {
    throw new ErrorWithStatus(400, 'Bad Request');
  }

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
