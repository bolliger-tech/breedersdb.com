import { describe, it, expect, vi } from 'vitest';
import { useAttributionFileUpload } from './useAttributionFileUpload';

const upload = vi.fn((file: File, _hash: string, url: string) =>
  Promise.resolve({ fileName: `${url}/${file.name}`, url: '' }),
);

vi.mock('src/composables/useFileUploader', () => ({
  hashFile: () => Promise.resolve('hash'),
  useFileUploader: () => ({ upload }),
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
});
