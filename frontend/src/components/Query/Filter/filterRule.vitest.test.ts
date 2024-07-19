import { describe, expect, it } from 'vitest';
import { FilterRule, type FilterRuleSchema } from './filterRule';
import { ColumnTypes } from 'src/utils/columnTypes';
import { FilterRuleColumn } from './filterRuleColumn';
import { FilterOperatorValue, FilterRuleOperator } from './filterRuleOperator';
import { FilterRuleTerm } from './filterRuleTerm';

describe('FilterRule', () => {
  it('should create a new empty FilterRule', () => {
    const filterRule = new FilterRule();

    expect(filterRule.column).toBeUndefined();
    expect(filterRule.operator).toBeUndefined();
    expect(filterRule.term).toBeUndefined();
    expect(filterRule.includeEntitiesWithoutAttributions).toBe(false);
  });

  it('should create a new FilterRule with column', () => {
    const column = new FilterRuleColumn({
      tableName: 'tableName',
      tableColumnName: 'tableColumnName',
      tableLabel: 'tableLabel',
      tableColumnLabel: 'tableColumnLabel',
      schema: undefined,
    });

    const filterRule = new FilterRule({ column });

    expect(filterRule.column).toBe(column);
  });

  it('should create a new FilterRule with operator', () => {
    const operator = new FilterRuleOperator({
      value: FilterOperatorValue.Equal,
    });

    const filterRule = new FilterRule({ operator });

    expect(filterRule.operator).toBe(operator);
  });

  it('should create a new FilterRule with term', () => {
    const term = new FilterRuleTerm({ value: 'value' });

    const filterRule = new FilterRule({ term });

    expect(filterRule.term).toBe(term);
  });

  it('should fail to create a new FilterRule with includeEntitiesWithoutAttributions', () => {
    const includeEntitiesWithoutAttributions = true;

    expect(
      () => new FilterRule({ includeEntitiesWithoutAttributions }),
    ).toThrowError('Only attributions can have this property');
  });

  it('should create a new FilterRule with includeEntitiesWithoutAttributions', () => {
    const column = new FilterRuleColumn({
      tableName: 'attributes',
      tableColumnName: 'tableColumnName',
      tableLabel: 'tableLabel',
      tableColumnLabel: 'tableColumnLabel',
      schema: undefined,
    });

    const filterRule = new FilterRule({
      column,
      includeEntitiesWithoutAttributions: true,
    });

    expect(filterRule.includeEntitiesWithoutAttributions).toBe(true);
  });

  it('should set the operator schema', () => {
    const schema: FilterRuleSchema = {
      allowEmpty: false,
      type: ColumnTypes.Boolean,
    };

    const column = new FilterRuleColumn({
      tableName: 'tableName',
      tableColumnName: 'tableColumnName',
      tableLabel: 'tableLabel',
      tableColumnLabel: 'tableColumnLabel',
      schema,
    });

    const operator = new FilterRuleOperator({
      value: FilterOperatorValue.True,
    });

    const filterRule = new FilterRule({ column, operator });

    expect(filterRule.operator?.schema).toBe(schema);
  });

  it('should remove the operator schema', () => {
    const column = new FilterRuleColumn({
      tableName: 'tableName',
      tableColumnName: 'tableColumnName',
      tableLabel: 'tableLabel',
      tableColumnLabel: 'tableColumnLabel',
      schema: {
        allowEmpty: false,
        type: ColumnTypes.Boolean,
      },
    });
    const operator = new FilterRuleOperator({
      value: FilterOperatorValue.True,
    });
    const filterRule = new FilterRule({ column, operator });

    filterRule.column = new FilterRuleColumn({
      tableName: 'tableName',
      tableColumnName: 'tableColumnName',
      tableLabel: 'tableLabel',
      tableColumnLabel: 'tableColumnLabel',
      schema: undefined,
    });

    expect(filterRule.operator?.schema).toBeUndefined();
  });

  it('should set the term schema', () => {
    const schema: FilterRuleSchema = {
      allowEmpty: false,
      type: ColumnTypes.Boolean,
    };

    const column = new FilterRuleColumn({
      tableName: 'tableName',
      tableColumnName: 'tableColumnName',
      tableLabel: 'tableLabel',
      tableColumnLabel: 'tableColumnLabel',
      schema,
    });

    const term = new FilterRuleTerm({ value: 'value' });

    const filterRule = new FilterRule({ column, term });

    expect(filterRule.term?.schema).toBe(schema);
  });

  it('should remove the term schema', () => {
    const column = new FilterRuleColumn({
      tableName: 'tableName',
      tableColumnName: 'tableColumnName',
      tableLabel: 'tableLabel',
      tableColumnLabel: 'tableColumnLabel',
      schema: {
        allowEmpty: false,
        type: ColumnTypes.Boolean,
      },
    });
    const term = new FilterRuleTerm({ value: 'value' });
    const filterRule = new FilterRule({ column, term });

    filterRule.column = new FilterRuleColumn({
      tableName: 'tableName',
      tableColumnName: 'tableColumnName',
      tableLabel: 'tableLabel',
      tableColumnLabel: 'tableColumnLabel',
      schema: undefined,
    });

    expect(filterRule.term?.schema).toBeUndefined();
  });

  it('should return isAttribute', () => {
    const column = new FilterRuleColumn({
      tableName: 'attributes',
      tableColumnName: 'tableColumnName',
      tableLabel: 'tableLabel',
      tableColumnLabel: 'tableColumnLabel',
      schema: undefined,
    });

    const filterRule = new FilterRule({ column });

    expect(filterRule.isAttribute).toBe(true);
  });

  it('should not return isAttribute', () => {
    const column = new FilterRuleColumn({
      tableName: 'plants',
      tableColumnName: 'tableColumnName',
      tableLabel: 'tableLabel',
      tableColumnLabel: 'tableColumnLabel',
      schema: undefined,
    });

    const filterRule = new FilterRule({ column });

    expect(filterRule.isAttribute).toBe(false);
  });

  it('should return type', () => {
    const column = new FilterRuleColumn({
      tableName: 'attributes',
      tableColumnName: 'tableColumnName',
      tableLabel: 'tableLabel',
      tableColumnLabel: 'tableColumnLabel',
      schema: {
        allowEmpty: true,
        type: ColumnTypes.Boolean,
      },
    });

    const filterRule = new FilterRule({ column });

    expect(filterRule.type).toBe(ColumnTypes.Boolean);
  });

  it('should not return type', () => {
    const column = new FilterRuleColumn({
      tableName: 'attributes',
      tableColumnName: 'tableColumnName',
      tableLabel: 'tableLabel',
      tableColumnLabel: 'tableColumnLabel',
      schema: undefined,
    });

    const filterRule = new FilterRule({ column });

    expect(filterRule.type).toBeUndefined();
  });

  it('should retern tableName', () => {
    const column = new FilterRuleColumn({
      tableName: 'tableName',
      tableColumnName: 'tableColumnName',
      tableLabel: 'tableLabel',
      tableColumnLabel: 'tableColumnLabel',
      schema: undefined,
    });

    const filterRule = new FilterRule({ column });

    expect(filterRule.tableName).toBe('tableName');
  });

  it('should retern tableColumnName', () => {
    const column = new FilterRuleColumn({
      tableName: 'tableName',
      tableColumnName: 'tableColumnName',
      tableLabel: 'tableLabel',
      tableColumnLabel: 'tableColumnLabel',
      schema: undefined,
    });

    const filterRule = new FilterRule({ column });

    expect(filterRule.columnName).toBe('tableColumnName');
  });

  it('should return true for canBeNullOrEmpty: Equal', () => {
    const column = new FilterRuleColumn({
      tableName: 'tableName',
      tableColumnName: 'tableColumnName',
      tableLabel: 'tableLabel',
      tableColumnLabel: 'tableColumnLabel',
      schema: {
        allowEmpty: true,
        type: ColumnTypes.String,
        validation: {
          maxLen: null,
          pattern: null,
        },
      },
    });

    const operator = new FilterRuleOperator({
      value: FilterOperatorValue.Equal,
    });

    const filterRule = new FilterRule({ column, operator });

    expect(filterRule.canBeNullOrEmpty).toBe(true);
  });

  it('should return true for canBeNullOrEmpty: Not Equal', () => {
    const column = new FilterRuleColumn({
      tableName: 'tableName',
      tableColumnName: 'tableColumnName',
      tableLabel: 'tableLabel',
      tableColumnLabel: 'tableColumnLabel',
      schema: {
        allowEmpty: true,
        type: ColumnTypes.String,
        validation: {
          maxLen: null,
          pattern: null,
        },
      },
    });

    const operator = new FilterRuleOperator({
      value: FilterOperatorValue.NotEqual,
    });

    const filterRule = new FilterRule({ column, operator });

    expect(filterRule.canBeNullOrEmpty).toBe(true);
  });

  it('should return true for canBeNullOrEmpty: Empty', () => {
    const column = new FilterRuleColumn({
      tableName: 'tableName',
      tableColumnName: 'tableColumnName',
      tableLabel: 'tableLabel',
      tableColumnLabel: 'tableColumnLabel',
      schema: {
        allowEmpty: true,
        type: ColumnTypes.String,
        validation: {
          maxLen: null,
          pattern: null,
        },
      },
    });

    const operator = new FilterRuleOperator({
      value: FilterOperatorValue.Empty,
    });

    const filterRule = new FilterRule({ column, operator });

    expect(filterRule.canBeNullOrEmpty).toBe(true);
  });

  it('should return true for canBeNullOrEmpty: Not Empty', () => {
    const column = new FilterRuleColumn({
      tableName: 'tableName',
      tableColumnName: 'tableColumnName',
      tableLabel: 'tableLabel',
      tableColumnLabel: 'tableColumnLabel',
      schema: {
        allowEmpty: true,
        type: ColumnTypes.String,
        validation: {
          maxLen: null,
          pattern: null,
        },
      },
    });

    const operator = new FilterRuleOperator({
      value: FilterOperatorValue.NotEmpty,
    });

    const filterRule = new FilterRule({ column, operator });

    expect(filterRule.canBeNullOrEmpty).toBe(true);
  });

  it('should return false for canBeNullOrEmpty: allowEmpty = false', () => {
    const column = new FilterRuleColumn({
      tableName: 'tableName',
      tableColumnName: 'tableColumnName',
      tableLabel: 'tableLabel',
      tableColumnLabel: 'tableColumnLabel',
      schema: {
        allowEmpty: false,
        type: ColumnTypes.String,
        validation: {
          maxLen: null,
          pattern: null,
        },
      },
    });

    const operator = new FilterRuleOperator({
      value: FilterOperatorValue.Equal,
    });

    const filterRule = new FilterRule({ column, operator });

    expect(filterRule.canBeNullOrEmpty).toBe(false);
  });

  it('should return false for canBeNullOrEmpty: Not a string', () => {
    const column = new FilterRuleColumn({
      tableName: 'tableName',
      tableColumnName: 'tableColumnName',
      tableLabel: 'tableLabel',
      tableColumnLabel: 'tableColumnLabel',
      schema: {
        allowEmpty: true,
        type: ColumnTypes.Photo,
      },
    });

    const operator = new FilterRuleOperator({
      value: FilterOperatorValue.Equal,
    });

    const filterRule = new FilterRule({ column, operator });

    expect(filterRule.canBeNullOrEmpty).toBe(false);
  });

  it('should return undefined for canBeNullOrEmpty: Missing column', () => {
    const column = undefined;

    const operator = new FilterRuleOperator({
      value: FilterOperatorValue.Equal,
    });

    const filterRule = new FilterRule({ column, operator });

    expect(filterRule.canBeNullOrEmpty).toBeUndefined();
  });

  it('should return undefined for canBeNullOrEmpty: Missing operator', () => {
    const column = new FilterRuleColumn({
      tableName: 'tableName',
      tableColumnName: 'tableColumnName',
      tableLabel: 'tableLabel',
      tableColumnLabel: 'tableColumnLabel',
      schema: {
        allowEmpty: true,
        type: ColumnTypes.String,
        validation: {
          maxLen: null,
          pattern: null,
        },
      },
    });

    const operator = undefined;

    const filterRule = new FilterRule({ column, operator });

    expect(filterRule.canBeNullOrEmpty).toBeUndefined();
  });

  it('should return true for requiresTerm: Time', () => {
    const column = new FilterRuleColumn({
      tableName: 'tableName',
      tableColumnName: 'tableColumnName',
      tableLabel: 'tableLabel',
      tableColumnLabel: 'tableColumnLabel',
      schema: {
        allowEmpty: true,
        type: ColumnTypes.Time,
      },
    });

    const filterRule = new FilterRule({ column });

    expect(filterRule.requiresTerm).toBe(true);
  });

  it('should return true for requiresTerm: Date', () => {
    const column = new FilterRuleColumn({
      tableName: 'tableName',
      tableColumnName: 'tableColumnName',
      tableLabel: 'tableLabel',
      tableColumnLabel: 'tableColumnLabel',
      schema: {
        allowEmpty: true,
        type: ColumnTypes.Date,
      },
    });

    const filterRule = new FilterRule({ column });

    expect(filterRule.requiresTerm).toBe(true);
  });

  it('should return true for requiresTerm: Datetime', () => {
    const column = new FilterRuleColumn({
      tableName: 'tableName',
      tableColumnName: 'tableColumnName',
      tableLabel: 'tableLabel',
      tableColumnLabel: 'tableColumnLabel',
      schema: {
        allowEmpty: true,
        type: ColumnTypes.DateTime,
      },
    });

    const filterRule = new FilterRule({ column });

    expect(filterRule.requiresTerm).toBe(true);
  });

  it('should return true for requiresTerm: Integer', () => {
    const column = new FilterRuleColumn({
      tableName: 'tableName',
      tableColumnName: 'tableColumnName',
      tableLabel: 'tableLabel',
      tableColumnLabel: 'tableColumnLabel',
      schema: {
        allowEmpty: true,
        type: ColumnTypes.Integer,
        validation: {
          min: 0,
          max: 100,
          step: 1,
        },
      },
    });

    const filterRule = new FilterRule({ column });

    expect(filterRule.requiresTerm).toBe(true);
  });

  it('should return true for requiresTerm: Rating', () => {
    const column = new FilterRuleColumn({
      tableName: 'tableName',
      tableColumnName: 'tableColumnName',
      tableLabel: 'tableLabel',
      tableColumnLabel: 'tableColumnLabel',
      schema: {
        allowEmpty: true,
        type: ColumnTypes.Rating,
        validation: {
          min: 0,
          max: 9,
          step: 1,
        },
      },
    });

    const filterRule = new FilterRule({ column });

    expect(filterRule.requiresTerm).toBe(true);
  });

  it('should return true for requiresTerm: Float', () => {
    const column = new FilterRuleColumn({
      tableName: 'tableName',
      tableColumnName: 'tableColumnName',
      tableLabel: 'tableLabel',
      tableColumnLabel: 'tableColumnLabel',
      schema: {
        allowEmpty: true,
        type: ColumnTypes.Float,
        validation: {
          min: 0,
          max: 100,
          step: 0.1,
        },
      },
    });

    const filterRule = new FilterRule({ column });

    expect(filterRule.requiresTerm).toBe(true);
  });

  it('should return true for requiresTerm: Enum', () => {
    const column = new FilterRuleColumn({
      tableName: 'tableName',
      tableColumnName: 'tableColumnName',
      tableLabel: 'tableLabel',
      tableColumnLabel: 'tableColumnLabel',
      schema: {
        allowEmpty: true,
        type: ColumnTypes.Enum,
        validation: {
          options: ['option1', 'option2'],
        },
      },
    });

    const filterRule = new FilterRule({ column });

    expect(filterRule.requiresTerm).toBe(true);
  });

  it('should return true for requiresTerm: String with equal operator', () => {
    const column = new FilterRuleColumn({
      tableName: 'tableName',
      tableColumnName: 'tableColumnName',
      tableLabel: 'tableLabel',
      tableColumnLabel: 'tableColumnLabel',
      schema: {
        allowEmpty: true,
        type: ColumnTypes.String,
        validation: {
          maxLen: null,
          pattern: null,
        },
      },
    });

    const operator = new FilterRuleOperator({
      value: FilterOperatorValue.Equal,
    });

    const filterRule = new FilterRule({ column, operator });

    expect(filterRule.requiresTerm).toBe(true);
  });

  it('should return false for requiresTerm: String with empty operator', () => {
    const column = new FilterRuleColumn({
      tableName: 'tableName',
      tableColumnName: 'tableColumnName',
      tableLabel: 'tableLabel',
      tableColumnLabel: 'tableColumnLabel',
      schema: {
        allowEmpty: true,
        type: ColumnTypes.String,
        validation: {
          maxLen: null,
          pattern: null,
        },
      },
    });

    const operator = new FilterRuleOperator({
      value: FilterOperatorValue.Empty,
    });

    const filterRule = new FilterRule({ column, operator });

    expect(filterRule.requiresTerm).toBe(false);
  });

  it('should return false for requiresTerm: String with not empty operator', () => {
    const column = new FilterRuleColumn({
      tableName: 'tableName',
      tableColumnName: 'tableColumnName',
      tableLabel: 'tableLabel',
      tableColumnLabel: 'tableColumnLabel',
      schema: {
        allowEmpty: true,
        type: ColumnTypes.String,
        validation: {
          maxLen: null,
          pattern: null,
        },
      },
    });

    const operator = new FilterRuleOperator({
      value: FilterOperatorValue.NotEmpty,
    });

    const filterRule = new FilterRule({ column, operator });

    expect(filterRule.requiresTerm).toBe(false);
  });

  it('should return false for requiresTerm: Boolean', () => {
    const column = new FilterRuleColumn({
      tableName: 'tableName',
      tableColumnName: 'tableColumnName',
      tableLabel: 'tableLabel',
      tableColumnLabel: 'tableColumnLabel',
      schema: {
        allowEmpty: true,
        type: ColumnTypes.Boolean,
      },
    });

    const filterRule = new FilterRule({ column });

    expect(filterRule.requiresTerm).toBe(false);
  });

  it('should return false for requiresTerm: Photo', () => {
    const column = new FilterRuleColumn({
      tableName: 'tableName',
      tableColumnName: 'tableColumnName',
      tableLabel: 'tableLabel',
      tableColumnLabel: 'tableColumnLabel',
      schema: {
        allowEmpty: true,
        type: ColumnTypes.Photo,
      },
    });

    const filterRule = new FilterRule({ column });

    expect(filterRule.requiresTerm).toBe(false);
  });

  it('should return false for requiresTerm: Missing column', () => {
    const column = undefined;

    const filterRule = new FilterRule({ column });

    expect(filterRule.requiresTerm).toBe(false);
  });

  it('should return undefined for isValid: Missing column', () => {
    const column = undefined;
    const operator = new FilterRuleOperator({
      value: FilterOperatorValue.Equal,
    });

    const filterRule = new FilterRule({ column, operator });

    expect(filterRule.isValid).toBeUndefined();
  });

  it('should return undefined for isValid: Missing operator', () => {
    const column = new FilterRuleColumn({
      tableName: 'tableName',
      tableColumnName: 'tableColumnName',
      tableLabel: 'tableLabel',
      tableColumnLabel: 'tableColumnLabel',
      schema: {
        allowEmpty: true,
        type: ColumnTypes.String,
        validation: {
          maxLen: null,
          pattern: null,
        },
      },
    });
    const operator = undefined;

    const filterRule = new FilterRule({ column, operator });

    expect(filterRule.isValid).toBeUndefined();
  });

  it('should return undefined for isValid: Missing term', () => {
    const column = new FilterRuleColumn({
      tableName: 'tableName',
      tableColumnName: 'tableColumnName',
      tableLabel: 'tableLabel',
      tableColumnLabel: 'tableColumnLabel',
      schema: {
        allowEmpty: false,
        type: ColumnTypes.String,
        validation: {
          maxLen: null,
          pattern: null,
        },
      },
    });
    const operator = new FilterRuleOperator({
      value: FilterOperatorValue.Equal,
    });

    const filterRule = new FilterRule({ column, operator });

    expect(filterRule.isValid).toBeUndefined();
  });

  it("should return true for isValid: doesn't require term", () => {
    const column = new FilterRuleColumn({
      tableName: 'tableName',
      tableColumnName: 'tableColumnName',
      tableLabel: 'tableLabel',
      tableColumnLabel: 'tableColumnLabel',
      schema: {
        allowEmpty: false,
        type: ColumnTypes.Boolean,
      },
    });
    const operator = new FilterRuleOperator({
      value: FilterOperatorValue.True,
    });

    const filterRule = new FilterRule({ column, operator });

    expect(filterRule.isValid).toBe(true);
  });

  it('should return false for isValid: invalid column', () => {
    const column = new FilterRuleColumn({
      tableName: 'tableName',
      tableColumnName: 'tableColumnName',
      tableLabel: 'tableLabel',
      tableColumnLabel: 'tableColumnLabel',
      schema: undefined,
    });
    const operator = new FilterRuleOperator({
      value: FilterOperatorValue.Equal,
    });
    const term = new FilterRuleTerm({ value: 'value' });

    const filterRule = new FilterRule({ column, operator, term });

    expect(filterRule.isValid).toBe(false);
  });

  it('should return false for isValid: invalid operator', () => {
    const column = new FilterRuleColumn({
      tableName: 'tableName',
      tableColumnName: 'tableColumnName',
      tableLabel: 'tableLabel',
      tableColumnLabel: 'tableColumnLabel',
      schema: {
        allowEmpty: false,
        type: ColumnTypes.String,
        validation: {
          maxLen: null,
          pattern: null,
        },
      },
    });
    const operator = new FilterRuleOperator({
      value: FilterOperatorValue.Greater,
    });
    const term = new FilterRuleTerm({ value: 'value' });

    const filterRule = new FilterRule({ column, operator, term });

    expect(filterRule.isValid).toBe(false);
  });

  it('should return false for isValid: invalid term', () => {
    const column = new FilterRuleColumn({
      tableName: 'tableName',
      tableColumnName: 'tableColumnName',
      tableLabel: 'tableLabel',
      tableColumnLabel: 'tableColumnLabel',
      schema: {
        allowEmpty: false,
        type: ColumnTypes.String,
        validation: {
          maxLen: 5,
          pattern: null,
        },
      },
    });
    const operator = new FilterRuleOperator({
      value: FilterOperatorValue.Equal,
    });
    const term = new FilterRuleTerm({ value: '123456' });

    const filterRule = new FilterRule({ column, operator, term });

    expect(filterRule.isValid).toBe(false);
  });

  it('should return true for isValid: requires term, term is valid', () => {
    const column = new FilterRuleColumn({
      tableName: 'tableName',
      tableColumnName: 'tableColumnName',
      tableLabel: 'tableLabel',
      tableColumnLabel: 'tableColumnLabel',
      schema: {
        allowEmpty: false,
        type: ColumnTypes.String,
        validation: {
          maxLen: 5,
          pattern: null,
        },
      },
    });
    const operator = new FilterRuleOperator({
      value: FilterOperatorValue.Equal,
    });
    const term = new FilterRuleTerm({ value: '12345' });

    const filterRule = new FilterRule({ column, operator, term });

    expect(filterRule.isValid).toBe(true);
  });

  it('should serialize toJSON: attribution', () => {
    const rule = new FilterRule({
      column: new FilterRuleColumn({
        tableName: 'attributes',
        tableColumnName: 'tableColumnName',
        tableLabel: 'tableLabel',
        tableColumnLabel: 'tableColumnLabel',
        schema: {
          allowEmpty: false,
          type: ColumnTypes.String,
          validation: {
            maxLen: 5,
            pattern: null,
          },
        },
      }),
      operator: new FilterRuleOperator({
        value: FilterOperatorValue.Equal,
      }),
      term: new FilterRuleTerm({ value: '12345' }),
      includeEntitiesWithoutAttributions: true,
    });

    const json = JSON.stringify(rule);

    expect(JSON.parse(json)).toEqual({
      column: {
        tableName: 'attributes',
        tableColumnName: 'tableColumnName',
      },
      operator: {
        value: FilterOperatorValue.Equal,
      },
      term: {
        value: '12345',
      },
      includeEntitiesWithoutAttributions: true,
    });
  });

  it('should serialize toJSON: other', () => {
    const rule = new FilterRule({
      column: new FilterRuleColumn({
        tableName: 'cultivars',
        tableColumnName: 'tableColumnName',
        tableLabel: 'tableLabel',
        tableColumnLabel: 'tableColumnLabel',
        schema: {
          allowEmpty: false,
          type: ColumnTypes.String,
          validation: {
            maxLen: 5,
            pattern: null,
          },
        },
      }),
      operator: new FilterRuleOperator({
        value: FilterOperatorValue.Equal,
      }),
      term: new FilterRuleTerm({ value: '12345' }),
    });

    const json = JSON.stringify(rule);

    expect(JSON.parse(json)).toEqual({
      column: {
        tableName: 'cultivars',
        tableColumnName: 'tableColumnName',
      },
      operator: {
        value: FilterOperatorValue.Equal,
      },
      term: {
        value: '12345',
      },
    });
  });

  it('should deserialize FromJSON', () => {
    const columns = [
      new FilterRuleColumn({
        tableName: 'attributes',
        tableColumnName: 'tableColumnName',
        tableLabel: 'tableLabel',
        tableColumnLabel: 'tableColumnLabel',
        schema: {
          allowEmpty: false,
          type: ColumnTypes.String,
          validation: {
            maxLen: 5,
            pattern: null,
          },
        },
      }),
      new FilterRuleColumn({
        tableName: 'attributes',
        tableColumnName: 'other',
        tableLabel: 'tableLabel',
        tableColumnLabel: 'other',
        schema: {
          allowEmpty: false,
          type: ColumnTypes.String,
          validation: {
            maxLen: 5,
            pattern: null,
          },
        },
      }),
    ];
    const rule = new FilterRule({
      column: columns[0],
      operator: new FilterRuleOperator({
        value: FilterOperatorValue.Equal,
      }),
      term: new FilterRuleTerm({ value: '12345' }),
      includeEntitiesWithoutAttributions: true,
    });

    const json = JSON.stringify(rule);
    const ruleFromJson = FilterRule.FromJSON(json, columns);

    expect(ruleFromJson).toEqual(rule);
  });
});
