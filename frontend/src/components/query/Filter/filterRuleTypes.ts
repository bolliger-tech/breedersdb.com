export enum FilterRuleType {
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

export type FilterRuleSchema =
  | StringSchema
  | IntegerSchema
  | DoubleSchema
  | BooleanSchema
  | EnumSchema
  | DateSchema
  | DateTimeSchema
  | TimeSchema
  | PhotoSchema;

interface StringSchema {
  allowEmpty: boolean;
  type: FilterRuleType.String;
  validation: {
    maxLen: number | null;
    pattern: string | null;
  };
}

interface IntegerSchema {
  allowEmpty: boolean;
  type: FilterRuleType.Integer;
  validation: {
    min: number;
    max: number;
    step: number;
  };
}

interface DoubleSchema {
  allowEmpty: boolean;
  type: FilterRuleType.Float;
  validation: {
    min: number;
    max: number;
    step: number;
  };
}

interface BooleanSchema {
  allowEmpty: boolean;
  type: FilterRuleType.Boolean;
}

interface EnumSchema {
  allowEmpty: boolean;
  type: FilterRuleType.Enum;
  validation: {
    options: string[];
  };
}

interface DateSchema {
  allowEmpty: boolean;
  type: FilterRuleType.Date;
}

interface DateTimeSchema {
  allowEmpty: boolean;
  type: FilterRuleType.Datetime;
}

interface TimeSchema {
  allowEmpty: boolean;
  type: FilterRuleType.Time;
}

interface PhotoSchema {
  allowEmpty: boolean;
  type: FilterRuleType.Photo;
}
