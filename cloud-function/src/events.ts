import * as ff from '@google-cloud/functions-framework';
import { ErrorWithStatus } from './lib/errors';
import { config } from './lib/config';
import { pruneImages } from './images/prune';
import { pruneAttachments } from './attachments/prune';
import { validateBackendAuth } from './auth/validateBackendAuth';
import type { EventResult } from './types';

export async function handleEvents(req: ff.Request, res: ff.Response) {
  try {
    // only access from hasura is allowed
    if (!validateBackendAuth(req)) {
      throw new ErrorWithStatus(401, 'Unauthorized');
    }

    const body = req.body;
    if (!body) {
      throw new ErrorWithStatus(400, 'Bad Request');
    }

    let result: EventResult<unknown>;
    switch (body.name) {
      // prunes all assets, the name is kept for the existing cron trigger
      case 'PruneImages':
        result = {
          response: {
            images: await pruneImages(),
            attachments: await pruneAttachments(),
          },
        };
        break;
      default:
        console.error('unknown event:', body);
        throw new ErrorWithStatus(404, 'Not Found');
    }

    if (config.LOG_REQUESTS) {
      console.log('event result:', result);
      console.log('------------------------');
    }

    if (result.headers) {
      for (const [key, value] of Object.entries(result.headers)) {
        res.setHeader(key, value);
      }
    }

    return res.send(result.response);
  } catch (err) {
    if (err instanceof ErrorWithStatus) {
      console.error(err);
      res.status(err.status).send(err.toGraphQL());
    } else {
      console.error('Unknown error in handleEvents:', err);
      const error = new ErrorWithStatus(500, 'Internal Server Error');
      res.status(error.status).send(error.toGraphQL());
    }
  }
}
