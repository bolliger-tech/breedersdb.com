import { validateFrontendAuth } from './validateFrontendAuth';
import { ErrorWithStatus } from '../lib/errors';
import type { ActionProps, ActionResult } from '../types';
import { validatePersonalAccessToken } from './validatePersonalAccessToken';

type MeOutput = {
  id: number;
};

export async function Me({
  ctx,
}: ActionProps): Promise<ActionResult<MeOutput>> {
  const auth =
    (await validatePersonalAccessToken(ctx.req.headers.authorization)) ||
    (await validateFrontendAuth(ctx.req.headers.cookie));
  if (!auth) {
    throw new ErrorWithStatus(401, 'Unauthorized');
  }

  return {
    response: {
      id: auth.userId,
    },
  };
}
