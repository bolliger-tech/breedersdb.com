import * as ff from '@google-cloud/functions-framework';
import {
  ROLL_EVERY_SECONDS,
  createAuthCookies,
  getTokenFromCookies,
} from '../lib/cookies';
import { fetchGraphQL } from '../lib/fetch';
import { RollTokenLastVerifyMutation } from '../queries';
import { validateFrontendAuth } from './validateFrontendAuth';
import {
  LOG_ACCESS_EVERY_SECONDS,
  validatePersonalAccessToken,
} from './validatePersonalAccessToken';

// authentication hook for hasura: decides if a request to hasura is allowed
// https://hasura.io/docs/latest/auth/authentication/unauthenticated-access/
export async function authenticateHasuraRequest(
  req: ff.Request,
  res: ff.Response,
) {
  const cookies = req.body.headers.Cookie || req.body.headers.cookie;
  const authorization =
    req.body.headers.Authorization || req.body.headers.authorization;
  const operationName = req.body.request?.operationName;

  // Try personal access token authentication first
  const patAuth = await validatePersonalAccessToken(authorization);
  if (patAuth) {
    // update last_verify if needed
    const secondsSinceLastVerify = getSecondsSince(patAuth.dbToken.last_verify);
    if (secondsSinceLastVerify > LOG_ACCESS_EVERY_SECONDS) {
      await updateLastVerify({
        tokenId: patAuth.dbToken.id,
      });
    }
    return res.send({
      'X-Hasura-User-Id': patAuth.userId.toString(),
      'X-Hasura-Role': 'user',
    });
  }

  // Fall back to cookie-based authentication
  const auth = await validateFrontendAuth(cookies);
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
    const secondsSinceLastVerify = getSecondsSince(auth.dbToken.last_verify);
    if (secondsSinceLastVerify > ROLL_EVERY_SECONDS) {
      const rollResultUser = await updateLastVerify({
        tokenId: auth.cookiePayload.tokenId,
      });
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

async function updateLastVerify({ tokenId }: { tokenId: number }) {
  const resp = await fetchGraphQL({
    query: RollTokenLastVerifyMutation,
    variables: {
      token_id: tokenId,
    },
  }).then((data) => data?.data?.update_user_tokens_by_pk?.user);
  if (!resp) {
    throw new Error('RollTokenLastVerifyMutation failed');
  }
  return resp;
}

function getSecondsSince(dateString: string | null): number {
  if (!dateString) return Infinity;
  const date = new Date(dateString);
  const now = new Date();
  return Math.floor((now.getTime() - date.getTime()) / 1000);
}
