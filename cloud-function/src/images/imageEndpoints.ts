import * as ff from '@google-cloud/functions-framework';
import { authenticateRequest } from '..';
import { hashFile } from '../lib/crypto';
import { config } from '../lib/config';
import { downloadFile, uploadFile } from '../lib/storage';
import { buffer } from 'node:stream/consumers';

// TODO body parser size limit
export async function handleUpload(req: ff.Request, res: ff.Response) {
  if (['POST', 'OPTIONS'].includes(req.method) === false) {
    return res.status(405).send('Method Not Allowed');
  }
  // TODO url
  res.setHeader('Access-Control-Allow-Origin', 'http://localhost:9000');
  res.setHeader('Access-Control-Allow-Methods', 'POST');
  res.setHeader('Access-Control-Allow-Headers', [
    'Content-Type',
    'X-File-Name',
  ]);
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  // TODO should OPTION requests be authenticated? makes for a bad error message
  // (unknown) in xhr requests but otherwise it seems the server first has to
  // receive the payload before it can respond with a 401
  if (req.method === 'OPTIONS') {
    return res.send();
  }

  // TODO scope: get bucket for user
  const auth = await authenticateRequest(req.headers.cookie);
  if (!auth) {
    return res.status(401).send('Unauthorized');
  }

  const file = req.body;
  if (config.LOG_REQUESTS) {
    console.log('received:', file);
  }

  // TODO validate file
  const suffix =
    (req.headers?.['x-file-name'] as string)?.split('.').pop() || 'unknown';
  const fileName = `${hashFile(file)}.${suffix}`;

  try {
    await uploadFile(file, fileName);
    // TODO url
    const url = `http://localhost:8090/images/${fileName}`;
    return res.send({ fileName, url });
  } catch (e) {
    console.error('Error uploading file:', e);
    return res.status(500).send('Internal Server Error');
  }
}

export async function handleDownload(req: ff.Request, res: ff.Response) {
  if (['GET'].includes(req.method) === false) {
    return res.status(405).send('Method Not Allowed');
  }

  // TODO scope: check if use has access to bucket
  const auth = await authenticateRequest(req.headers.cookie);
  if (!auth) {
    return res.status(401).send('Unauthorized');
  }

  const fileName = req.url.split('/').pop();
  if (!fileName) {
    return res.status(400).send('Bad Request');
  }

  // stream from google storage to response
  // TODO handle errors
  const file = downloadFile(fileName);
  const buf = await buffer(file);

  // TODO cache control
  // TODO fix mime type
  res.setHeader('Content-Type', 'image/jpeg');

  return res.send(buf);
}
