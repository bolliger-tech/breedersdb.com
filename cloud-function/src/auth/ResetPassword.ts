import type { JWTPayload } from 'jose';
import { config } from '../lib/config';
import { createClearAuthCookies } from '../lib/cookies';
import { verifyJwt } from '../lib/crypto';
import { ErrorWithStatus } from '../lib/errors';
import { getUserByEmail, updateUserPassword } from '../lib/user';
import type { ActionProps, ActionResult } from '../types';
import type { UserOutput } from './types';

export async function ResetPassword({
  input,
  ctx,
}: ActionProps): Promise<ActionResult<UserOutput>> {
  // validate input
  if (
    !input ||
    !input.newPassword ||
    !input.token ||
    typeof input.newPassword !== 'string' ||
    typeof input.token !== 'string'
  ) {
    throw new ErrorWithStatus(
      400,
      'Bad Request: Missing or malformatted newPassword or token',
    );
  }
  const { newPassword, token } = input as {
    newPassword: string;
    token: string;
  };

  // validate token
  let payload: JWTPayload;
  try {
    const resp = await verifyJwt({
      jwt: token,
      key: config.PASSWORD_RESET_SECRET,
      issuer: config.CLOUD_FUNCTION_URL,
    });
    payload = resp.payload;
  } catch (err) {
    throw new ErrorWithStatus(401, 'Unauthorized: Invalid token');
  }
  const { sub, mod } = payload;
  if (!sub || !mod || typeof sub !== 'string' || typeof mod !== 'string') {
    throw new ErrorWithStatus(401, 'Unauthorized: Invalid token');
  }
  const emailAddress = sub;
  const modified = mod;

  // get user
  const user = await getUserByEmail(emailAddress);

  // check if user wasn't modified since token was created
  // prevents replay attacks
  if (user.modified !== modified) {
    throw new ErrorWithStatus(
      403,
      'Unauthorized: User was modified since token was created',
    );
  }

  // update password
  const userId = await updateUserPassword({
    userId: user.id,
    password: newPassword,
  });

  return {
    response: { id: userId },
    headers: {
      // clear auch cookie
      // in case the user opens the link in a browser where he was logged in
      'Set-Cookie': createClearAuthCookies(),
    },
  };
}
