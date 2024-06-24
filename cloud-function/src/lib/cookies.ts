// 🍪😋🍪

import { config } from './config';

// As of Chrome release M104 (August 2022) cookies can no longer set an
// expiration date more than 400 days in the future.
const MAX_AGE = 399 * 24 * 60 * 60; // 399 days in seconds

export const ROLL_EVERY_SECONDS = 60 * 60; // 1 hour

const TOKEN_COOKIE_NAME = 'breedersdb.id.token';
const FE_COOKIE_NAME = 'breedersdb.user';

// TODO: check SameSite
// TODO: check domain
// eg. (true, MAX_AGE): HttpOnly; SameSite=None; Max-Age=34473600; Path=/
// eg. (false, MAX_AGE): SameSite=None; Max-Age=34473600; Path=/
function cookieOptions(httpOnly: boolean, maxAge: number) {
  return [
    httpOnly ? 'HttpOnly' : null,
    'SameSite=None',
    'Secure',
    `Max-Age=${maxAge}`,
    'Path=/',
  ]
    .filter(Boolean)
    .join('; ');
}

// set 2 cookies
// one is httpOnly and defining for auth
// the other is for information purposes for the frontend
export function createAuthCookies(
  tokenId: number,
  token: string,
  email: string,
) {
  return [
    `${TOKEN_COOKIE_NAME}=${tokenId}.${token}; ${cookieOptions(true, MAX_AGE)}`,
    `${FE_COOKIE_NAME}=${JSON.stringify({ email })}; ${cookieOptions(false, MAX_AGE)}`,
  ];
}

export function createClearAuthCookies() {
  return [
    `${TOKEN_COOKIE_NAME}=; ${cookieOptions(true, 0)}`,
    `${FE_COOKIE_NAME}=; ${cookieOptions(false, 0)}`,
  ];
}

export function getTokenFromCookies(cookies: string | undefined) {
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
