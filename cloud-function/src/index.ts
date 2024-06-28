import * as ff from '@google-cloud/functions-framework';

import { handleActions } from './actions';
import { config } from './lib/config';
import { handleUpload } from './images/upload';
import { handleDownload } from './images/download';
import { authenticateHasuraRequest } from './auth/authenticateHasuraRequest';

ff.http('func', (req: ff.Request, res: ff.Response) => {
  if (config.LOG_REQUESTS) {
    console.log('req:', { headers: req.headers, url: req.url, body: req.body });
  }
  switch (req.url.split('/')[1].split('?')[0]) {
    case 'authenticate-hasura-request':
      return authenticateHasuraRequest(req, res);
    case 'actions':
      return handleActions(req, res);
    case 'health':
      return res.send('🫛🌱🌳🍎');
    case 'upload':
      return handleUpload(req, res);
    default:
      if (req.url.startsWith('/images/')) {
        return handleDownload(req, res);
      }
      return res.status(404).send('Not Found');
  }
});
