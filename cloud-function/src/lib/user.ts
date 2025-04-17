import {
  ChangePasswordMutation,
  UserQueryByEmail,
  type UserQueryByEmailResponse,
} from '../queries';
import { hashAndSaltPassword } from './crypto';
import { ErrorWithStatus } from './errors';
import { fetchGraphQL } from './fetch';
import { validatePassword } from './validation';

export async function getUserByEmail(emailAddress: string) {
  const user = await fetchGraphQL({
    query: UserQueryByEmail,
    variables: { email: emailAddress },
  }).then(
    (data) =>
      data?.data?.users?.[0] as
        | UserQueryByEmailResponse['users'][0]
        | undefined,
  );
  if (!user) {
    throw new ErrorWithStatus(404, 'Not Found: User not found');
  }
  return user;
}

export async function updateUserPassword({
  userId,
  password,
}: {
  userId: number;
  password: string;
}) {
  validatePassword(password);
  const passwordHash = await hashAndSaltPassword(password);

  const data = await fetchGraphQL({
    query: ChangePasswordMutation,
    variables: {
      user_id: userId,
      password_hash: passwordHash,
    },
  });
  if (data.errors) {
    const firstError = data.errors[0];
    throw new ErrorWithStatus(400, firstError.message);
  }
  return data.data.update_users_by_pk.id as number;
}
