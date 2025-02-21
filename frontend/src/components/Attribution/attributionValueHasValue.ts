export function attributionValueHasValue(attributionValue: {
  integer_value?: number | null | undefined;
  float_value?: number | null | undefined;
  text_value?: string | null | undefined;
  boolean_value?: boolean | null | undefined;
  date_value?: string | null | undefined;
  photo_value?: File | string | null | undefined;
}) {
  return (
    attributionValue.integer_value !== null ||
    attributionValue.float_value !== null ||
    attributionValue.text_value !== null ||
    attributionValue.boolean_value !== null ||
    attributionValue.date_value !== null ||
    attributionValue.photo_value !== null
  );
}
