import { describe, it, expect, vi, beforeEach } from 'vitest';
import { attributionToXlsx } from './exportResult';
import {
  attachmentAttribution as attribution,
  attachmentFileName as fileName,
} from './attributionFixture.vitest';

const photoFileName = `${'b'.repeat(64)}.jpg`;

describe('attributionToXlsx', () => {
  beforeEach(() => {
    vi.stubEnv('VITE_ORG_ABBREVIATION', 'POC');
    return () => vi.unstubAllEnvs();
  });

  it('exports an attachment as a link to the download', () => {
    const url = `${window.location.origin}/api/assets/attachments/bdb-POC_Lab-report_00123_2026-11-06_1.pdf?file=${fileName}`;
    expect(attributionToXlsx(attribution).value).toEqual({
      t: 's',
      v: url,
      l: { Target: url },
    });
  });

  it('exports a photo and a photo note as links to the image', () => {
    const url = `${window.location.origin}/api/assets/images/bdb-POC_Lab-report_00123_2026-11-06_1.jpg?file=${photoFileName}`;
    const cell = { t: 's', v: url, l: { Target: url } };
    expect(
      attributionToXlsx({
        ...attribution,
        data_type: 'PHOTO',
        text_value: photoFileName,
      }).value,
    ).toEqual(cell);
    const withPhotoNote: Record<string, unknown> = attributionToXlsx({
      ...attribution,
      data_type: 'TEXT',
      text_value: 'text',
      photo_note: photoFileName,
    });
    expect(withPhotoNote.photo_note).toEqual(cell);
  });
});
