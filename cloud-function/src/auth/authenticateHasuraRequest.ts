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
  const cookies = req.body.headers.Cookie || req.body.headers.cookie;
  const operationName = req.body.request.operationName;
  const auth = await authenticateRequest(cookies);
  if (!auth) {
    // allow SignIn in any case
    if (operationName !== 'SignIn') {
      const cookiePayload = getTokenFromCookies(cookies);
      if (cookiePayload) {
        // cookie with token is present but invalid
        // unfortunately, the Set-Cookie header is only forwarded by hasura
        // in the success case (200), not in the error case (401), so we can't
        // clear the cookie here
        return res.status(401).send('Unauthorized: Invalid token!');
      }
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
        rollResultUser.id,
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
