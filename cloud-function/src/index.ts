import * as ff from '@google-cloud/functions-framework';

import { hashToken, timingSafeEqual } from './lib/crypto';
import { handleActions } from './actions';
import { UserTokenQuery } from './queries';
import { getTokenFromCookies } from './lib/cookies';
import { fetchGraphQL } from './lib/fetch';
import { config } from './lib/config';

// check actions/SignIn.ts for more details
export async function authenticateRequest(
  cookie: string | undefined,
): Promise<{ userId: number; tokenId: number } | null> {
  const cookiePayload = getTokenFromCookies(cookie);
  if (!cookiePayload) {
    return null;
  }

  const dbToken = await fetchGraphQL({
    query: UserTokenQuery,
    variables: {
      token_id: cookiePayload.tokenId,
    },
  }).then((data) => data?.data?.user_tokens?.[0]);
  if (!dbToken) {
    return null;
  }

  const tokenHash = hashToken(cookiePayload.token);

  if (!timingSafeEqual(dbToken.token_hash, tokenHash)) {
    return null;
  }

  return {
    userId: dbToken.user_id,
    tokenId: cookiePayload.tokenId,
  };
}

// https://hasura.io/docs/latest/auth/authentication/unauthenticated-access/
async function authenticateHasuraRequest(req: ff.Request, res: ff.Response) {
  const auth = await authenticateRequest(req.headers.cookie);
  if (!auth) {
    return res.send({
      'X-Hasura-Role': 'unauthorized',
    });
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
    default:
      return res.status(404).send('Not Found');
  }
});
