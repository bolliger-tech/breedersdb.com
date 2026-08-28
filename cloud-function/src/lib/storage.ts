import { Storage, type GetFilesOptions } from '@google-cloud/storage';

function getGCS() {
  const GOOGLE_APPLICATION_CREDENTIALS_BASE64 =
    process.env.GOOGLE_APPLICATION_CREDENTIALS_BASE64;
  const GOOGLE_STORAGE_PROJECT_ID = process.env.GOOGLE_STORAGE_PROJECT_ID;
  const GOOGLE_STORAGE_BUCKET_NAME = process.env.GOOGLE_STORAGE_BUCKET_NAME;
  const GOOGLE_STORAGE_API_ENDPOINT = process.env.GOOGLE_STORAGE_API_ENDPOINT;

  const credentials = GOOGLE_APPLICATION_CREDENTIALS_BASE64
    ? JSON.parse(
        Buffer.from(GOOGLE_APPLICATION_CREDENTIALS_BASE64, 'base64').toString(),
      )
    : undefined;

  if (!GOOGLE_STORAGE_PROJECT_ID || !GOOGLE_STORAGE_BUCKET_NAME) {
    throw new Error(
      'GOOGLE_STORAGE_PROJECT_ID and GOOGLE_STORAGE_BUCKET_NAME must be set',
    );
  }

  if (!credentials && !GOOGLE_STORAGE_API_ENDPOINT) {
    throw new Error(
      'Set GOOGLE_APPLICATION_CREDENTIALS_BASE64 to use real GCS, or GOOGLE_STORAGE_API_ENDPOINT to use an emulator (fake-gcs-server)',
    );
  }

  const storage = new Storage({
    projectId: GOOGLE_STORAGE_PROJECT_ID,
    // the fake-gcs-server needs a custom apiEndpoint
    // real GCS needs credentials
    ...(GOOGLE_STORAGE_API_ENDPOINT
      ? { apiEndpoint: GOOGLE_STORAGE_API_ENDPOINT }
      : { credentials }),
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
