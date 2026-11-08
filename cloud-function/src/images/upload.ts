import sharp from 'sharp';
import type { UploadConfig } from '../lib/upload';
import { IMAGE_STORAGE_PREFIX } from './fileName';

async function validate(file: Buffer) {
  try {
    const { format } = await sharp(file).metadata();
    return format === 'jpeg' ? undefined : 'Invalid image format, must be JPEG';
  } catch {
    return 'Invalid image';
  }
}

export const imageUploadConfig: UploadConfig = {
  storagePrefix: IMAGE_STORAGE_PREFIX,
  validate,
  getFileName: (hash) => `${hash}.jpg`,
  getUrl: (fileName) => `/api/assets/images/${fileName}?file=${fileName}`,
};
