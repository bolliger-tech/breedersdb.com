const FE_COOKIE_NAME = 'breedersdb.user';

type CookieUser = {
  id: number;
  email: string;
};

export function getUserFromCookie(): CookieUser | null {
  const cookie = document.cookie
    .split(';')
    .find((c) => c.trim().startsWith(`${FE_COOKIE_NAME}=`))
    ?.split('=')[1];
  if (!cookie) {
    return null;
  }
  return JSON.parse(cookie);
}
