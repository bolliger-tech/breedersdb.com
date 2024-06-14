// 🍪😋🍪

import * as ff from '@google-cloud/functions-framework';
import { config } from './config';

// TODO: check SameSite
// TODO: check domain
function cookieOptions(httpOnly: boolean, maxAge: number) {
  const secure = config.NODE_ENV !== 'development' ? ' Secure;' : '';
  return `${httpOnly ? 'HttpOnly; ' : ''}SameSite=None;${secure} Max-Age=${maxAge}; Path=/`;
}

// set 2 cookies
// one is httpOnly and defining for auth
// the other is for information purposes for the frontend
// Note: As of Chrome release M104 (August 2022) cookies can no longer set an
// expiration date more than 400 days in the future.
export function setAuthCookies(res: ff.Response, token: string, email: string) {
  const maxAge = 399 * 24 * 60 * 60; // 399 days in seconds
  res.setHeader('Set-Cookie', [
    `token=${token}; ${cookieOptions(true, maxAge)}`,
    `email=${email}; ${cookieOptions(false, maxAge)}`,
  ]);
}

// clear cookies
export function clearAuthCookies(res: ff.Response) {
  res.setHeader('Set-Cookie', [
    `token=; ${cookieOptions(true, 0)}`,
    `email=; ${cookieOptions(false, 0)}`,
  ]);
}

// get token from cookie
export function getTokenFromCookie(req: ff.Request) {
  const cookies = req.headers.cookie;
  if (!cookies) {
    return null;
  }
  const token = cookies.split(';').find((c) => c.trim().startsWith('token='));
  return token ? token.split('=')[1] : null;
}
