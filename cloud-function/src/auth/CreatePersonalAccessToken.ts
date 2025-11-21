import { generateToken, hashToken } from '../lib/crypto';
import { ErrorWithStatus } from '../lib/errors';
import { fetchGraphQL } from '../lib/fetch';
import { combineToPersonalAccessToken } from '../lib/personalAccessToken';
import { InsertPersonalAccessTokenMutation } from '../queries';
import type { ActionProps, ActionResult } from '../types';

type CreatePersonalAccessTokenInput = {
  name?: string;
  expires?: string | null;
};

type CreatePersonalAccessTokenOutput = {
  id: number;
  token: string;
  name: string;
  created: string;
  expires: string | null;
};

export async function CreatePersonalAccessToken({
  input,
  ctx,
}: ActionProps): Promise<ActionResult<CreatePersonalAccessTokenOutput>> {
  const userId = ctx.sessionVariables?.['x-hasura-user-id'];
  if (!userId) {
    throw new ErrorWithStatus(401, 'Unauthorized: User not authenticated');
  }

  const userIdNum = parseInt(userId, 10);
  if (isNaN(userIdNum)) {
    throw new ErrorWithStatus(400, 'Bad Request: Invalid user ID');
  }

  const typedInput = input.object as CreatePersonalAccessTokenInput | undefined;

  // Validate expires if provided
  let expiresAt: Date | null = null;
  if (typedInput?.expires) {
    expiresAt = new Date(typedInput.expires);
    if (isNaN(expiresAt.getTime())) {
      throw new ErrorWithStatus(400, 'Bad Request: Invalid expires date');
    }
    if (expiresAt < new Date()) {
      throw new ErrorWithStatus(
        400,
        'Bad Request: expires must be in the future',
      );
    }
  }
  if (!typedInput?.name) {
    throw new ErrorWithStatus(400, 'Bad Request: name is required');
  }

  // Generate token
  const token = generateToken();
  const tokenHash = hashToken(token);

  // Insert token into database
  const result = await fetchGraphQL({
    query: InsertPersonalAccessTokenMutation,
    variables: {
      user_id: userIdNum,
      token_hash: tokenHash,
      name: typedInput.name,
      expires: expiresAt ? expiresAt.toISOString() : null,
    },
  });

  if (result.errors) {
    const firstError = result.errors[0];
    throw new ErrorWithStatus(400, firstError.message);
  }

  const dbToken = result?.data?.insert_user_tokens_one;
  if (!dbToken) {
    throw new ErrorWithStatus(
      500,
      'Internal Server Error: Failed to create personal access token',
    );
  }

  const pat = combineToPersonalAccessToken({
    tokenId: dbToken.id,
    token, // Return plain token only once
  });

  return {
    response: {
      id: dbToken.id,
      token: pat,
      name: dbToken.name,
      created: dbToken.created,
      expires: dbToken.expires,
    },
  };
}
