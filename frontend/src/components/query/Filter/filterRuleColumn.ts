import type { FilterRuleTypeSchema } from './filterRule';

export class FilterRuleColumn {
  public readonly tableName: string;
  public readonly tableColumnName: string;
  public readonly tableLabel: string;
  public readonly tableColumnLabel: string;
  public readonly schema: FilterRuleTypeSchema | undefined;

  constructor({
    tableName,
    tableColumnName,
    tableLabel,
    tableColumnLabel,
    schema,
  }: {
    tableName: string;
    tableColumnName: string;
    tableLabel: string;
    tableColumnLabel: string;
    schema: FilterRuleTypeSchema | undefined;
  }) {
    this.tableName = tableName;
    this.tableColumnName = tableColumnName;
    this.tableLabel = tableLabel;
    this.tableColumnLabel = tableColumnLabel;
    this.schema = schema;
  }

  get value() {
    return `${this.tableName}.${this.tableColumnName}`;
  }

  get label() {
    return `${this.tableLabel} > ${this.tableColumnLabel}`;
  }

  get isAttribute() {
    return this.tableName === 'attributes';
  }

  get isValid() {
    return this.schema !== undefined;
  }

  get termCanBeEmpty() {
    return this.schema?.allowEmpty;
  }

  get type() {
    return this.schema?.type;
  }
}
