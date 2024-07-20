import type { AttributeDataTypes } from 'src/graphql';
import { ColumnTypes } from './columnTypes';

export function dataTypeToColumnTypes(dataType: AttributeDataTypes) {
  const type = {
    TEXT: ColumnTypes.String,
    INTEGER: ColumnTypes.Integer,
    FLOAT: ColumnTypes.Float,
    BOOLEAN: ColumnTypes.Boolean,
    DATE: ColumnTypes.Date,
    PHOTO: ColumnTypes.Photo,
    RATING: ColumnTypes.Rating,
  }[dataType];

  if (typeof type === 'undefined') {
    throw Error(`Unknown attribute.data_type: ${dataType}`);
  }

  return type;
}

export type PrimitiveColumnValue =
  | string
  | number
  | Date
  | null
  | boolean
  | undefined;

export function formatResultColumnValue({
  value,
  type,
}: {
  value: string | number | Date | null | boolean | undefined;
  type: Exclude<ColumnTypes, ColumnTypes.Photo>;
}) {
  if (null === value || undefined === value) {
    return '';
  } else if (value instanceof Date) {
    return value.toLocaleDateString();
  } else if (typeof value === 'number') {
    return value.toLocaleString();
  } else if (typeof value === 'boolean') {
    return value ? '✓' : '✕';
  } else if (type === ColumnTypes.Integer || type === ColumnTypes.Rating) {
    return parseInt(value).toLocaleString();
  } else if (type === ColumnTypes.Float) {
    return parseFloat(value).toLocaleString();
  } else if (type === ColumnTypes.Date) {
    return new Date(value).toLocaleDateString();
  }

  return value;
}

export function getAttributeValue({
  integer_value,
  float_value,
  text_value,
  boolean_value,
  date_value,
}: {
  integer_value?: number | null;
  float_value?: number | null;
  text_value?: string | null;
  boolean_value?: boolean | null;
  date_value?: string | null;
}) {
  return (
    integer_value ?? float_value ?? text_value ?? boolean_value ?? date_value
  );
}
