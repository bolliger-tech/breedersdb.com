import * as ff from '@google-cloud/functions-framework';

import { hashToken, timingSafeEqual } from './lib/crypto';
import { handleActions } from './actions';
import { RollTokenLastVerifyMutation, UserTokenQuery } from './queries';
import {
  ROLL_EVERY_SECONDS,
  createAuthCookies,
  getTokenFromCookies,
} from './lib/cookies';
import { fetchGraphQL } from './lib/fetch';
import { config } from './lib/config';
import { handleDownload, handleUpload } from './images/imageEndpoints';

// check actions/SignIn.ts for more details
export async function authenticateRequest(cookie: string | undefined): Promise<{
  userId: number;
  dbToken: {
    id: number;
    token_hash: string;
    user_id: number;
    type: string;
    last_verify: string;
  };
  cookiePayload: { tokenId: number; token: string };
} | null> {
  const cookiePayload = getTokenFromCookies(cookie);
  if (!cookiePayload) {
    return null;
  }

  const dbToken = await fetchGraphQL({
    query: UserTokenQuery,
    variables: {
      token_id: cookiePayload.tokenId,
    },
  }).then((data) => data?.data?.user_tokens_by_pk);
  if (!dbToken) {
    return null;
  }

  const tokenHash = hashToken(cookiePayload.token);

  if (!timingSafeEqual(dbToken.token_hash, tokenHash)) {
    return null;
  }

  return {
    userId: dbToken.user_id,
    dbToken: dbToken,
    cookiePayload,
  };
}

// https://hasura.io/docs/latest/auth/authentication/unauthenticated-access/
async function authenticateHasuraRequest(req: ff.Request, res: ff.Response) {
  const auth = await authenticateRequest(req.headers.cookie);
  if (!auth) {
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

ff.http('auth', (req: ff.Request, res: ff.Response) => {
  if (config.LOG_REQUESTS) {
    console.log('req:', { headers: req.headers, url: req.url, body: req.body });
  }
  switch (req.url.split('/')[1].split('?')[0]) {
    case 'authenticate-hasura-request':
      return authenticateHasuraRequest(req, res);
    case 'actions':
      return handleActions(req, res);
    case 'health':
      return res.send('🫛🌱🌳🍎');
    case 'upload':
      return handleUpload(req, res);
    default:
      // TODO url handling
      if (req.url.startsWith('/images/')) {
        return handleDownload(req, res);
      }
      return res.status(404).send('Not Found');
  }
});
