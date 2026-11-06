import * as ff from '@google-cloud/functions-framework';
import { buffer } from 'node:stream/consumers';
import { downloadFile } from '../lib/storage';
import {
  ATTACHMENT_FILE_NAME_REGEX,
  ATTACHMENT_STORAGE_PREFIX,
} from './fileName';
import { getContentHeaders } from './contentHeaders';

const PATH_PREFIX = '/attachments/';

export async function handleAttachmentDownload(
  req: ff.Request,
  res: ff.Response,
) {
  if (req.method !== 'GET') {
    return res.status(405).send('Method Not Allowed');
  }

  const [path, query] = req.url.split('?');
  const fileName = new URLSearchParams(query).get('file');
  if (!fileName || !ATTACHMENT_FILE_NAME_REGEX.test(fileName)) {
    return res.status(400).send('Bad Request: invalid parameter "file"');
  }

  let displayName;
  try {
    displayName = decodeURIComponent(path.slice(PATH_PREFIX.length));
  } catch {
    return res.status(400).send('Bad Request: invalid file name');
  }

  let buf;
  try {
    buf = await buffer(downloadFile(ATTACHMENT_STORAGE_PREFIX + fileName));
  } catch (e: any) {
    if (e.code === 404 || e.message.includes('No such object')) {
      return res.status(404).send('Not Found');
    }
    console.error('Error downloading file:', e);
    return res.status(500).send('Internal Server Error');
  }

  // see images/download.ts for the caching rationale
  res.setHeader(
    'Cache-Control',
    `max-age=${60 * 60 * 24 * 365},public,immutable`,
  ); // 1 year
  for (const [name, value] of Object.entries(
    getContentHeaders(fileName, displayName),
  )) {
    res.setHeader(name, value);
  }
  res.setHeader('X-Content-Type-Options', 'nosniff');

  return res.send(buf);
}
