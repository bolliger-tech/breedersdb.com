import type { FilterRuleSchema } from './filterRuleTypes';

export class FilterColumn {
  public readonly table: string;
  public readonly tableColumn: string;
  public readonly label: string;
  public readonly schema: FilterRuleSchema | undefined;

  constructor({
    table,
    tableColumn,
    label,
    schema,
  }: {
    table: string;
    tableColumn: string;
    label: string;
    schema: FilterRuleSchema | undefined;
  }) {
    this.table = table;
    this.tableColumn = tableColumn;
    this.label = label;
    this.schema = schema;
  }

  get value() {
    return `${this.table}.${this.tableColumn}`;
  }

  get isAttribute() {
    return this.table === 'attributes';
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
