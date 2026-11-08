import type { UploadConfig } from '../lib/upload';
import { ATTACHMENT_STORAGE_PREFIX, parseExtension } from './fileName';

export const attachmentUploadConfig: UploadConfig = {
  storagePrefix: ATTACHMENT_STORAGE_PREFIX,
  // any file type is accepted, see ADR 0002
  validate: async () => undefined,
  getFileName: (hash, clientFileName) => {
    const ext = parseExtension(clientFileName);
    return ext ? `${hash}.${ext}` : hash;
  },
  getUrl: (fileName) => `/api/assets/attachments/${fileName}?file=${fileName}`,
};
