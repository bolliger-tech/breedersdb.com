import type { FilterRuleColumn } from './filterRuleColumn';
import {
  FilterOperatorValue,
  type FilterRuleOperator,
} from './filterRuleOperator';
import type { FilterRuleTerm } from './filterRuleTerm';

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

export type FilterRuleTypeSchema =
  | StringSchema
  | IntegerSchema
  | DoubleSchema
  | BooleanSchema
  | EnumSchema
  | DateSchema
  | DateTimeSchema
  | TimeSchema
  | PhotoSchema;

export class FilterRule {
  column: FilterRuleColumn | undefined;
  operator: FilterRuleOperator | undefined;
  term: FilterRuleTerm | undefined;
  private _includeEntitiesWithoutAttributions = false;

  get isAttribute() {
    return this.column?.isAttribute;
  }
  get type() {
    return this.column?.type;
  }
  get tableName() {
    return this.column?.tableName;
  }
  get columnName() {
    return this.column?.tableColumnName;
  }
  get canBeNullOrEmpty() {
    return (
      this.column?.termCanBeEmpty &&
      this.type === FilterRuleType.String &&
      this.operator?.value &&
      [
        FilterOperatorValue.Equal,
        FilterOperatorValue.NotEqual,
        FilterOperatorValue.Empty,
        FilterOperatorValue.NotEmpty,
      ].includes(this.operator.value)
    );
  }
  get includeEntitiesWithoutAttributions() {
    if (!this.isAttribute) return false;
    return this._includeEntitiesWithoutAttributions;
  }
  set includeEntitiesWithoutAttributions(value: boolean) {
    if (!this.isAttribute)
      throw new Error('Only attributions can have this property');
    this._includeEntitiesWithoutAttributions = value;
  }
  get requiresTerm() {
    switch (this.type) {
      case FilterRuleType.Date:
      case FilterRuleType.Datetime:
      case FilterRuleType.Integer:
      case FilterRuleType.Float:
      case FilterRuleType.Enum:
        return true;
      case FilterRuleType.String:
        return (
          this.operator?.value !== FilterOperatorValue.Empty &&
          this.operator?.value !== FilterOperatorValue.NotEmpty
        );
      default:
        return false;
    }
  }
  get isValid() {
    if (!this.column || !this.operator) return undefined;
    if (this.requiresTerm && this.term === undefined) return undefined;

    return (
      this.column.isValid &&
      this.operator.isValid &&
      ((this.requiresTerm && this.term?.isValid) || !this.requiresTerm)
    );
  }
}

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
