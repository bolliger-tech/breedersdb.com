import type { AnalyzeCachedAttributionsFields } from './filterToQuery';

export const attachmentFileName = `${'a'.repeat(64)}.pdf`;

export const attachmentAttribution: AnalyzeCachedAttributionsFields = {
  id: 1,
  integer_value: null,
  float_value: null,
  text_value: attachmentFileName,
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
