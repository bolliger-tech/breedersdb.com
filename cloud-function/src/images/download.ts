import * as ff from '@google-cloud/functions-framework';
import { downloadFile } from '../lib/storage';
import { buffer } from 'node:stream/consumers';
import sharp from 'sharp';

export async function handleDownload(req: ff.Request, res: ff.Response) {
  if (req.method !== 'GET') {
    return res.status(405).send('Method Not Allowed');
  }

  // validate params
  const searchParams = new URLSearchParams(req.url.split('?').pop());
  const fileName = searchParams?.get('file');
  if (!fileName) {
    return res.status(400).send('Bad Request: missing parameter "file"');
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

  if (width || height) {
    buf = await sharp(buf).resize({ width, height, fit: 'inside' }).toBuffer();
  }

  // headers
  // https://cloud.google.com/cdn/docs/caching#expiration
  // > By default, when the expiration time value exceeds 30 days (2,592,000 seconds),
  //   Cloud CDN treats the expiration valueas if it were 2,592,000 seconds.
  // > As an upper bound, cache entries that aren't accessed for 30 days are automatically evicted.
  // => We still set max-age to 1 year to allow for longer caching in the browser
  res.setHeader(
    'Cache-Control',
    `max-age=${60 * 60 * 24 * 365},public,immutable`,
  ); // 1 year
  res.setHeader('Content-Type', 'image/jpeg');

  return res.send(buf);
}
