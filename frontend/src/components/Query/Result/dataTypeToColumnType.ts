import type { AttributeDataTypes } from 'src/graphql';
import { ColumnType } from '../ColumnDefinitions/columnTypes';

export function dataTypeToColumnType(dataType: AttributeDataTypes) {
  switch (dataType) {
    case 'TEXT':
      return ColumnType.String;
    case 'BOOLEAN':
      return ColumnType.Boolean;
    case 'DATE':
      return ColumnType.Date;
    case 'FLOAT':
      return ColumnType.Float;
    case 'INTEGER':
      return ColumnType.Integer;
    case 'PHOTO':
      return ColumnType.Photo;
    default:
      throw new Error(`Unknown data type: ${dataType}`);
  }
}
