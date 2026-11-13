import * as ff from '@google-cloud/functions-framework';

import { handleActions } from './actions';
import { config } from './lib/config';
import { handleUpload } from './lib/upload';
import { imageUploadConfig } from './images/upload';
import { attachmentUploadConfig } from './attachments/upload';
import { handleImageDownload } from './images/download';
import { handleAttachmentDownload } from './attachments/download';
import { authenticateHasuraRequest } from './auth/authenticateHasuraRequest';
import { handleEvents } from './events';

ff.http('func', (req: ff.Request, res: ff.Response) => {
  if (config.LOG_REQUESTS) {
    console.log('req:', { headers: req.headers, url: req.url, body: req.body });
  }
  const path = req.url.split('?')[0].split('/');
  switch (path[1]) {
    case 'authenticate-hasura-request':
      return authenticateHasuraRequest(req, res);
    case 'actions':
      return handleActions(req, res);
    case 'events':
      return handleEvents(req, res);
    case 'health':
      return res.send('🫛🌱🌳🍎');
    case 'upload':
      if (path[2] === 'images') {
        return handleUpload(req, res, imageUploadConfig);
      }
      if (path[2] === 'attachments') {
        return handleUpload(req, res, attachmentUploadConfig);
      }
      return res.status(404).send('Not Found');
    case 'images':
      return handleImageDownload(req, res);
    case 'attachments':
      return handleAttachmentDownload(req, res);
    default:
      return res.status(404).send('Not Found');
  }
});
