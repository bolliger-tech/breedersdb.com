export function attributionValueHasValue(attributionValue: {
  integer_value?: number | null | undefined;
  float_value?: number | null | undefined;
  text_value?: string | null | undefined;
  boolean_value?: boolean | null | undefined;
  date_value?: string | null | undefined;
  photo_value?: File | string | null | undefined;
  attribute_enum_option_id?: number | null | undefined;
}) {
  return (
    (attributionValue.integer_value ?? null) !== null ||
    (attributionValue.float_value ?? null) !== null ||
    (attributionValue.text_value ?? null) !== null ||
    (attributionValue.boolean_value ?? null) !== null ||
    (attributionValue.date_value ?? null) !== null ||
    (attributionValue.photo_value ?? null) !== null ||
    (attributionValue.attribute_enum_option_id ?? null) !== null
  );
}
