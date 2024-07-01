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
  }[dataType];

  if (typeof type === 'undefined') {
    throw Error(`Unknown attribute.data_type: ${dataType}`);
  }

  return type;
}

export function formatResultColumnValue({
  value,
  type,
}: {
  value: string | number | Date | null | boolean | undefined;
  type: ColumnTypes;
}) {
  if (null === value || undefined === value) {
    return '';
  } else if (value instanceof Date) {
    return value.toLocaleDateString();
  } else if (typeof value === 'number') {
    return value.toLocaleString();
  } else if (typeof value === 'boolean') {
    return value ? '✓' : '✕';
  } else if (type === ColumnTypes.Integer || type === ColumnTypes.Float) {
    return parseInt(value).toLocaleString();
  } else if (type === ColumnTypes.Date) {
    return new Date(value).toLocaleDateString();
  }

  return value;
}
