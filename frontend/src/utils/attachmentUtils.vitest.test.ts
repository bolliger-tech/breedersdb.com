import { describe, it, expect } from 'vitest';
import {
  ATTACHMENT_MAX_SIZE,
  getAttachmentCell,
  getAttachmentFileName,
  getAttachmentIcon,
  getAttachmentUrlRelative,
  isAttachmentTooLarge,
} from './attachmentUtils';

const hash = 'a'.repeat(64);

describe('getAttachmentFileName', () => {
  it('joins attribute, entity and date and keeps the extension', () => {
    expect(
      getAttachmentFileName({
        attributeName: 'Lab report',
        entityName: 'PLANT-00123',
        dateAttributed: '2026-11-06',
        fileName: `${hash}.pdf`,
      }),
    ).toBe('Lab-report_PLANT-00123_2026-11-06.pdf');
  });

  it('omits the extension if the stored file has none', () => {
    expect(
      getAttachmentFileName({
        attributeName: 'Raw data',
        entityName: 'Golden Delicious',
        dateAttributed: '2026-11-06',
        fileName: hash,
      }),
    ).toBe('Raw-data_Golden-Delicious_2026-11-06');
  });

  it('omits a missing entity name', () => {
    expect(
      getAttachmentFileName({
        attributeName: 'Lab report',
        dateAttributed: '2026-11-06',
        fileName: `${hash}.csv`,
      }),
    ).toBe('Lab-report_2026-11-06.csv');
  });
});

describe('getAttachmentUrlRelative', () => {
  it('encodes the desired file name and passes the stored one', () => {
    expect(
      getAttachmentUrlRelative({
        fileName: `${hash}.pdf`,
        desiredFileName: 'Lab-report_Äpfel/1_2026-11-06.pdf',
      }),
    ).toBe(
      `/api/assets/attachments/Lab-report_%C3%84pfel%2F1_2026-11-06.pdf?file=${hash}.pdf`,
    );
  });
});

describe('getAttachmentCell', () => {
  it('links the absolute download url', () => {
    const url = `${window.location.origin}/api/assets/attachments/Lab-report_00123_2026-11-06.pdf?file=${hash}.pdf`;
    expect(
      getAttachmentCell({
        fileName: `${hash}.pdf`,
        attributeName: 'Lab report',
        entityName: '00123',
        dateAttributed: '2026-11-06',
      }),
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

describe('isAttachmentTooLarge', () => {
  it('accepts files up to 16 MB', () => {
    expect(ATTACHMENT_MAX_SIZE).toBe(16 * 1024 * 1024);
    expect(isAttachmentTooLarge({ size: ATTACHMENT_MAX_SIZE })).toBe(false);
  });

  it('rejects files larger than 16 MB', () => {
    expect(isAttachmentTooLarge({ size: ATTACHMENT_MAX_SIZE + 1 })).toBe(true);
  });
});
