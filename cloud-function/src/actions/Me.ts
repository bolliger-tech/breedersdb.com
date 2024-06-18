import { authenticateRequest } from '..';
import { ErrorWithStatus } from '../lib/errors';
import type { ActionProps, ActionResult } from './types';

export async function Me({ ctx }: ActionProps): Promise<ActionResult> {
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
