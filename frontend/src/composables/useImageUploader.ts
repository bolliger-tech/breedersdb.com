import { ref } from 'vue';

export interface UploadProgress {
  percentComplete: number;
  bytesTotal: number;
  bytesUploaded: number;
  status: 'idle' | 'uploading' | 'complete' | 'error' | 'aborted';
  errorMessage?: string;
}

export interface UploadResponse {
  fileName: string;
  url: string;
}

export async function hashFile(file: File): Promise<string> {
  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.onload = () => {
      const buffer = reader.result as ArrayBuffer;
      crypto.subtle.digest('SHA-256', buffer).then((hash) => {
        const hashArray = Array.from(new Uint8Array(hash));
        const hashHex = hashArray
          .map((byte) => byte.toString(16).padStart(2, '0'))
          .join('');
        resolve(hashHex);
      });
    };
    reader.readAsArrayBuffer(file);
  });
}

export function useImageUploader(
  onProgress: (progress: UploadProgress) => void,
) {
  const xhr = ref<XMLHttpRequest | null>(null);

  const getErrorMessage = () =>
    'Error ' +
    ([xhr.value?.status, xhr.value?.responseText].filter(Boolean).join(': ') ||
      '- Upload failed due to an unknown error.');

  const upload = (
    file: File,
    hash: string,
    url: string,
  ): Promise<UploadResponse> => {
    onProgress({
      percentComplete: 0,
      bytesTotal: file.size,
      bytesUploaded: 0,
      status: 'idle',
    });

    return new Promise<UploadResponse>((resolve, reject) => {
      xhr.value = new XMLHttpRequest();
      xhr.value.open('POST', url, true);
      xhr.value.setRequestHeader('Content-Type', 'application/octet-stream');
      xhr.value.setRequestHeader('X-File-Name', encodeURIComponent(file.name));
      xhr.value.setRequestHeader('X-File-Hash', hash);
      xhr.value.withCredentials = true;

      xhr.value.upload.onprogress = (event) => {
        if (event.lengthComputable) {
          const percentComplete = Math.round((event.loaded / event.total) * 90); // leave 10% for server processing
          onProgress({
            percentComplete,
            bytesTotal: event.total,
            bytesUploaded: event.loaded,
            status: 'uploading',
          });
        }
      };

      xhr.value.onload = () => {
        if (xhr.value?.status === 200) {
          onProgress({
            percentComplete: 100,
            bytesTotal: file.size,
            bytesUploaded: file.size,
            status: 'complete',
          });
          const response: UploadResponse = JSON.parse(xhr.value.responseText);
          resolve(response);
        } else {
          const errorMessage = getErrorMessage();
          onProgress({
            percentComplete: 0,
            bytesTotal: file.size,
            bytesUploaded: 0,
            status: 'error',
            errorMessage,
          });
          reject(new Error(errorMessage));
        }
      };

      xhr.value.onerror = () => {
        const errorMessage = getErrorMessage();
        onProgress({
          percentComplete: 0,
          bytesTotal: file.size,
          bytesUploaded: 0,
          status: 'error',
          errorMessage,
        });
        reject(new Error(errorMessage));
      };

      xhr.value.send(file);
    });
  };

  const abort = () => {
    if (xhr.value) {
      xhr.value.abort();
      onProgress({
        percentComplete: 0,
        bytesTotal: 0,
        bytesUploaded: 0,
        status: 'aborted',
        errorMessage: 'Upload aborted by user.',
      });
    }
  };

  return {
    upload,
    abort,
  };
}
