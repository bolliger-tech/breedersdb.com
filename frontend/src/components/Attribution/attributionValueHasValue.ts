import type { AttributionValueWithPhoto } from './Add/AttributionAddForm.vue';

export function attributionValueHasValue(
  attributionValue: Omit<AttributionValueWithPhoto, 'photo_note'>,
) {
  return (
    attributionValue.integer_value !== null ||
    attributionValue.float_value !== null ||
    attributionValue.text_value !== null ||
    attributionValue.boolean_value !== null ||
    attributionValue.date_value !== null ||
    attributionValue.photo_value !== null
  );
}
