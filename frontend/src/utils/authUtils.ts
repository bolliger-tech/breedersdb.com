const FE_COOKIE_NAME = 'breedersdb.user';

export function getUserFromCookie() {
  const cookie = document.cookie
    .split(';')
    .find((c) => c.trim().startsWith(`${FE_COOKIE_NAME}=`))
    ?.split('=')[1];
  if (!cookie) {
    return null;
  }
  return JSON.parse(cookie);
}
