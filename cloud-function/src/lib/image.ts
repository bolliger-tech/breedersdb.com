import sharp from 'sharp';
import { downloadFile, uploadFile } from './storage';
import { buffer } from 'node:stream/consumers';

// corresponds to a bucket lifecycle rule
// that deletes files after some time.
// see deployment for details.
const CACHE_PREFIX = 'cached-';

export async function getCachedImageAsBuffer({
  fileName,
  width,
  height,
}: {
  fileName: string;
  width?: number;
  height?: number;
}) {
  return width || height
    ? await getResized({ fullSizeFileName: fileName, width, height })
    : await getFullSize(fileName);
}

async function getFullSize(fileName: string) {
  const file = downloadFile(fileName);
  return await buffer(file);
}

async function getResized({
  fullSizeFileName,
  width,
  height,
}: {
  fullSizeFileName: string;
  width?: number;
  height?: number;
}) {
  if (typeof width !== 'undefined' && width <= 0)
    throw new Error(`Width must be > 0.`);
  if (typeof height !== 'undefined' && height <= 0)
    throw new Error(`Height must be > 0.`);
  if (!width && !height) throw new Error('Either width or height must be set.');

  const [hash, ext] = fullSizeFileName.split('.');
  const resizedFileName = `${CACHE_PREFIX}-${hash}-${width ?? 0}x${height ?? 0}.${ext}`;

  const resizedFile = downloadFile(resizedFileName);
  const fullSizeFile = downloadFile(fullSizeFileName);

  try {
    return await buffer(resizedFile);
  } catch (e: any) {
    if (e.message.includes('No such object')) {
      // if the file doesn't exist, we'll continue
    } else {
      throw e;
    }
  }

  // let it throw on error (e.g. file not found)
  const fullSize = await buffer(fullSizeFile);
  const resized = await sharp(fullSize)
    .resize({ width, height, fit: 'inside' })
    .toBuffer();

  try {
    // store the resized image for future requests
    await uploadFile(resized, resizedFileName);
  } catch (e) {
    console.warn('Failed to store resized image:', e);
  }

  return resized;
}
