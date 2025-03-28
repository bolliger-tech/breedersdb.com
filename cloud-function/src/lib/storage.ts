import { Storage, type GetFilesOptions } from '@google-cloud/storage';

function getGCS() {
  const GOOGLE_APPLICATION_CREDENTIALS_BASE64 =
    process.env.GOOGLE_APPLICATION_CREDENTIALS_BASE64;
  const GOOGLE_STORAGE_PROJECT_ID = process.env.GOOGLE_STORAGE_PROJECT_ID;
  const GOOGLE_STORAGE_BUCKET_NAME = process.env.GOOGLE_STORAGE_BUCKET_NAME;
  if (
    !GOOGLE_APPLICATION_CREDENTIALS_BASE64 ||
    !GOOGLE_STORAGE_PROJECT_ID ||
    !GOOGLE_STORAGE_BUCKET_NAME
  ) {
    throw new Error('GCS env not set');
  }

  const storage = new Storage({
    projectId: GOOGLE_STORAGE_PROJECT_ID,
    credentials: JSON.parse(
      Buffer.from(GOOGLE_APPLICATION_CREDENTIALS_BASE64, 'base64').toString(),
    ),
  });

  return {
    storage,
    bucketName: GOOGLE_STORAGE_BUCKET_NAME,
  };
}

export async function uploadFile(file: Buffer, fileName: string) {
  const { storage, bucketName } = getGCS();

  return storage.bucket(bucketName).file(fileName).save(file);
}

export function downloadFile(fileName: string) {
  const { storage, bucketName } = getGCS();

  return storage.bucket(bucketName).file(fileName).createReadStream();
}

export function getFiles(options: GetFilesOptions) {
  const { storage, bucketName } = getGCS();

  return storage.bucket(bucketName).getFiles(options);
}

export function deleteFile(fileName: string) {
  const { storage, bucketName } = getGCS();

  return storage.bucket(bucketName).file(fileName).delete();
}
