const TOKEN_ID_DIGITS = 12;

export function combineToPersonalAccessToken({
  tokenId,
  token,
}: {
  tokenId: number;
  token: string;
}): string {
  const tokenIdStr = tokenId.toString().padStart(TOKEN_ID_DIGITS, '0');
  return `${tokenIdStr}${token}`;
}

export function splitPersonalAccessToken(
  pat: string,
): { tokenId: number; token: string } | null {
  const tokenIdStr = pat.slice(0, TOKEN_ID_DIGITS);
  const token = pat.slice(TOKEN_ID_DIGITS);
  const tokenId = parseInt(tokenIdStr, 10);
  if (isNaN(tokenId) || !token) {
    return null;
  }
  return { tokenId, token };
}
