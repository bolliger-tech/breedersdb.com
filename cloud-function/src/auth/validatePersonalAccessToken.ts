import { hashToken, timingSafeEqual } from '../lib/crypto';
import { UserTokenQuery } from '../queries';
import { fetchGraphQL } from '../lib/fetch';
import { splitPersonalAccessToken } from '../lib/personalAccessToken';

// validates requests using personal access tokens from Authorization header
export async function validatePersonalAccessToken(
  authorizationHeader: string | undefined,
): Promise<{
  userId: number;
  dbToken: {
    id: number;
    name: string;
    user_id: number;
    type: string;
    last_verify: string | null;
    expires: string | null;
  };
} | null> {
  if (!authorizationHeader) {
    return null;
  }

  // Extract token from "Bearer <token>" format
  const bearerMatch = authorizationHeader.match(/^Bearer\s+(.+)$/i);
  if (!bearerMatch || !bearerMatch[1]) {
    return null;
  }

  const pat = bearerMatch[1].trim();
  const parts = splitPersonalAccessToken(pat);
  if (!parts) {
    return null;
  }
  const { tokenId, token } = parts;

  const dbToken = await fetchGraphQL({
    query: UserTokenQuery,
    variables: {
      token_id: tokenId,
    },
  }).then((data) => data?.data?.user_tokens_by_pk);

  if (!dbToken) {
    return null;
  }

  if (dbToken.type !== 'pat') {
    return null;
  }

  if (dbToken.expires) {
    const expiresAt = new Date(dbToken.expires);
    const now = new Date();
    if (now > expiresAt) {
      return null;
    }
  }

  const tokenHash = hashToken(token);
  if (!timingSafeEqual(tokenHash, dbToken.token_hash)) {
    return null;
  }

  const { token_hash, ...dbTokenWithoutHash } = dbToken;

  return {
    userId: dbToken.user_id,
    dbToken: dbTokenWithoutHash,
  };
}
