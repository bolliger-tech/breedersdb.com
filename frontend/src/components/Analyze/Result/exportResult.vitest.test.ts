import { describe, it, expect, vi, beforeEach } from 'vitest';
import { attributionToXlsx } from './exportResult';
import type { AnalyzeCachedAttributionsFields } from './filterToQuery';

const fileName = `${'a'.repeat(64)}.pdf`;

const attribution: AnalyzeCachedAttributionsFields = {
  id: 1,
  integer_value: null,
  float_value: null,
  text_value: fileName,
  boolean_value: null,
  date_value: null,
  plant_id: 2,
  plant_group_id: null,
  cultivar_id: null,
  lot_id: null,
  data_type: 'ATTACHMENT',
  attribution_form_id: 3,
  attribute_id: 4,
  attribute_name: 'Lab report',
  date_attributed: '2026-11-06',
  created: '2026-11-06T10:00:00Z',
  author: 'tester',
  exceptional_attribution: false,
  text_note: null,
  photo_note: null,
  plant: { id: 2, label_id: '00123' },
};

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
