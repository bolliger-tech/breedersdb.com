import type { FilterRuleTypeSchema } from './filterRule';

export type FilterRuleColumnJson = {
  tableName: string;
  tableColumnName: string;
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

  get name() {
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

  get allowEmptyTerm() {
    return this.schema?.allowEmpty;
  }

  get type() {
    return this.schema?.type;
  }

  toJSON(): FilterRuleColumnJson {
    return {
      tableName: this.tableName,
      tableColumnName: this.tableColumnName,
    };
  }

  static FromJSON(
    json: string | FilterRuleColumnJson,
    definition?: FilterRuleColumn,
  ) {
    const data: FilterRuleColumnJson =
      'string' === typeof json ? JSON.parse(json) : json;

    if (
      definition &&
      (data.tableName !== definition.tableName ||
        data.tableColumnName !== definition.tableColumnName)
    ) {
      throw new Error(
        `Definition does not match JSON. JSON: ${JSON.stringify(data)}. Definition: ${JSON.stringify(definition)}`,
      );
    }

    return new FilterRuleColumn({
      tableName: data.tableName,
      tableColumnName: data.tableColumnName,
      tableLabel: definition ? definition.tableLabel : data.tableName,
      tableColumnLabel: definition
        ? definition.tableColumnLabel
        : data.tableColumnName,
      schema: definition ? definition.schema : undefined,
    });
  }
}
