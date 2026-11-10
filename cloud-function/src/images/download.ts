import * as ff from '@google-cloud/functions-framework';
import { getCachedImageAsBuffer } from '../lib/image';
import { setImmutableCacheControl } from '../lib/cacheControl';
import { isNotFoundError } from '../lib/storage';
import { imageCacheConfig } from './cache';
import { IMAGE_FILE_NAME_REGEX } from './fileName';

export async function handleImageDownload(req: ff.Request, res: ff.Response) {
  if (req.method !== 'GET') {
    return res.status(405).send('Method Not Allowed');
  }

  // validate params
  const searchParams = new URLSearchParams(req.url.split('?').pop());
  const fileName = searchParams?.get('file');
  if (!fileName) {
    return res.status(400).send('Bad Request: missing parameter "file"');
  }
  if (!IMAGE_FILE_NAME_REGEX.test(fileName)) {
    return res.status(400).send('Bad Request: invalid parameter "file"');
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
    (hasWidth && (isNaN(width || NaN) || !width || width < 1)) ||
    (hasHeight && (isNaN(height || NaN) || !height || height < 1))
  ) {
    return res
      .status(400)
      .send('Bad Request: width and height must be numbers and greater than 0');
  }

  let buf;
  try {
    buf = await getCachedImageAsBuffer({
      fileName,
      width,
      height,
      config: imageCacheConfig,
    });
  } catch (e: any) {
    if (isNotFoundError(e)) {
      return res.status(404).send('Not Found');
    }
    console.error('Error downloading file:', e);
    return res.status(500).send('Internal Server Error');
  }

  setImmutableCacheControl(res);
  res.setHeader('Content-Type', 'image/jpeg');

  return res.send(buf);
}
