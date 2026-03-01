import { hashToken, timingSafeEqual } from '../lib/crypto';
import { UserTokenQuery } from '../queries';
import { getTokenFromCookies, getUserFromCookies } from '../lib/cookies';
import { fetchGraphQL } from '../lib/fetch';

// validates requests directly from the frontend or from hasura by checking the
// user's cookie.
//
// see actions/SignIn.ts for more details
export async function validateFrontendAuth(
  requestCookies: string | undefined,
): Promise<{
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
  const tokenCookieData = getTokenFromCookies(requestCookies);
  const userCookieData = getUserFromCookies(requestCookies);
  if (!tokenCookieData || !userCookieData) {
    return null;
  }

  const dbToken = await fetchGraphQL({
    query: UserTokenQuery,
    variables: {
      token_id: tokenCookieData.tokenId,
    },
  }).then((data) => data?.data?.user_tokens_by_pk);
  if (!dbToken) {
    return null;
  }

  const tokenHash = hashToken(tokenCookieData.token);

  if (!timingSafeEqual(dbToken.token_hash, tokenHash)) {
    return null;
  }

  return {
    userId: dbToken.user_id,
    dbToken: dbToken,
    cookiePayload: tokenCookieData,
  };
}
