import {
  AttributeSchema,
  AttributeSchemaOptionType,
} from './filterOptionSchemaTypes';

export enum FilterOperator {
  Equal = '===',
  NotEqual = '!==',
  Less = '<',
  LessOrEqual = '<=',
  Greater = '>',
  GreaterOrEqual = '>=',
  StartsWith = 'startsWith',
  StartsNotWith = 'startsNotWith',
  Contains = 'contains',
  NotContains = 'notContains',
  EndsWith = 'endsWith',
  NotEndsWith = 'notEndsWith',
  Empty = 'empty',
  NotEmpty = 'notEmpty',
  True = 'true',
  False = 'false',
}

export enum FilterOperand {
  And = 'and',
  Or = 'or',
}

export enum FilterType {
  Base = 'base',
  Attribution = 'attribution',
}

export interface FilterOption {
  label: string;
  value: string;
  schema: AttributeSchema;
}

export interface FilterOperatorOption {
  label: string;
  value: FilterOperator;
  type: AttributeSchemaOptionType[];
}

export type FilterTerm = string;
