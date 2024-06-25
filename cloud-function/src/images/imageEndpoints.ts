import * as ff from '@google-cloud/functions-framework';
import { authenticateRequest } from '..';
import { hashFile } from '../lib/crypto';
import { config } from '../lib/config';
import { downloadFile, uploadFile } from '../lib/storage';
import { buffer } from 'node:stream/consumers';
import sharp from 'sharp';

const IMG_MAX_SIZE_MB = 16;

// Max uncompressed HTTP request size: 32MB
// https://cloud.google.com/functions/quotas#resource_limits
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

  // validate and convert image
  let image;
  try {
    image = await sharp(req.body)
      .rotate() // auto rotate based on exif data
      .jpeg({ quality: 90 }) // convert to jpeg
      .toBuffer();
  } catch (e) {
    console.error('Error parsing image', e);
  }
  if (!image) {
    res.status(500).send('Error parsing image');
    return;
  }

  // check image size
  if (image.length > IMG_MAX_SIZE_MB * 1024 * 1024) {
    res.status(400).send(`Image too large, max ${IMG_MAX_SIZE_MB}MB`);
    return;
  }

  const fileHash = hashFile(image);
  const storageFileName = `${fileHash}.jpeg`;

  const originalFileName =
    (req.headers?.['x-file-name'] as string)?.split('.').shift() || 'unknown';
  // TODO url
  const url = `http://localhost:8090/images/${originalFileName}.jpeg?file=${storageFileName}`;

  try {
    await uploadFile(file, storageFileName);
    return res.send({ fileName: storageFileName, url });
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

  const searchParams = new URLSearchParams(req.url.split('?').pop());
  const fileName = searchParams?.get('file');
  if (!fileName) {
    return res.status(400).send('Bad Request: missing parameter "file"');
  }

  const file = downloadFile(fileName);
  let buf;
  try {
    buf = await buffer(file);
  } catch (e: any) {
    if (e.message.includes('No such object')) {
      return res.status(404).send('Not Found');
    }
    console.error('Error downloading file:', e);
    return res.status(500).send('Internal Server Error');
  }

  const [hasWidth, hasHeight] = [
    searchParams.has('width'),
    searchParams.has('height'),
  ];
  const [width, height] = [
    hasWidth ? parseInt(searchParams?.get('width') || '') : undefined,
    hasHeight ? parseInt(searchParams?.get('height') || '') : undefined,
  ];
  if (
    (hasWidth && isNaN(width || NaN)) ||
    (hasHeight && isNaN(height || NaN))
  ) {
    return res
      .status(400)
      .send('Bad Request: width and height must be numbers');
  }

  if (width || height) {
    buf = await sharp(buf).resize({ width, height, fit: 'inside' }).toBuffer();
  }

  // TODO cache control
  res.setHeader('Content-Type', 'image/jpeg');

  return res.send(buf);
}
