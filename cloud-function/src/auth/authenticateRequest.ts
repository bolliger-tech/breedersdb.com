import { hashToken, timingSafeEqual } from '../lib/crypto';
import { UserTokenQuery } from '../queries';
import { getTokenFromCookies } from '../lib/cookies';
import { fetchGraphQL } from '../lib/fetch';

// check actions/SignIn.ts for more details
export async function authenticateRequest(cookie: string | undefined): Promise<{
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
  const cookiePayload = getTokenFromCookies(cookie);
  if (!cookiePayload) {
    return null;
  }

  const dbToken = await fetchGraphQL({
    query: UserTokenQuery,
    variables: {
      token_id: cookiePayload.tokenId,
    },
  }).then((data) => data?.data?.user_tokens_by_pk);
  if (!dbToken) {
    return null;
  }

  const tokenHash = hashToken(cookiePayload.token);

  if (!timingSafeEqual(dbToken.token_hash, tokenHash)) {
    return null;
  }

  return {
    userId: dbToken.user_id,
    dbToken: dbToken,
    cookiePayload,
  };
}
