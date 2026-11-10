import * as ff from '@google-cloud/functions-framework';
import { pipeline } from 'node:stream';
import { downloadFile, getFileSize, isNotFoundError } from '../lib/storage';
import {
  ATTACHMENT_FILE_NAME_REGEX,
  ATTACHMENT_STORAGE_PREFIX,
} from './fileName';
import { getContentHeaders } from './contentHeaders';
import { parseRange } from './range';
import { setImmutableCacheControl } from '../lib/cacheControl';

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

  const storageFileName = ATTACHMENT_STORAGE_PREFIX + fileName;

  let size;
  try {
    size = await getFileSize(storageFileName);
  } catch (e: any) {
    if (isNotFoundError(e)) {
      return res.status(404).send('Not Found');
    }
    console.error('Error downloading file:', e);
    return res.status(500).send('Internal Server Error');
  }

  // ranges are needed to play media inline in Safari
  res.setHeader('Accept-Ranges', 'bytes');
  const range = parseRange(req.headers.range, size);
  if (range === 'unsatisfiable') {
    res.setHeader('Content-Range', `bytes */${size}`);
    return res.status(416).end();
  }

  setImmutableCacheControl(res);
  res.set(getContentHeaders(fileName, displayName));
  res.setHeader('X-Content-Type-Options', 'nosniff');

  if (range) {
    res.status(206);
    res.setHeader('Content-Range', `bytes ${range.start}-${range.end}/${size}`);
  }
  res.setHeader('Content-Length', range ? range.end - range.start + 1 : size);

  // unlike pipe(), this also closes the storage stream if the client aborts,
  // which browsers do all the time when seeking in media
  pipeline(downloadFile(storageFileName, range), res, (e) => {
    if (e && e.code !== 'ERR_STREAM_PREMATURE_CLOSE') {
      console.error('Error downloading file:', e);
    }
  });
}
