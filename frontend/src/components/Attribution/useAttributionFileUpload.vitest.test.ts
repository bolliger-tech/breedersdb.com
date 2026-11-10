import { describe, it, expect, vi } from 'vitest';
import type { UploadProgress } from 'src/composables/useFileUploader';
import { useAttributionFileUpload } from './useAttributionFileUpload';

const upload = vi.fn((file: File, _hash: string, url: string) =>
  Promise.resolve({ fileName: `${url}/${file.name}`, url: '' }),
);

let reportProgress: (progress: UploadProgress) => void;

vi.mock('src/composables/useFileUploader', () => ({
  hashFile: () => Promise.resolve('hash'),
  useFileUploader: (onProgress: typeof reportProgress) => {
    reportProgress = onProgress;
    return { upload };
  },
}));

describe('useAttributionFileUpload', () => {
  it('uploads photos and photo notes as images and attachments as attachments', async () => {
    const { uploadFiles } = useAttributionFileUpload();

    const result = await uploadFiles([
      {
        value: { file_value: new File(['x'], 'photo.jpg'), photo_note: null },
        dataType: 'PHOTO',
      },
      {
        value: { file_value: new File(['x'], 'report.pdf'), photo_note: null },
        dataType: 'ATTACHMENT',
      },
      {
        value: {
          text_value: 'text',
          file_value: null,
          photo_note: new File(['x'], 'note.jpg'),
        },
        dataType: 'TEXT',
      },
    ]);

    expect(result).toEqual([
      { text_value: '/api/assets/upload/images/photo.jpg', photo_note: null },
      {
        text_value: '/api/assets/upload/attachments/report.pdf',
        photo_note: null,
      },
      {
        text_value: 'text',
        photo_note: '/api/assets/upload/images/note.jpg',
      },
    ]);
  });

  it('keeps stored file names without uploading', async () => {
    upload.mockClear();
    const { uploadFiles } = useAttributionFileUpload();

    const result = await uploadFiles([
      {
        value: { file_value: 'stored.pdf', photo_note: 'stored.jpg' },
        dataType: 'ATTACHMENT',
      },
    ]);

    expect(upload).not.toHaveBeenCalled();
    expect(result).toEqual([
      { text_value: 'stored.pdf', photo_note: 'stored.jpg' },
    ]);
  });

  it('stops uploading when a later file fails', async () => {
    const { uploadFiles, isUploading } = useAttributionFileUpload();
    upload
      .mockImplementationOnce((file: File) => {
        reportProgress({
          percentComplete: 100,
          bytesTotal: file.size,
          bytesUploaded: file.size,
          status: 'complete',
        });
        return Promise.resolve({ fileName: 'stored.jpg', url: '' });
      })
      .mockImplementationOnce((file: File) => {
        reportProgress({
          percentComplete: 0,
          bytesTotal: file.size,
          bytesUploaded: 0,
          status: 'error',
        });
        return Promise.reject(new Error('Error 500'));
      });

    await expect(
      uploadFiles([
        {
          value: {
            file_value: new File(['x'], 'report.pdf'),
            photo_note: new File(['x'], 'note.jpg'),
          },
          dataType: 'ATTACHMENT',
        },
      ]),
    ).rejects.toThrow('Error 500');

    expect(isUploading.value).toBe(false);
  });

  it('is uploading until the server has answered', async () => {
    const { uploadFiles, isUploading } = useAttributionFileUpload();
    let answer!: (response: { fileName: string; url: string }) => void;
    upload.mockImplementationOnce((file: File) => {
      // all bytes are sent, but the server has not answered yet
      reportProgress({
        percentComplete: 90,
        bytesTotal: file.size,
        bytesUploaded: file.size,
        status: 'uploading',
      });
      return new Promise((resolve) => (answer = resolve));
    });

    const uploading = uploadFiles([
      {
        value: { file_value: new File(['x'], 'report.pdf'), photo_note: null },
        dataType: 'ATTACHMENT',
      },
    ]);
    expect(isUploading.value).toBe(true);
    // let the hash resolve, so the upload starts
    await new Promise((resolve) => setTimeout(resolve));
    expect(isUploading.value).toBe(true);

    answer({ fileName: 'stored.pdf', url: '' });
    await uploading;
    expect(isUploading.value).toBe(false);
  });
});
