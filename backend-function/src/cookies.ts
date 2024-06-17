// 🍪😋🍪

import * as ff from '@google-cloud/functions-framework';
import { config } from './config';

// As of Chrome release M104 (August 2022) cookies can no longer set an
// expiration date more than 400 days in the future.
const MAX_AGE = 399 * 24 * 60 * 60; // 399 days in seconds

const TOKEN_COOKIE_NAME = 'breedersdb.id.token';
const FE_COOKIE_NAME = 'breedersdb.user';

// TODO: check SameSite
// TODO: check domain
function cookieOptions(httpOnly: boolean, maxAge: number) {
  const secure = config.NODE_ENV !== 'development' ? ' Secure;' : '';
  return `${httpOnly ? 'HttpOnly; ' : ''}SameSite=None;${secure} Max-Age=${maxAge}; Path=/`;
}

// set 2 cookies
// one is httpOnly and defining for auth
// the other is for information purposes for the frontend
export function setAuthCookies(
  res: ff.Response,
  tokenId: string,
  token: string,
  email: string,
) {
  res.setHeader('Set-Cookie', [
    `${TOKEN_COOKIE_NAME}=${tokenId}.${token}; ${cookieOptions(true, MAX_AGE)}`,
    `${FE_COOKIE_NAME}=${JSON.stringify({ email })}; ${cookieOptions(false, MAX_AGE)}`,
  ]);
}

// clear cookies
export function clearAuthCookies(res: ff.Response) {
  res.setHeader('Set-Cookie', [
    `${TOKEN_COOKIE_NAME}=; ${cookieOptions(true, 0)}`,
    `${FE_COOKIE_NAME}=; ${cookieOptions(false, 0)}`,
  ]);
}

// get token from cookie
export function getTokenFromCookie(req: ff.Request) {
  const cookies = req.headers.cookie;
  if (!cookies) {
    return null;
  }
  const idAndToken = cookies
    .split(';')
    .find((c) => c.trim().startsWith(`${TOKEN_COOKIE_NAME}=`));

  const [tokenIdString, token] = idAndToken
    ? idAndToken.split('=')[1].split('.')
    : [null, null];

  const tokenId = tokenIdString ? parseInt(tokenIdString, 10) : null;

  return tokenId && token ? { tokenId, token } : null;
}
