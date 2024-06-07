import { describe, expect, it } from 'vitest';
import { FilterOperatorValue, FilterRuleOperator } from './filterRuleOperator';
import { ColumnType } from 'src/components/Query/ColumnDefinitions/columnTypes';

describe('FilterRuleOperator', () => {
  it('should create a new FilterRuleOperator', () => {
    const operator = new FilterRuleOperator({
      value: FilterOperatorValue.Equal,
    });

    expect(operator.value).toBe(FilterOperatorValue.Equal);
  });

  it('should return a labelKey for every possible filter operator value', () => {
    const possibleValues = Object.values(FilterOperatorValue);
    for (const value of possibleValues) {
      const operator = new FilterRuleOperator({
        value,
      });

      expect(operator.labelKey).toBeDefined();
    }
  });

  it('should return isValid: false when no schema', () => {
    const operator = new FilterRuleOperator({
      value: FilterOperatorValue.Equal,
    });

    expect(operator.isValid).toBe(undefined);
  });

  it("should return isValid: false when type doesn't suit", () => {
    const operator = new FilterRuleOperator({
      value: FilterOperatorValue.Equal,
    });
    operator.schema = {
      allowEmpty: true,
      type: ColumnType.Boolean,
    };

    expect(operator.isValid).toBe(false);
  });

  it('should return isValid: true when type suits', () => {
    const operator = new FilterRuleOperator({
      value: FilterOperatorValue.False,
    });
    operator.schema = {
      allowEmpty: true,
      type: ColumnType.Boolean,
    };

    expect(operator.isValid).toBe(true);
  });

  it('should return type: undefined when no schema', () => {
    const operator = new FilterRuleOperator({
      value: FilterOperatorValue.Equal,
    });

    expect(operator.type).toBe(undefined);
  });

  it('should return type: Boolean', () => {
    const operator = new FilterRuleOperator({
      value: FilterOperatorValue.Equal,
    });
    operator.schema = {
      allowEmpty: true,
      type: ColumnType.Boolean,
    };

    expect(operator.type).toBe(ColumnType.Boolean);
  });

  it('should return allowEmpty: undefined when no schema', () => {
    const operator = new FilterRuleOperator({
      value: FilterOperatorValue.Equal,
    });

    expect(operator.allowEmpty).toBe(undefined);
  });

  it('should return allowEmpty: true', () => {
    const operator = new FilterRuleOperator({
      value: FilterOperatorValue.Equal,
    });
    operator.schema = {
      allowEmpty: true,
      type: ColumnType.Boolean,
    };

    expect(operator.allowEmpty).toBe(true);
  });

  describe('suitableRuleTypes', () => {
    it('should return the types for every possible filter operator value', () => {
      const possibleValues = Object.values(FilterOperatorValue);
      for (const value of possibleValues) {
        const operator = new FilterRuleOperator({
          value,
        });

        expect(operator.suitableRuleTypes).toBeDefined();
      }
    });

    it('for Equal', () => {
      const operator = new FilterRuleOperator({
        value: FilterOperatorValue.Equal,
      });

      expect(operator.suitableRuleTypes).toEqual([
        ColumnType.String,
        ColumnType.Integer,
        ColumnType.Float,
        ColumnType.Enum,
        ColumnType.Date,
        ColumnType.DateTime,
        ColumnType.Time,
      ]);
    });

    it('for NotEqual', () => {
      const operator = new FilterRuleOperator({
        value: FilterOperatorValue.Equal,
      });

      expect(operator.suitableRuleTypes).toEqual([
        ColumnType.String,
        ColumnType.Integer,
        ColumnType.Float,
        ColumnType.Enum,
        ColumnType.Date,
        ColumnType.DateTime,
        ColumnType.Time,
      ]);
    });

    it('for Less', () => {
      const operator = new FilterRuleOperator({
        value: FilterOperatorValue.Less,
      });

      expect(operator.suitableRuleTypes).toEqual([
        ColumnType.Integer,
        ColumnType.Float,
        ColumnType.Date,
        ColumnType.DateTime,
        ColumnType.Time,
      ]);
    });

    it('for LessOrEqual', () => {
      const operator = new FilterRuleOperator({
        value: FilterOperatorValue.LessOrEqual,
      });

      expect(operator.suitableRuleTypes).toEqual([
        ColumnType.Integer,
        ColumnType.Float,
        ColumnType.Date,
        ColumnType.DateTime,
        ColumnType.Time,
      ]);
    });

    it('for Greater', () => {
      const operator = new FilterRuleOperator({
        value: FilterOperatorValue.Greater,
      });

      expect(operator.suitableRuleTypes).toEqual([
        ColumnType.Integer,
        ColumnType.Float,
        ColumnType.Date,
        ColumnType.DateTime,
        ColumnType.Time,
      ]);
    });

    it('for GreaterOrEqual', () => {
      const operator = new FilterRuleOperator({
        value: FilterOperatorValue.GreaterOrEqual,
      });

      expect(operator.suitableRuleTypes).toEqual([
        ColumnType.Integer,
        ColumnType.Float,
        ColumnType.Date,
        ColumnType.DateTime,
        ColumnType.Time,
      ]);
    });

    it('for StartsWith', () => {
      const operator = new FilterRuleOperator({
        value: FilterOperatorValue.StartsWith,
      });

      expect(operator.suitableRuleTypes).toEqual([
        ColumnType.String,
        ColumnType.Enum,
      ]);
    });

    it('for StartsNotWith', () => {
      const operator = new FilterRuleOperator({
        value: FilterOperatorValue.StartsNotWith,
      });

      expect(operator.suitableRuleTypes).toEqual([
        ColumnType.String,
        ColumnType.Enum,
      ]);
    });

    it('for Contains', () => {
      const operator = new FilterRuleOperator({
        value: FilterOperatorValue.Contains,
      });

      expect(operator.suitableRuleTypes).toEqual([
        ColumnType.String,
        ColumnType.Enum,
      ]);
    });

    it('for NotContains', () => {
      const operator = new FilterRuleOperator({
        value: FilterOperatorValue.NotContains,
      });

      expect(operator.suitableRuleTypes).toEqual([
        ColumnType.String,
        ColumnType.Enum,
      ]);
    });

    it('for EndsWith', () => {
      const operator = new FilterRuleOperator({
        value: FilterOperatorValue.EndsWith,
      });

      expect(operator.suitableRuleTypes).toEqual([
        ColumnType.String,
        ColumnType.Enum,
      ]);
    });

    it('for NotEndsWith', () => {
      const operator = new FilterRuleOperator({
        value: FilterOperatorValue.NotEndsWith,
      });

      expect(operator.suitableRuleTypes).toEqual([
        ColumnType.String,
        ColumnType.Enum,
      ]);
    });

    it('for Empty', () => {
      const operator = new FilterRuleOperator({
        value: FilterOperatorValue.Empty,
      });

      expect(operator.suitableRuleTypes).toEqual([
        ColumnType.String,
        ColumnType.Integer,
        ColumnType.Float,
        ColumnType.Enum,
        ColumnType.Date,
        ColumnType.DateTime,
        ColumnType.Time,
      ]);
    });

    it('for NotEmpty', () => {
      const operator = new FilterRuleOperator({
        value: FilterOperatorValue.NotEmpty,
      });

      expect(operator.suitableRuleTypes).toEqual([
        ColumnType.String,
        ColumnType.Integer,
        ColumnType.Float,
        ColumnType.Enum,
        ColumnType.Date,
        ColumnType.DateTime,
        ColumnType.Time,
        ColumnType.Photo,
      ]);
    });

    it('for True', () => {
      const operator = new FilterRuleOperator({
        value: FilterOperatorValue.True,
      });

      expect(operator.suitableRuleTypes).toEqual([ColumnType.Boolean]);
    });

    it('for False', () => {
      const operator = new FilterRuleOperator({
        value: FilterOperatorValue.False,
      });

      expect(operator.suitableRuleTypes).toEqual([ColumnType.Boolean]);
    });
  });

  it('should serialize', () => {
    const operator = new FilterRuleOperator({
      value: FilterOperatorValue.Equal,
    });

    expect(operator.toJSON()).toEqual({
      value: FilterOperatorValue.Equal,
    });
  });

  it('should deserialize', () => {
    const json = JSON.stringify(
      new FilterRuleOperator({
        value: FilterOperatorValue.Equal,
      }),
    );

    const operator = FilterRuleOperator.FromJSON(json);

    expect(operator.value).toBe(FilterOperatorValue.Equal);
  });
});
