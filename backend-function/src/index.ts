import * as ff from '@google-cloud/functions-framework';

import { verifyPassword } from './crypto';
import { handleActions } from './actions';
import { UserQuery } from './queries';
import { config } from './config';

async function signIn(req: ff.Request, res: ff.Response) {
  const data = req.body;
  if (!data) {
    return res.status(400).send('Bad Request');
  }
  const { email, password } = data;
  if (!email || !password) {
    return res.status(400).send('Bad Request');
  }

  const user = await fetch(config.HASURA_GRAPHQL_URL, {
    method: 'POST',
    headers: {
      'x-hasura-admin-secret': config.HASURA_GRAPHQL_ADMIN_SECRET,
    },
    body: JSON.stringify({
      query: UserQuery,
      variables: {
        email,
      },
    }),
  })
    .then((res) => res.json())
    .then((data) => data.data.users[0]);

  if (!user) {
    return res.status(404).send('Not Found');
  }

  const verified = await verifyPassword(password, user.password_hash);

  if (!verified) {
    return res.status(401).send('Unauthorized');
  }

  // TODO: generate & save token
  // TODO: set cookie
  res.send('Welcome!');
}

function signOut(req: ff.Request, res: ff.Response) {
  // TODO: delete token
  // TODO: clear cookie
  res.send('Goodbye!');
}

function authenticateHasuraRequest(req: ff.Request, res: ff.Response) {
  console.log('auth:', req.headers);
  // TODO:
  // read token
  // search in DB
  // respond with X-Hasura-User-Id & X-Hasura-Role
  //return res.send({
  //  'X-Hasura-User-Id': '1',
  //  'X-Hasura-Role': 'user',
  //});
  return res.status(401).send('Unauthorized');
}

ff.http('auth', (req: ff.Request, res: ff.Response) => {
  console.log('req to:', req.url);
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
