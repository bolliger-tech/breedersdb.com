import { describe, expect, it } from 'vitest';
import { FilterRuleColumn } from './filterRuleColumn';
import { ColumnType } from 'src/components/Query/ColumnDefinitions/columnTypes';

describe('FilterRuleColumn', () => {
  it('should create a new FilterRuleColumn', () => {
    const filterRuleColumn = new FilterRuleColumn({
      tableName: 'table',
      tableColumnName: 'column',
      tableLabel: 'Table',
      tableColumnLabel: 'Column',
      schema: undefined,
    });
    expect(filterRuleColumn.tableName).toBe('table');
    expect(filterRuleColumn.tableColumnName).toBe('column');
    expect(filterRuleColumn.tableLabel).toBe('Table');
    expect(filterRuleColumn.tableColumnLabel).toBe('Column');
    expect(filterRuleColumn.schema).toBeUndefined();
  });

  it('should create a new FilterRuleColumn with FilterRuleSchema', () => {
    const schema = {
      type: ColumnType.String,
      allowEmpty: true,
      validation: {
        maxLen: 10,
        pattern: null,
      },
    } as const;
    const filterRuleColumn = new FilterRuleColumn({
      tableName: 'table',
      tableColumnName: 'column',
      tableLabel: 'Table',
      tableColumnLabel: 'Column',
      schema,
    });
    expect(filterRuleColumn.tableName).toBe('table');
    expect(filterRuleColumn.tableColumnName).toBe('column');
    expect(filterRuleColumn.tableLabel).toBe('Table');
    expect(filterRuleColumn.tableColumnLabel).toBe('Column');
    expect(filterRuleColumn.schema).toBe(schema);
  });

  it('should return value', () => {
    const filterRuleColumn = new FilterRuleColumn({
      tableName: 'table',
      tableColumnName: 'column',
      tableLabel: 'Table',
      tableColumnLabel: 'Column',
      schema: undefined,
    });
    expect(filterRuleColumn.name).toBe('table.column');
  });

  it('should return label', () => {
    const filterRuleColumn = new FilterRuleColumn({
      tableName: 'table',
      tableColumnName: 'column',
      tableLabel: 'Table',
      tableColumnLabel: 'Column',
      schema: undefined,
    });
    expect(filterRuleColumn.label).toBe('Table > Column');
  });

  it('should return isAttribute: false', () => {
    const filterRuleColumn = new FilterRuleColumn({
      tableName: 'table',
      tableColumnName: 'column',
      tableLabel: 'Table',
      tableColumnLabel: 'Column',
      schema: undefined,
    });
    expect(filterRuleColumn.isAttribute).toBe(false);
  });

  it('should return isAttribute: true', () => {
    const filterRuleColumn = new FilterRuleColumn({
      tableName: 'attributes',
      tableColumnName: 'column',
      tableLabel: 'Attributes',
      tableColumnLabel: 'Column',
      schema: undefined,
    });
    expect(filterRuleColumn.isAttribute).toBe(true);
  });

  it('should return isValid: false when no schema', () => {
    const filterRuleColumn = new FilterRuleColumn({
      tableName: 'table',
      tableColumnName: 'column',
      tableLabel: 'Table',
      tableColumnLabel: 'Column',
      schema: undefined,
    });
    expect(filterRuleColumn.isValid).toBe(false);
  });

  it('should return isValid: true when schema', () => {
    const filterRuleColumn = new FilterRuleColumn({
      tableName: 'table',
      tableColumnName: 'column',
      tableLabel: 'Table',
      tableColumnLabel: 'Column',
      schema: {
        type: ColumnType.String,
        allowEmpty: true,
        validation: {
          maxLen: 10,
          pattern: null,
        },
      },
    });
    expect(filterRuleColumn.isValid).toBe(true);
  });

  it('should return allowEmptyTerm: undefined when no schema', () => {
    const filterRuleColumn = new FilterRuleColumn({
      tableName: 'table',
      tableColumnName: 'column',
      tableLabel: 'Table',
      tableColumnLabel: 'Column',
      schema: undefined,
    });
    expect(filterRuleColumn.allowEmptyTerm).toBeUndefined();
  });

  it('should return allowEmptyTerm: true when schema allowEmpty = true', () => {
    const filterRuleColumn = new FilterRuleColumn({
      tableName: 'table',
      tableColumnName: 'column',
      tableLabel: 'Table',
      tableColumnLabel: 'Column',
      schema: {
        type: ColumnType.String,
        allowEmpty: true,
        validation: {
          maxLen: 10,
          pattern: null,
        },
      },
    });
    expect(filterRuleColumn.allowEmptyTerm).toBe(true);
  });

  it('should return allowEmptyTerm: false when schema allowEmpty = false', () => {
    const filterRuleColumn = new FilterRuleColumn({
      tableName: 'table',
      tableColumnName: 'column',
      tableLabel: 'Table',
      tableColumnLabel: 'Column',
      schema: {
        type: ColumnType.String,
        allowEmpty: false,
        validation: {
          maxLen: 10,
          pattern: null,
        },
      },
    });
    expect(filterRuleColumn.allowEmptyTerm).toBe(false);
  });

  it('should return type: undefined when no schema', () => {
    const filterRuleColumn = new FilterRuleColumn({
      tableName: 'table',
      tableColumnName: 'column',
      tableLabel: 'Table',
      tableColumnLabel: 'Column',
      schema: undefined,
    });
    expect(filterRuleColumn.type).toBeUndefined();
  });

  it('should return type: ColumnType.String when schema type is ColumnType.String', () => {
    const filterRuleColumn = new FilterRuleColumn({
      tableName: 'table',
      tableColumnName: 'column',
      tableLabel: 'Table',
      tableColumnLabel: 'Column',
      schema: {
        type: ColumnType.String,
        allowEmpty: true,
        validation: {
          maxLen: 10,
          pattern: null,
        },
      },
    });
    expect(filterRuleColumn.type).toBe(ColumnType.String);
  });

  it('should serialize toJSON', () => {
    const filterRuleColumn = new FilterRuleColumn({
      tableName: 'table',
      tableColumnName: 'column',
      tableLabel: 'Table',
      tableColumnLabel: 'Column',
      schema: {
        type: ColumnType.String,
        allowEmpty: true,
        validation: {
          maxLen: 10,
          pattern: null,
        },
      },
    });
    expect(filterRuleColumn.toJSON()).toEqual({
      tableName: 'table',
      tableColumnName: 'column',
    });
  });

  it('should deserialize FromJSON: with definition', () => {
    const filterRuleColumn = FilterRuleColumn.FromJSON(
      {
        tableName: 'table',
        tableColumnName: 'column',
      },
      new FilterRuleColumn({
        tableName: 'table',
        tableColumnName: 'column',
        tableLabel: 'Table',
        tableColumnLabel: 'Column',
        schema: {
          type: ColumnType.String,
          allowEmpty: true,
          validation: {
            maxLen: 10,
            pattern: null,
          },
        },
      }),
    );
    expect(filterRuleColumn.tableName).toBe('table');
    expect(filterRuleColumn.tableColumnName).toBe('column');
    expect(filterRuleColumn.tableLabel).toBe('Table');
    expect(filterRuleColumn.tableColumnLabel).toBe('Column');
    expect(filterRuleColumn.schema).toEqual({
      type: ColumnType.String,
      allowEmpty: true,
      validation: {
        maxLen: 10,
        pattern: null,
      },
    });
    expect(filterRuleColumn.isValid).toBe(true);
  });

  it('should deserialize FromJSON: without definition', () => {
    const filterRuleColumn = FilterRuleColumn.FromJSON({
      tableName: 'table',
      tableColumnName: 'column',
    });
    expect(filterRuleColumn.tableName).toBe('table');
    expect(filterRuleColumn.tableColumnName).toBe('column');
    expect(filterRuleColumn.tableLabel).toBe('table');
    expect(filterRuleColumn.tableColumnLabel).toBe('column');
    expect(filterRuleColumn.schema).toBeUndefined();
    expect(filterRuleColumn.isValid).toBe(false);
  });

  it('should failt to deserialize FromJSON: wrong definition', () => {
    expect(() =>
      FilterRuleColumn.FromJSON(
        {
          tableName: 'table',
          tableColumnName: 'column',
        },
        new FilterRuleColumn({
          tableName: 'other',
          tableColumnName: 'column',
          tableLabel: 'Other',
          tableColumnLabel: 'Column',
          schema: undefined,
        }),
      ),
    ).toThrowError('Definition does not match JSON');
  });
});
