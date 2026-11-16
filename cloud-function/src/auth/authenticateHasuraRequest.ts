import * as ff from '@google-cloud/functions-framework';
import { authenticateUser } from './authenticateUser';

// authentication hook for hasura: decides if a request to hasura is allowed
// https://hasura.io/docs/latest/auth/authentication/unauthenticated-access/
export async function authenticateHasuraRequest(
  req: ff.Request,
  res: ff.Response,
) {
  const requestCookies = req.body.headers.Cookie || req.body.headers.cookie;
  const authorization =
    req.body.headers.Authorization || req.body.headers.authorization;
  const operationName = req.body.request?.operationName;

  const auth = await authenticateUser(requestCookies, authorization, res);

  // allow SignIn with an invalid cookie, so a stale cookie can't lock users out
  if (
    auth.status === 'invalid-pat' ||
    (auth.status === 'invalid-cookie' && operationName !== 'SignIn')
  ) {
    // unfortunately, the Set-Cookie header is only forwarded by hasura
    // in the success case (200), not in the error case (401), so we can't
    // clear the cookie here
    return res.status(401).send('Unauthorized: Invalid token!');
  }

  if (auth.status !== 'authenticated') {
    return res.send({
      'X-Hasura-Role': 'public',
    });
  }

  return res.send({
    'X-Hasura-User-Id': auth.userId.toString(),
    'X-Hasura-Role': 'user',
  });
}
