import * as ff from '@google-cloud/functions-framework';
import { timingSafeEqual } from '../lib/crypto';
import { config } from '../lib/config';

// validates requests from hasura, which do not (neccessarily) have a user cookie
export function validateBackendAuth(req: ff.Request) {
  return (
    typeof req.headers['x-cloud-function-secret'] === 'string' &&
    timingSafeEqual(
      req.headers['x-cloud-function-secret'],
      config.CLOUD_FUNCTION_SECRET,
    )
  );
}
