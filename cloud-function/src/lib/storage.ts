import { Storage } from '@google-cloud/storage';

// create GOOGLE_APPLICATION_CREDENTIALS_BASE64:
// cat path/to/your/credentials.json | base64 | pbcopy

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

  /*
  function getPublicUrl(fileName: string) {
    return `https://storage.googleapis.com/${GOOGLE_STORAGE_BUCKET_NAME}/${fileName}`;
  }

  function getFileNameFromUrl(url: string) {
    const fileName = url.split('/').pop();
    if (!fileName) {
      throw new Error('Invalid url');
    }
    return fileName;
  }
    */

  return {
    storage,
    bucketName: GOOGLE_STORAGE_BUCKET_NAME,
    //getPublicUrl,
    //getFileNameFromUrl,
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
/*
export async function deleteFile(fileName: string) {
  const { storage, bucketName } = getGCS();

  return storage.bucket(bucketName).file(fileName).delete();
}*/
