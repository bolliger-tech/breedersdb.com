import * as ff from '@google-cloud/functions-framework';
import {
  ROLL_EVERY_SECONDS,
  createAuthCookies,
  getTokenFromCookies,
} from '../lib/cookies';
import { fetchGraphQL } from '../lib/fetch';
import { RollTokenLastVerifyMutation } from '../queries';
import { authenticateRequest } from './authenticateRequest';

// https://hasura.io/docs/latest/auth/authentication/unauthenticated-access/
export async function authenticateHasuraRequest(
  req: ff.Request,
  res: ff.Response,
) {
  const auth = await authenticateRequest(req.headers.cookie);
  if (!auth) {
    const cookiePayload = getTokenFromCookies(req.headers.cookie);
    if (cookiePayload) {
      // TODO check if request operationName is SignIn, then skip this
      // token in cookie is invalid
      // unfortunately, the Set-Cookie header is only forwarded by hasura
      // in the success case (200), not in the error case (401), so we can't
      // clear the cookie here
      console.error('Invalid token in cookie:', cookiePayload);
      return res.status(401).send('Unauthorized');
    }
    return res.send({
      'X-Hasura-Role': 'public',
    });
  }

  // roll cookie expiration forward
  try {
    const secondsSinceLastVerify = Math.floor(
      (Date.now() - new Date(auth.dbToken.last_verify).getTime()) / 1000,
    );
    if (secondsSinceLastVerify > ROLL_EVERY_SECONDS) {
      const rollResultUser = await fetchGraphQL({
        query: RollTokenLastVerifyMutation,
        variables: {
          token_id: auth.cookiePayload.tokenId,
        },
      }).then((data) => data?.data?.update_user_tokens_by_pk?.user);
      if (!rollResultUser) {
        throw new Error('RollTokenLastVerifyMutation failed');
      }
      const newCookies = createAuthCookies(
        auth.cookiePayload.tokenId,
        auth.cookiePayload.token,
        rollResultUser.email,
      );
      res.setHeader('Set-Cookie', newCookies);
    }
  } catch (e) {
    console.error('Error rolling cookie expiration:', e);
  }

  return res.send({
    'X-Hasura-User-Id': auth.userId.toString(),
    'X-Hasura-Role': 'user',
  });
}
