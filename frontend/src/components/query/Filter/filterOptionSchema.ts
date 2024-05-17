import { BaseTable } from './query';

export enum AttributeSchemaOptionType {
  String = 'string',
  Integer = 'integer',
  Float = 'double',
  Boolean = 'boolean',
  Enum = 'enum',
  Date = 'date',
  Datetime = 'datetime',
  Time = 'time',
  Photo = 'photo',
}

export interface AttributeSchemaStringOptions {
  type: AttributeSchemaOptionType.String;
  validation: {
    maxLen: number | null;
    pattern: string | null;
  };
}

export interface AttributeSchemaIntegerOptions {
  type: AttributeSchemaOptionType.Integer;
  validation: {
    min: number;
    max: number;
    step: number;
  };
}

export interface AttributeSchemaDoubleOptions {
  type: AttributeSchemaOptionType.Float;
  validation: {
    min: number;
    max: number;
    step: number;
  };
}

export interface AttributeSchemaBooleanOptions {
  type: AttributeSchemaOptionType.Boolean;
}

export interface AttributeSchemaEnumOptions {
  type: AttributeSchemaOptionType.Enum;
  validation: {
    options: string[];
  };
}

export interface AttributeSchemaDateOptions {
  type: AttributeSchemaOptionType.Date;
}

export interface AttributeSchemaDatetimeOptions {
  type: AttributeSchemaOptionType.Datetime;
}

export interface AttributeSchemaTimeOptions {
  type: AttributeSchemaOptionType.Time;
}

export interface AttributeSchemaPhotoOptions {
  type: AttributeSchemaOptionType.Photo;
}

export interface AttributeSchemaEmptyOption {
  allowEmpty: boolean;
}

export type AttributeSchemaOptions = AttributeSchemaEmptyOption &
  (
    | AttributeSchemaStringOptions
    | AttributeSchemaIntegerOptions
    | AttributeSchemaDoubleOptions
    | AttributeSchemaEnumOptions
    | AttributeSchemaBooleanOptions
    | AttributeSchemaDateOptions
    | AttributeSchemaDatetimeOptions
    | AttributeSchemaTimeOptions
    | AttributeSchemaPhotoOptions
  );

export interface AttributeSchema {
  name: string; // e.g. TreesView.publicid
  label: string; // e.g. Tree -> Publicid
  options: AttributeSchemaOptions;
}

export interface FilterOptionSchemas {
  [BaseTable.Crossings]: AttributeSchema[];
  [BaseTable.Lots]: AttributeSchema[];
  [BaseTable.Trees]: AttributeSchema[];
  [BaseTable.Cultivars]: AttributeSchema[];
  attributions: AttributeSchema[];
}
