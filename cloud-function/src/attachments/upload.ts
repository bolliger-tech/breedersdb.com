import * as ff from '@google-cloud/functions-framework';
import { hashFileForStorage } from '../lib/crypto';
import { uploadFile } from '../lib/storage';
import { validateFrontendAuth } from '../auth/validateFrontendAuth';
import { ATTACHMENT_STORAGE_PREFIX, parseExtension } from './fileName';

const ATTACHMENT_MAX_SIZE_MB = 16;

export async function handleAttachmentUpload(
  req: ff.Request,
  res: ff.Response,
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

  if (file.length > ATTACHMENT_MAX_SIZE_MB * 1024 * 1024) {
    return res
      .status(400)
      .send(`Attachment too large, max ${ATTACHMENT_MAX_SIZE_MB}MB`);
  }

  const fileHash = hashFileForStorage(file);
  const fileHashFromClient = req.headers['x-file-hash'] as string;
  if (fileHash !== fileHashFromClient) {
    return res.status(400).send('Hash mismatch');
  }

  const ext = parseExtension(req.headers['x-file-name'] as string | undefined);
  const fileName = ext ? `${fileHash}.${ext}` : fileHash;
  const url = `/api/assets/attachments/${fileName}?file=${fileName}`;

  try {
    await uploadFile(file, ATTACHMENT_STORAGE_PREFIX + fileName);
    return res.send({ fileName, url });
  } catch (e) {
    console.error('Error uploading file:', e);
    return res.status(500).send('Internal Server Error');
  }
}
