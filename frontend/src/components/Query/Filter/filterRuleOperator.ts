import type { TFunc } from 'src/composables/useI18n';
import { type FilterRuleSchema } from './filterRule';
import { ColumnType } from 'src/components/Query/ColumnDefinitions/columnTypes';

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
        return 'filter.operators.equals';
      case FilterOperatorValue.NotEqual:
        return 'filter.operators.notEquals';
      case FilterOperatorValue.Less:
        return 'filter.operators.less';
      case FilterOperatorValue.LessOrEqual:
        return 'filter.operators.lessOrEqual';
      case FilterOperatorValue.Greater:
        return 'filter.operators.greater';
      case FilterOperatorValue.GreaterOrEqual:
        return 'filter.operators.greaterOrEqual';
      case FilterOperatorValue.StartsWith:
        return 'filter.operators.startsWith';
      case FilterOperatorValue.StartsNotWith:
        return 'filter.operators.startsNotWith';
      case FilterOperatorValue.Contains:
        return 'filter.operators.contains';
      case FilterOperatorValue.NotContains:
        return 'filter.operators.notContains';
      case FilterOperatorValue.EndsWith:
        return 'filter.operators.endsWith';
      case FilterOperatorValue.NotEndsWith:
        return 'filter.operators.notEndsWith';
      case FilterOperatorValue.Empty:
        return 'filter.operators.empty';
      case FilterOperatorValue.NotEmpty:
        return 'filter.operators.notEmpty';
      case FilterOperatorValue.True:
        return 'filter.operators.isTrue';
      case FilterOperatorValue.False:
        return 'filter.operators.isFalse';
      default:
        throw new Error(`Unknown filter operator value: ${this.value}`);
    }
  }

  get isValid() {
    if (typeof this.schema === 'undefined') return undefined;
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
          ColumnType.String,
          ColumnType.Integer,
          ColumnType.Float,
          ColumnType.Enum,
          ColumnType.Date,
          ColumnType.DateTime,
          ColumnType.Time,
        ];
      case FilterOperatorValue.Less:
      case FilterOperatorValue.LessOrEqual:
      case FilterOperatorValue.Greater:
      case FilterOperatorValue.GreaterOrEqual:
        return [
          ColumnType.Integer,
          ColumnType.Float,
          ColumnType.Date,
          ColumnType.DateTime,
          ColumnType.Time,
        ];
      case FilterOperatorValue.StartsWith:
      case FilterOperatorValue.StartsNotWith:
      case FilterOperatorValue.Contains:
      case FilterOperatorValue.NotContains:
      case FilterOperatorValue.EndsWith:
      case FilterOperatorValue.NotEndsWith:
        return [ColumnType.String, ColumnType.Enum];
      case FilterOperatorValue.Empty:
        return [
          ColumnType.String,
          ColumnType.Integer,
          ColumnType.Float,
          ColumnType.Enum,
          ColumnType.Date,
          ColumnType.DateTime,
          ColumnType.Time,
        ];
      case FilterOperatorValue.NotEmpty:
        return [
          ColumnType.String,
          ColumnType.Integer,
          ColumnType.Float,
          ColumnType.Enum,
          ColumnType.Date,
          ColumnType.DateTime,
          ColumnType.Time,
          ColumnType.Photo,
        ];
      case FilterOperatorValue.True:
      case FilterOperatorValue.False:
        return [ColumnType.Boolean];
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
