import { describe, it, expect } from 'vitest';
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

describe('attributionToXlsx', () => {
  it('exports an attachment as a link to the download', () => {
    const url = `${window.location.origin}/api/assets/attachments/Lab-report_00123_2026-11-06.pdf?file=${fileName}`;
    expect(attributionToXlsx(attribution).value).toEqual({
      t: 's',
      v: url,
      l: { Target: url },
    });
  });
});
