import type { FilterRuleTypeSchema } from './filterRule';

export type FilterRuleColumnJson = {
  tableName: string;
  tableColumnName: string;
  tableLabel: string;
  tableColumnLabel: string;
};

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

  toJSON(): FilterRuleColumnJson {
    return {
      tableName: this.tableName,
      tableColumnName: this.tableColumnName,
      tableLabel: this.tableLabel,
      tableColumnLabel: this.tableColumnLabel,
    };
  }

  static FromJSON(
    json: string | FilterRuleColumnJson,
    schema?: FilterRuleTypeSchema,
  ) {
    const data: FilterRuleColumnJson =
      'string' === typeof json ? JSON.parse(json) : json;

    return new FilterRuleColumn({
      tableName: data.tableName,
      tableColumnName: data.tableColumnName,
      tableLabel: data.tableLabel,
      tableColumnLabel: data.tableColumnLabel,
      schema,
    });
  }
}
