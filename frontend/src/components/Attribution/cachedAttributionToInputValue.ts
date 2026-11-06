import type { AttributeFragment } from 'src/components/Attribute/attributeFragment';
import type { CachedAttributionsFragment } from 'src/components/Attribution/cachedAttributionsFragment';

// The cache stores the photo and attachment file names and the enum option label in
// text_value. Maps them back to the fields of the input value.
export function cachedAttributionToInputValue(
  cached: CachedAttributionsFragment,
  enumOptions: AttributeFragment['enum_options'],
) {
  const isPhoto = cached.data_type === 'PHOTO';
  const isAttachment = cached.data_type === 'ATTACHMENT';
  const isEnum = cached.data_type === 'ENUM';

  return {
    integer_value: cached.integer_value,
    float_value: cached.float_value,
    text_value: isPhoto || isAttachment || isEnum ? null : cached.text_value,
    boolean_value: cached.boolean_value,
    date_value: cached.date_value,
    photo_value: isPhoto ? cached.text_value : null,
    attachment_value: isAttachment ? cached.text_value : null,
    // labels are unique per attribute, so the match is exact
    attribute_enum_option_id: isEnum
      ? (enumOptions.find((o) => o.label === cached.text_value)?.id ?? null)
      : null,
  };
}
