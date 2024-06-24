import { authenticateRequest } from '..';
import { ErrorWithStatus } from '../lib/errors';
import type { ActionProps, ActionResult } from './types';

type MeOutput = {
  id: number;
};

export async function Me({
  ctx,
}: ActionProps): Promise<ActionResult<MeOutput>> {
  const auth = await authenticateRequest(ctx.req.headers.cookie);
  if (!auth) {
    throw new ErrorWithStatus(401, 'Unauthorized');
  }

  return {
    response: {
      id: auth.userId,
    },
  };
}
