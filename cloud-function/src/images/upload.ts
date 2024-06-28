import * as ff from '@google-cloud/functions-framework';
import { hashFileForStorage } from '../lib/crypto';
import { config } from '../lib/config';
import { uploadFile } from '../lib/storage';
import sharp from 'sharp';
import { authenticateRequest } from '../auth/authenticateRequest';

const IMG_MAX_SIZE_MB = 16;

// Max uncompressed HTTP request size: 32MB
// https://cloud.google.com/functions/quotas#resource_limits
export async function handleUpload(req: ff.Request, res: ff.Response) {
  if (req.method !== 'POST') {
    return res.status(405).send('Method Not Allowed');
  }

  const auth = await authenticateRequest(req.headers.cookie);
  if (!auth) {
    return res.status(401).send('Unauthorized');
  }

  const file = req.body;
  if (config.LOG_REQUESTS) {
    console.log('received:', file);
  }

  // validate image
  let image: Buffer | undefined;
  try {
    const buffer = Buffer.from(req.body);

    const imageMeta = await sharp(buffer).metadata();
    if (!imageMeta) {
      return res.status(400).send('Invalid image');
    }
    if (imageMeta.format !== 'jpeg') {
      return res.status(400).send('Invalid image format, must be JPEG');
    }

    image = buffer;
  } catch (e: any) {
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

  const fileHash = hashFileForStorage(image);
  const fileHashFromClient = req.headers['x-file-hash'] as string;
  if (fileHash !== fileHashFromClient) {
    return res.status(400).send('Hash mismatch');
  }

  const storageFileName = `${fileHash}.jpg`;

  const originalFileName =
    (req.headers?.['x-file-name'] as string)?.split('.').shift() || 'unknown';
  const url = `/api/assets/images/${originalFileName}.jpg?file=${storageFileName}`;

  try {
    await uploadFile(file, storageFileName);
    return res.send({ fileName: storageFileName, url });
  } catch (e) {
    console.error('Error uploading file:', e);
    return res.status(500).send('Internal Server Error');
  }
}
