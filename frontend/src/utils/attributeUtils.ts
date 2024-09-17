import type { AttributeDataTypes, AttributeTypes } from 'src/graphql';
import { ColumnTypes } from './columnTypes';
import type { DFunc, NFunc, TFunc } from 'src/composables/useI18n';

export type PrimitiveColumnValue =
  | string
  | number
  | Date
  | null
  | boolean
  | undefined;

export function dataTypeToColumnTypes(dataType: AttributeDataTypes) {
  const type = {
    TEXT: ColumnTypes.Citext,
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

export function dataTypeToLabel(dataType: AttributeDataTypes, t: TFunc) {
  const type = {
    TEXT: t('attributes.dataTypes.text'),
    INTEGER: t('attributes.dataTypes.integer'),
    FLOAT: t('attributes.dataTypes.float'),
    BOOLEAN: t('attributes.dataTypes.boolean'),
    DATE: t('attributes.dataTypes.date'),
    PHOTO: t('attributes.dataTypes.photo'),
    RATING: t('attributes.dataTypes.rating'),
  }[dataType];

  if (typeof type === 'undefined') {
    throw Error(`Unknown attribute.data_type: ${dataType}`);
  }

  return type;
}

export function attributeTypeToLabel(attributeType: AttributeTypes, t: TFunc) {
  const type = {
    OBSERVATION: t('attributes.attributeTypes.observation'),
    SAMPLE: t('attributes.attributeTypes.sample'),
    TREATMENT: t('attributes.attributeTypes.treatment'),
    OTHER: t('attributes.attributeTypes.other'),
  }[attributeType];

  if (typeof type === 'undefined') {
    throw Error(`Unknown attribute.attribute_type: ${attributeType}`);
  }

  return type;
}

export function formatResultColumnValue({
  value,
  type,
  d,
  n,
}: {
  value: string | number | Date | null | boolean | undefined;
  type: Exclude<ColumnTypes, ColumnTypes.Photo>;
  d: DFunc;
  n: NFunc;
}) {
  if (null === value || undefined === value) {
    return '';
  }

  if (typeof value === 'boolean') {
    return value ? '✓' : '✕';
  }

  if (typeof value === 'number') {
    if (type === ColumnTypes.Integer || type === ColumnTypes.Rating) {
      return n(parseInt(value.toString()));
    } else if (type === ColumnTypes.Float) {
      return n(parseFloat(value.toString()));
    }
    return value.toString();
  }

  if (type === ColumnTypes.Date) {
    return d(value, 'Ymd');
  } else if (type === ColumnTypes.DateTime) {
    return d(value, 'YmdHis');
  }

  return value.toString();
}

export function getAttributionValue({
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
