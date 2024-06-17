import * as ff from '@google-cloud/functions-framework';

import {
  generateToken,
  hashToken,
  timingSafeEqual,
  verifyPassword,
} from './crypto';
import { handleActions } from './actions';
import {
  DeleteUserTokenMutation,
  InsertUserTokenMutation,
  UserQuery,
  UserTokenQuery,
} from './queries';
import { config } from './config';
import {
  clearAuthCookies,
  getTokenFromCookie,
  setAuthCookies,
} from './cookies';
import { fetchGraphQL } from './fetch';

async function signIn(req: ff.Request, res: ff.Response) {
  const auth = await authenticateRequest(req);
  if (auth) {
    return res.status(200).send('Already signed in');
  }

  // validate request
  let data = req.body;
  // in development, allow query params
  if (config.NODE_ENV === 'development' && Object.keys(data).length === 0) {
    data = req.query;
  }
  if (!data) {
    return res.status(400).send('Bad Request');
  }
  const { email, password } = data;
  if (!email || !password) {
    return res.status(400).send('Bad Request');
  }

  // get user
  const user = await fetchGraphQL({
    query: UserQuery,
    variables: {
      email,
    },
  }).then((data) => data.data.users[0]);
  if (!user) {
    return res.status(404).send('Not Found');
  }

  // verify password
  const verified = await verifyPassword(password, user.password_hash);
  if (!verified) {
    return res.status(401).send('Unauthorized');
  }

  // token
  const token = generateToken();
  const tokenHash = hashToken(token);

  const result = await fetchGraphQL({
    query: InsertUserTokenMutation,
    variables: {
      user_id: user.id,
      token_hash: tokenHash,
      type: 'cookie',
    },
  });
  if (result.errors) {
    console.error(result.errors);
    return res.status(500).send('Internal Server Error');
  }
  const tokenId = result.data.insert_user_tokens_one.id;
  if (!tokenId) {
    return res.status(500).send('Internal Server Error');
  }

  // set cookies
  setAuthCookies(res, tokenId, token, email);

  res.send('Welcome!');
}

async function authenticateRequest(
  req: ff.Request,
): Promise<{ userId: number; tokenId: number } | null> {
  const cookiePayload = getTokenFromCookie(req);
  if (!cookiePayload) {
    return null;
  }

  const result = await fetchGraphQL({
    query: UserTokenQuery,
    variables: {
      token_id: cookiePayload.tokenId,
    },
  });
  if (result.errors) {
    console.error(result.errors);
    return null;
  }
  const dbToken = result.data.user_tokens[0];
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

async function signOut(req: ff.Request, res: ff.Response) {
  const auth = await authenticateRequest(req);
  if (!auth) {
    return res.status(401).send('Unauthorized');
  }

  const result = await fetchGraphQL({
    query: DeleteUserTokenMutation,
    variables: {
      token_id: auth.tokenId,
    },
  });
  if (result.errors) {
    console.error(result.errors);
    return res.status(500).send('Internal Server Error');
  }

  clearAuthCookies(res);

  res.send('Goodbye!');
}

async function authenticateHasuraRequest(req: ff.Request, res: ff.Response) {
  const auth = await authenticateRequest(req);
  if (!auth) {
    return res.status(401).send('Unauthorized');
  }

  return res.send({
    'X-Hasura-User-Id': auth.userId.toString(),
    'X-Hasura-Role': 'user',
  });
}

ff.http('auth', (req: ff.Request, res: ff.Response) => {
  switch (req.url.split('/')[1].split('?')[0]) {
    case 'sign-in':
      return signIn(req, res);
    case 'sign-out':
      return signOut(req, res);
    case 'authenticate-hasura-request':
      return authenticateHasuraRequest(req, res);
    case 'actions':
      return handleActions(req, res);
    default:
      return res.status(404).send('Not Found');
  }
});
