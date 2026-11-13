import * as ff from '@google-cloud/functions-framework';
import { hashFileForStorage } from './crypto';
import { uploadFile } from './storage';
import { validateFrontendAuth } from '../auth/validateFrontendAuth';

// Max uncompressed HTTP request size: 32MB
// https://cloud.google.com/functions/quotas#resource_limits
export const UPLOAD_MAX_SIZE_MB = 16;

export type UploadConfig = {
  storagePrefix: string;
  // returns an error message if the file is not accepted
  validate: (file: Buffer) => Promise<string | undefined>;
  // the file name stored in the db, the storage prefix is added on upload
  getFileName: (hash: string, clientFileName: string | undefined) => string;
  getUrl: (fileName: string) => string;
};

export async function handleUpload(
  req: ff.Request,
  res: ff.Response,
  config: UploadConfig,
) {
  if (req.method !== 'POST') {
    return res.status(405).send('Method Not Allowed');
  }

  const auth = await validateFrontendAuth(req.headers.cookie);
  if (!auth) {
    return res.status(401).send('Unauthorized');
  }

  // use the raw body, as the body parser converts e.g. text or json bodies
  const file = req.rawBody;
  if (!file?.length) {
    return res.status(400).send('Empty file');
  }

  if (file.length > UPLOAD_MAX_SIZE_MB * 1024 * 1024) {
    return res.status(400).send(`File too large, max ${UPLOAD_MAX_SIZE_MB}MB`);
  }

  const validationError = await config.validate(file);
  if (validationError) {
    return res.status(400).send(validationError);
  }

  const fileHash = hashFileForStorage(file);
  const fileHashFromClient = req.headers['x-file-hash'] as string;
  if (fileHash !== fileHashFromClient) {
    return res.status(400).send('Hash mismatch');
  }

  const fileName = config.getFileName(
    fileHash,
    req.headers['x-file-name'] as string | undefined,
  );

  try {
    await uploadFile(file, config.storagePrefix + fileName);
    return res.send({ fileName, url: config.getUrl(fileName) });
  } catch (e) {
    console.error('Error uploading file:', e);
    return res.status(500).send('Internal Server Error');
  }
}
