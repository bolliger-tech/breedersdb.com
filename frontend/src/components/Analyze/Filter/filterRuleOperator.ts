import type { TFunc } from 'src/composables/useI18n';
import { type FilterRuleSchema } from './filterRule';
import { ColumnTypes } from 'src/utils/columnTypes';

export type FilterRuleOperatorJson = {
  value: FilterOperatorValue;
};

export class FilterRuleOperator {
  public readonly value: FilterOperatorValue;
  public schema: FilterRuleSchema | undefined;

  constructor({ value }: { value: FilterOperatorValue }) {
    this.value = value;
  }

  get labelKey(): Parameters<TFunc>[0] {
    switch (this.value) {
      case FilterOperatorValue.Equal:
        return 'analyze.filter.operators.equals';
      case FilterOperatorValue.NotEqual:
        return 'analyze.filter.operators.notEquals';
      case FilterOperatorValue.Less:
        return 'analyze.filter.operators.less';
      case FilterOperatorValue.LessOrEqual:
        return 'analyze.filter.operators.lessOrEqual';
      case FilterOperatorValue.Greater:
        return 'analyze.filter.operators.greater';
      case FilterOperatorValue.GreaterOrEqual:
        return 'analyze.filter.operators.greaterOrEqual';
      case FilterOperatorValue.StartsWith:
        return 'analyze.filter.operators.startsWith';
      case FilterOperatorValue.StartsNotWith:
        return 'analyze.filter.operators.startsNotWith';
      case FilterOperatorValue.Contains:
        return 'analyze.filter.operators.contains';
      case FilterOperatorValue.NotContains:
        return 'analyze.filter.operators.notContains';
      case FilterOperatorValue.EndsWith:
        return 'analyze.filter.operators.endsWith';
      case FilterOperatorValue.NotEndsWith:
        return 'analyze.filter.operators.notEndsWith';
      case FilterOperatorValue.Empty:
        return 'analyze.filter.operators.empty';
      case FilterOperatorValue.NotEmpty:
        return 'analyze.filter.operators.notEmpty';
      case FilterOperatorValue.True:
        return 'analyze.filter.operators.isTrue';
      case FilterOperatorValue.False:
        return 'analyze.filter.operators.isFalse';
      default:
        throw new Error(`Unknown filter operator value: ${this.value}`);
    }
  }

  get isValid() {
    if (typeof this.schema === 'undefined') return undefined;
    if (
      !this.allowEmpty &&
      [FilterOperatorValue.Empty, FilterOperatorValue.NotEmpty].includes(
        this.value,
      )
    )
      return false;
    return this.suitableRuleTypes.includes(this.schema.type);
  }

  get type() {
    return this.schema?.type;
  }

  get allowEmpty() {
    return this.schema?.allowEmpty;
  }

  get suitableRuleTypes() {
    switch (this.value) {
      case FilterOperatorValue.Equal:
      case FilterOperatorValue.NotEqual:
        return [
          ColumnTypes.String,
          ColumnTypes.Citext,
          ColumnTypes.Integer,
          ColumnTypes.Rating,
          ColumnTypes.Float,
          ColumnTypes.Enum,
          ColumnTypes.Date,
          ColumnTypes.DateTime,
          ColumnTypes.Time,
        ];
      case FilterOperatorValue.Less:
      case FilterOperatorValue.LessOrEqual:
      case FilterOperatorValue.Greater:
      case FilterOperatorValue.GreaterOrEqual:
        return [
          ColumnTypes.Integer,
          ColumnTypes.Rating,
          ColumnTypes.Float,
          ColumnTypes.Date,
          ColumnTypes.DateTime,
          ColumnTypes.Time,
        ];
      case FilterOperatorValue.StartsWith:
      case FilterOperatorValue.StartsNotWith:
      case FilterOperatorValue.Contains:
      case FilterOperatorValue.NotContains:
      case FilterOperatorValue.EndsWith:
      case FilterOperatorValue.NotEndsWith:
        return [ColumnTypes.String, ColumnTypes.Citext, ColumnTypes.Enum];
      case FilterOperatorValue.Empty:
        return [
          ColumnTypes.String,
          ColumnTypes.Citext,
          ColumnTypes.Integer,
          ColumnTypes.Rating,
          ColumnTypes.Float,
          ColumnTypes.Enum,
          ColumnTypes.Date,
          ColumnTypes.DateTime,
          ColumnTypes.Time,
        ];
      case FilterOperatorValue.NotEmpty:
        return [
          ColumnTypes.String,
          ColumnTypes.Citext,
          ColumnTypes.Integer,
          ColumnTypes.Rating,
          ColumnTypes.Float,
          ColumnTypes.Enum,
          ColumnTypes.Date,
          ColumnTypes.DateTime,
          ColumnTypes.Time,
          ColumnTypes.Photo,
        ];
      case FilterOperatorValue.True:
      case FilterOperatorValue.False:
        return [ColumnTypes.Boolean];
      default:
        throw new Error(`Unknown filter operator value: ${this.value}`);
    }
  }

  toJSON(): FilterRuleOperatorJson {
    return {
      value: this.value,
    };
  }

  static FromJSON(json: string | FilterRuleOperatorJson) {
    const data = 'string' === typeof json ? JSON.parse(json) : json;

    return new FilterRuleOperator({
      value: data.value,
    });
  }
}

export enum FilterOperatorValue {
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
