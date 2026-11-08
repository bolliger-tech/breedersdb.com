import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  UPLOAD_MAX_SIZE,
  getAttachmentIcon,
  getAttachmentUrlRelative,
  getDownloadFileName,
  getImageUrlRelative,
  getLinkCell,
  isFileTooLarge,
} from './assetUtils';

const hash = 'a'.repeat(64);

describe('getDownloadFileName', () => {
  beforeEach(() => {
    vi.stubEnv('VITE_ORG_ABBREVIATION', 'POC');
    return () => vi.unstubAllEnvs();
  });

  it('joins org, attribute, entity, date and id and keeps the extension', () => {
    expect(
      getDownloadFileName({
        fileName: `${hash}.pdf`,
        attributeName: 'Lab report',
        entityName: 'PLANT-00123',
        dateAttributed: '2026-11-06',
        attributionId: 42,
      }),
    ).toBe('bdb-POC_Lab-report_PLANT-00123_2026-11-06_42.pdf');
  });

  it('keeps the extension of photos', () => {
    expect(
      getDownloadFileName({
        fileName: `${hash}.avif`,
        attributeName: 'Fruit',
        entityName: 'Golden Delicious',
        dateAttributed: '2026-11-06',
        attributionId: 7,
      }),
    ).toBe('bdb-POC_Fruit_Golden-Delicious_2026-11-06_7.avif');
  });

  it('omits the extension if the stored file has none', () => {
    expect(
      getDownloadFileName({
        fileName: hash,
        attributeName: 'Raw data',
        entityName: 'Golden Delicious',
        dateAttributed: '2026-11-06',
      }),
    ).toBe('bdb-POC_Raw-data_Golden-Delicious_2026-11-06');
  });

  it('omits a missing entity name and id', () => {
    expect(
      getDownloadFileName({
        fileName: `${hash}.csv`,
        attributeName: 'Lab report',
        dateAttributed: '2026-11-06',
      }),
    ).toBe('bdb-POC_Lab-report_2026-11-06.csv');
  });

  it('omits a missing org', () => {
    vi.stubEnv('VITE_ORG_ABBREVIATION', '');
    expect(
      getDownloadFileName({
        fileName: `${hash}.csv`,
        attributeName: 'Lab report',
        dateAttributed: '2026-11-06',
      }),
    ).toBe('bdb_Lab-report_2026-11-06.csv');
  });
});

describe('getAttachmentUrlRelative', () => {
  it('encodes the download file name and passes the stored one', () => {
    expect(
      getAttachmentUrlRelative({
        fileName: `${hash}.pdf`,
        downloadFileName: 'Lab-report_Äpfel/1_2026-11-06.pdf',
      }),
    ).toBe(
      `/api/assets/attachments/Lab-report_%C3%84pfel%2F1_2026-11-06.pdf?file=${hash}.pdf`,
    );
  });
});

describe('getImageUrlRelative', () => {
  it('encodes the download file name and adds the dimensions', () => {
    expect(
      getImageUrlRelative({
        fileName: `${hash}.jpg`,
        downloadFileName: 'Fruit_Äpfel.jpg',
        dimensions: { width: 320, height: null },
      }),
    ).toBe(
      `/api/assets/images/Fruit_%C3%84pfel.jpg?file=${hash}.jpg&width=320`,
    );
  });
});

describe('getLinkCell', () => {
  it('links the absolute url', () => {
    const url = `${window.location.origin}/api/assets/attachments/x.pdf?file=${hash}.pdf`;
    expect(
      getLinkCell(`/api/assets/attachments/x.pdf?file=${hash}.pdf`),
    ).toEqual({ t: 's', v: url, l: { Target: url } });
  });
});

describe('getAttachmentIcon', () => {
  it.each([
    [`${hash}.pdf`, 'picture_as_pdf'],
    [`${hash}.jpg`, 'image'],
    [`${hash}.png`, 'image'],
    [`${hash}.mp4`, 'movie'],
    [`${hash}.mp3`, 'audio_file'],
    [`${hash}.csv`, 'table_chart'],
    [`${hash}.xlsx`, 'table_chart'],
    [`${hash}.txt`, 'description'],
    [`${hash}.docx`, 'description'],
    [`${hash}.zip`, 'insert_drive_file'],
    [hash, 'insert_drive_file'],
  ])('maps %s to %s', (fileName, icon) => {
    expect(getAttachmentIcon(fileName)).toBe(icon);
  });
});

describe('isFileTooLarge', () => {
  it('accepts files up to 16 MB', () => {
    expect(UPLOAD_MAX_SIZE).toBe(16 * 1024 * 1024);
    expect(isFileTooLarge({ size: UPLOAD_MAX_SIZE })).toBe(false);
  });

  it('rejects files larger than 16 MB', () => {
    expect(isFileTooLarge({ size: UPLOAD_MAX_SIZE + 1 })).toBe(true);
  });
});
