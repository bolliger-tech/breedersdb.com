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

export type UserAuthentication =
  | { status: 'authenticated'; userId: number }
  | { status: 'anonymous' }
  | { status: 'invalid-pat' }
  | { status: 'invalid-cookie' };

// resolves the user of a request by its personal access token or, if there is
// none, by its auth cookie. rolls the cookie expiration forward via `res`.
export async function authenticateUser(
  requestCookies: string | undefined,
  authorization: string | undefined,
  res: ff.Response,
): Promise<UserAuthentication> {
  // Try personal access token authentication first
  if (authorization) {
    const patAuth = await validatePersonalAccessToken(authorization);
    if (!patAuth) {
      return { status: 'invalid-pat' };
    }

    // update last_verify if needed. it's only logged, so it mustn't fail the
    // request.
    try {
      const secondsSinceLastVerify = getSecondsSince(
        patAuth.dbToken.last_verify,
      );
      if (secondsSinceLastVerify > LOG_ACCESS_EVERY_SECONDS) {
        await updateLastVerify({
          tokenId: patAuth.dbToken.id,
        });
      }
    } catch (e) {
      console.error('Error updating personal access token last_verify:', e);
    }
    return { status: 'authenticated', userId: patAuth.userId };
  }

  // Fall back to cookie-based authentication
  const auth = await validateFrontendAuth(requestCookies);
  if (!auth) {
    // a cookie with a token that is present but invalid
    return getTokenFromCookies(requestCookies)
      ? { status: 'invalid-cookie' }
      : { status: 'anonymous' };
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

  return { status: 'authenticated', userId: auth.userId };
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
